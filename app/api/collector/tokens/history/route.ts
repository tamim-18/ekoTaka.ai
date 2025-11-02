import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase, EkoTokenTransaction } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/collector/tokens/history
 * Get paginated token transaction history with filters
 */
export async function GET(request: NextRequest) {
  const requestStartTime = Date.now()

  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const type = searchParams.get('type') // 'earned' | 'redeemed' | 'bonus' | 'penalty'
    const source = searchParams.get('source') // 'pickup_verification' | 'milestone' | etc.
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build filter
    const filter: any = { collectorId: userId }

    if (type) {
      filter.type = type
    }

    if (source) {
      filter.source = source
    }

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate)
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count
    const total = await EkoTokenTransaction.countDocuments(filter)

    // Get transactions
    const transactions = await EkoTokenTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Calculate summary stats
    const summaryResult = await EkoTokenTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEarned: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, '$amount', 0],
            },
          },
          totalRedeemed: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0],
            },
          },
          totalTransactions: { $sum: 1 },
        },
      },
    ])

    const summary = summaryResult[0] || {
      totalEarned: 0,
      totalRedeemed: 0,
      totalTransactions: 0,
    }

    logger.info('Token history fetched', {
      userId,
      page,
      limit,
      total,
      duration: `${Date.now() - requestStartTime}ms`,
    })

    return NextResponse.json({
      success: true,
      transactions: transactions.map((t: any) => ({
        id: t._id.toString(),
        amount: t.amount,
        type: t.type,
        source: t.source,
        pickupId: t.pickupId,
        description: t.description,
        balanceAfter: t.balanceAfter,
        metadata: t.metadata,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      summary: {
        totalEarned: summary.totalEarned,
        totalRedeemed: summary.totalRedeemed,
        totalTransactions: summary.totalTransactions,
      },
    })
  } catch (error) {
    logger.error('Error fetching token history', error instanceof Error ? error : new Error(String(error)), {
      userId: await auth().then((a) => a.userId),
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch token history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

