import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { connectToDatabase, CollectorProfile } from '@/lib/models'
import { Pickup } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/collector/profile
 * Get collector profile and stats
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get or create profile
    let profile = await CollectorProfile.findOne({ userId })

    // Get user info from Clerk
    const user = await currentUser()

    // If profile doesn't exist, create one
    if (!profile) {
      profile = new CollectorProfile({
        userId,
        personalInfo: {
          fullName: user?.fullName || user?.firstName || 'Collector',
        },
        stats: {
          memberSince: new Date(),
          lastStatsUpdate: new Date(),
        },
      })
      await profile.save()
      logger.info('Created new collector profile', { userId })
    }

    // Calculate stats from pickups if not recently updated (or if 0)
    const statsUpdateThreshold = 5 * 60 * 1000 // 5 minutes
    const timeSinceUpdate = Date.now() - profile.stats.lastStatsUpdate.getTime()

    if (profile.stats.totalPickups === 0 || timeSinceUpdate > statsUpdateThreshold) {
      await updateProfileStats(userId)
    }

    // Refresh profile from DB
    profile = await CollectorProfile.findOne({ userId })

    return NextResponse.json({
      success: true,
      profile: {
        userId: profile.userId,
        personalInfo: {
          ...profile.personalInfo,
          email: user?.primaryEmailAddress?.emailAddress,
        },
        verification: profile.verification,
        stats: profile.stats,
        preferences: profile.preferences,
        payment: profile.payment,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error fetching collector profile', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/collector/profile
 * Update collector profile
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const body = await request.json()
    const {
      personalInfo,
      preferences,
      payment,
    } = body

    // Update profile
    const updateData: any = {}
    
    if (personalInfo) {
      updateData['personalInfo'] = personalInfo
    }
    if (preferences) {
      updateData['preferences'] = preferences
    }
    if (payment) {
      updateData['payment'] = payment
    }

    const profile = await CollectorProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    )

    logger.info('Updated collector profile', { userId })

    return NextResponse.json({
      success: true,
      profile: {
        userId: profile.userId,
        personalInfo: profile.personalInfo,
        verification: profile.verification,
        stats: profile.stats,
        preferences: profile.preferences,
        payment: profile.payment,
        updatedAt: profile.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error updating collector profile', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to calculate and update profile stats from pickups
 */
async function updateProfileStats(userId: string) {
  try {
    // Get all pickups for this collector
    const pickups = await Pickup.find({ collectorId: userId })

    // Calculate stats
    const totalPickups = pickups.length
    const verifiedPickups = pickups.filter(p => p.status === 'verified' || p.status === 'paid')
    const verificationRate = totalPickups > 0 ? (verifiedPickups.length / totalPickups) * 100 : 0

    // Calculate total weight (use actualWeight if available, else estimatedWeight)
    const totalWeightCollected = pickups.reduce((sum, p) => {
      return sum + (p.actualWeight || p.estimatedWeight || 0)
    }, 0)

    // CO₂ saved: 1 kg plastic ≈ 1.4 kg CO₂
    const totalCO2Saved = totalWeightCollected * 1.4

    // Calculate earnings from transactions
    const { Transaction } = await import('@/lib/models')
    const completedTransactions = await Transaction.find({
      collectorId: userId,
      status: 'completed',
    })
    const totalEarnings = completedTransactions.reduce((sum, t) => sum + t.amount, 0)

    // Calculate tokens from token transactions
    const { EkoTokenTransaction } = await import('@/lib/models')
    const tokenResult = await EkoTokenTransaction.aggregate([
      { $match: { collectorId: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])
    const ekoTokens = tokenResult[0]?.total || 0

    // Update profile stats
    await CollectorProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          'stats.totalPickups': totalPickups,
          'stats.verificationRate': Math.round(verificationRate * 100) / 100,
          'stats.totalWeightCollected': Math.round(totalWeightCollected * 100) / 100,
          'stats.totalCO2Saved': Math.round(totalCO2Saved * 100) / 100,
          'stats.totalEarnings': totalEarnings,
          'stats.ekoTokens': ekoTokens,
          'stats.lastStatsUpdate': new Date(),
        },
      }
    )

    logger.info('Updated profile stats', { userId, totalPickups, totalWeightCollected })
  } catch (error) {
    logger.error('Error updating profile stats', error instanceof Error ? error : new Error(String(error)), { userId })
  }
}
