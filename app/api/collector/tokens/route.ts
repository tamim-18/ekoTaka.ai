import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase, EkoTokenTransaction, Pickup } from '@/lib/models'
import { getTokenBalance, recalculateTokenBalance } from '@/lib/services/token-service'
import { getNextMilestone } from '@/lib/services/token-calculator'
import { logger } from '@/lib/logger'

/**
 * GET /api/collector/tokens
 * Get token balance, recent transactions, and milestone progress
 */
export async function GET(request: NextRequest) {
  const requestStartTime = Date.now()

  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // Get current balance
    const balance = await getTokenBalance(userId)

    // Get verified pickup count for milestone calculation
    const verifiedPickupCount = await Pickup.countDocuments({
      collectorId: userId,
      status: { $in: ['verified', 'paid'] },
    })

    // Get next milestone
    const nextMilestone = getNextMilestone(verifiedPickupCount)

    // Get recent transactions (last 10)
    const recentTransactions = await EkoTokenTransaction.find({ collectorId: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    // Get total earned this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyResult = await EkoTokenTransaction.aggregate([
      {
        $match: {
          collectorId: userId,
          amount: { $gt: 0 }, // Only earned tokens
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])
    const monthlyEarned = monthlyResult[0]?.total || 0

    // Get earnings by source
    const earningsBySource = await EkoTokenTransaction.aggregate([
      {
        $match: {
          collectorId: userId,
          amount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ])

    logger.info('Token data fetched', {
      userId,
      balance,
      verifiedPickups: verifiedPickupCount,
      duration: `${Date.now() - requestStartTime}ms`,
    })

    return NextResponse.json({
      success: true,
      balance,
      verifiedPickupCount,
      nextMilestone,
      monthlyEarned,
      earningsBySource: earningsBySource.reduce((acc, item) => {
        acc[item._id] = { total: item.total, count: item.count }
        return acc
      }, {} as Record<string, { total: number; count: number }>),
      recentTransactions: recentTransactions.map((t: any) => ({
        id: t._id.toString(),
        amount: t.amount,
        type: t.type,
        source: t.source,
        description: t.description,
        balanceAfter: t.balanceAfter,
        metadata: t.metadata,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logger.error('Error fetching token data', error instanceof Error ? error : new Error(String(error)), { userId: await auth().then((a) => a.userId) })
    return NextResponse.json(
      {
        error: 'Failed to fetch token data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/collector/tokens/recalculate
 * Recalculate token balance (admin/internal use)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const balance = await recalculateTokenBalance(userId)

    return NextResponse.json({
      success: true,
      balance,
    })
  } catch (error) {
    logger.error('Error recalculating tokens', error instanceof Error ? error : new Error(String(error)), {
      userId: await auth().then((a) => a.userId),
    })
    return NextResponse.json(
      {
        error: 'Failed to recalculate tokens',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

