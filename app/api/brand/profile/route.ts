import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, BrandProfile, User, Order } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/brand/profile
 * Get brand profile and stats
 */
export async function GET(request: NextRequest) {
  try {
    const tokenData = await getCurrentUser()

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = tokenData.userId

    await connectToDatabase()

    // Verify user is a brand
    const user = await User.findById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'brand') {
      return NextResponse.json(
        { error: 'Forbidden: Brand access only' },
        { status: 403 }
      )
    }

    // Get or create profile
    let profile = await BrandProfile.findOne({ userId })

    // If profile doesn't exist, create one
    if (!profile) {
      profile = new BrandProfile({
        userId,
        companyInfo: {
          companyName: user.fullName || 'Brand Company',
          companyType: 'brand',
        },
        contactInfo: {
          email: user.email,
          phone: user.phone,
        },
        stats: {
          memberSince: new Date(),
          lastStatsUpdate: new Date(),
        },
      })
      await profile.save()
      logger.info('Created new brand profile', { userId })
    }

    // Calculate stats from orders if not recently updated (or if 0)
    const statsUpdateThreshold = 5 * 60 * 1000 // 5 minutes
    const timeSinceUpdate = Date.now() - profile.stats.lastStatsUpdate.getTime()

    if (profile.stats.totalPurchases === 0 || timeSinceUpdate > statsUpdateThreshold) {
      await updateBrandProfileStats(userId)
    }

    // Refresh profile from DB
    profile = await BrandProfile.findOne({ userId })

    return NextResponse.json({
      success: true,
      profile: {
        userId: profile.userId,
        companyInfo: profile.companyInfo,
        contactInfo: {
          ...profile.contactInfo,
          email: user.email, // Ensure email is from User model
        },
        verification: profile.verification,
        stats: profile.stats,
        preferences: profile.preferences,
        billing: profile.billing,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error fetching brand profile', error instanceof Error ? error : new Error(String(error)))
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
 * PUT /api/brand/profile
 * Update brand profile
 */
export async function PUT(request: NextRequest) {
  try {
    const tokenData = await getCurrentUser()

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = tokenData.userId

    await connectToDatabase()

    // Verify user is a brand
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'brand') {
      return NextResponse.json(
        { error: 'Forbidden: Brand access only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      companyInfo,
      contactInfo,
      preferences,
      billing,
    } = body

    // Update profile
    const updateData: any = {}
    
    if (companyInfo) {
      updateData['companyInfo'] = companyInfo
    }
    if (contactInfo) {
      updateData['contactInfo'] = contactInfo
    }
    if (preferences) {
      updateData['preferences'] = preferences
    }
    if (billing) {
      updateData['billing'] = billing
    }

    const profile = await BrandProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    )

    logger.info('Updated brand profile', { userId })

    return NextResponse.json({
      success: true,
      profile: {
        userId: profile.userId,
        companyInfo: profile.companyInfo,
        contactInfo: profile.contactInfo,
        verification: profile.verification,
        stats: profile.stats,
        preferences: profile.preferences,
        billing: profile.billing,
        updatedAt: profile.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error updating brand profile', error instanceof Error ? error : new Error(String(error)))
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
 * Helper function to calculate and update brand profile stats from orders
 */
async function updateBrandProfileStats(userId: string) {
  try {
    // Get all orders for this brand
    const orders = await Order.find({ brandId: userId })

    // Calculate stats
    const totalPurchases = orders.length
    const activeOrders = orders.filter(o => 
      ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)
    ).length
    const completedOrders = orders.filter(o => o.status === 'delivered').length
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length

    // Calculate total spent (only from completed orders)
    const completedOrdersList = orders.filter(o => o.status === 'delivered')
    const totalSpent = completedOrdersList.reduce((sum, o) => sum + o.totalAmount, 0)

    // Calculate total weight purchased
    const totalWeightPurchased = completedOrdersList.reduce((sum, o) => sum + o.quantity, 0)

    // CO₂ impact: 1 kg plastic ≈ 1.4 kg CO₂ saved
    const totalCO2Impact = totalWeightPurchased * 1.4

    // Calculate average order value
    const averageOrderValue = completedOrdersList.length > 0 
      ? totalSpent / completedOrdersList.length 
      : 0

    // Update profile stats
    await BrandProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          'stats.totalPurchases': totalPurchases,
          'stats.totalSpent': Math.round(totalSpent * 100) / 100,
          'stats.activeOrders': activeOrders,
          'stats.completedOrders': completedOrders,
          'stats.cancelledOrders': cancelledOrders,
          'stats.totalWeightPurchased': Math.round(totalWeightPurchased * 100) / 100,
          'stats.totalCO2Impact': Math.round(totalCO2Impact * 100) / 100,
          'stats.averageOrderValue': Math.round(averageOrderValue * 100) / 100,
          'stats.lastStatsUpdate': new Date(),
        },
      }
    )

    logger.info('Updated brand profile stats', { 
      userId, 
      totalPurchases, 
      totalSpent,
      activeOrders 
    })
  } catch (error) {
    logger.error('Error updating brand profile stats', error instanceof Error ? error : new Error(String(error)), { userId })
  }
}

