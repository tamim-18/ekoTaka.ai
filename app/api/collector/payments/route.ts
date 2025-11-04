import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Transaction, CollectorProfile } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/collector/payments
 * Get payment transactions for the collector
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - status: Filter by status (pending, processing, completed, failed, cancelled)
 * - paymentMethod: Filter by payment method (bkash, nagad)
 * - startDate: Filter from date (ISO string)
 * - endDate: Filter to date (ISO string)
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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build query
    const query: any = { collectorId: userId }

    if (status) {
      query.status = status
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod
    }

    if (startDate || endDate) {
      query.initiatedAt = {}
      if (startDate) {
        query.initiatedAt.$gte = new Date(startDate)
      }
      if (endDate) {
        query.initiatedAt.$lte = new Date(endDate)
      }
    }

    // Fetch transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .sort({ initiatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ])

    // Calculate payment statistics
    const stats = await Transaction.aggregate([
      { $match: { collectorId: userId } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ])

    // Calculate totals
    const totalEarnings = await Transaction.aggregate([
      { $match: { collectorId: userId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    const pendingEarnings = await Transaction.aggregate([
      { $match: { collectorId: userId, status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    // Get payment info from profile
    const profile = await CollectorProfile.findOne({ userId }).lean() as any

    logger.info('Fetched payments', {
      userId,
      transactionCount: transactions.length,
      total: totalCount,
      page,
    })

    return NextResponse.json({
      success: true,
      transactions: transactions.map((txn: any) => ({
        id: txn._id.toString(),
        pickupId: txn.pickupId,
        amount: txn.amount,
        paymentMethod: txn.paymentMethod,
        transactionId: txn.transactionId,
        status: txn.status,
        initiatedAt: txn.initiatedAt.toISOString(),
        completedAt: txn.completedAt?.toISOString(),
        failedAt: txn.failedAt?.toISOString(),
        failureReason: txn.failureReason,
        metadata: txn.metadata,
        createdAt: txn.createdAt.toISOString(),
        updatedAt: txn.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalEarnings: totalEarnings[0]?.total || 0,
        pendingEarnings: pendingEarnings[0]?.total || 0,
        byStatus: stats.reduce((acc: any, stat: any) => {
          acc[stat._id] = {
            total: stat.total,
            count: stat.count,
          }
          return acc
        }, {}),
      },
      paymentMethods: {
        bkash: profile?.payment?.bkasNumber || null,
        nagad: profile?.payment?.nagadNumber || null,
        accountName: profile?.payment?.accountName || null,
      },
    })
  } catch (error) {
    logger.error('Error fetching payments', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to fetch payments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

