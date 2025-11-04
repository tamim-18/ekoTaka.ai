import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Transaction, User, Order } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/brand/transactions
 * Get payment transactions for the brand
 * Query params:
 * - status: Filter by status (pending, processing, completed, failed, cancelled)
 * - paymentMethod: Filter by payment method (bkash, nagad, bank_transfer, card)
 * - startDate: Filter from date (ISO string)
 * - endDate: Filter to date (ISO string)
 * - page: Page number
 * - limit: Items per page
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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build query - only brand-initiated transactions
    const query: any = { 
      brandId: userId,
      transactionType: 'brand_purchase',
    }

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

    // Enrich transactions with order and collector info
    const enrichedTransactions = await Promise.all(
      transactions.map(async (txn: any) => {
        const order = txn.orderId ? await Order.findById(txn.orderId).lean() as any : null
        const collector = await User.findById(txn.collectorId).select('fullName email').lean() as any

        return {
          id: txn._id.toString(),
          orderId: txn.orderId,
          orderNumber: order ? (order as any).orderId : null,
          pickupId: txn.pickupId,
          collectorId: txn.collectorId,
          collectorName: collector?.fullName || 'Collector',
          amount: txn.amount,
          paymentMethod: txn.paymentMethod,
          transactionId: txn.transactionId,
          status: txn.status,
          transactionType: txn.transactionType,
          initiatedAt: txn.initiatedAt.toISOString(),
          completedAt: txn.completedAt?.toISOString(),
          failedAt: txn.failedAt?.toISOString(),
          failureReason: txn.failureReason,
          metadata: txn.metadata,
          createdAt: txn.createdAt.toISOString(),
          updatedAt: txn.updatedAt.toISOString(),
        }
      })
    )

    // Calculate payment statistics
    const stats = await Transaction.aggregate([
      { $match: { brandId: userId, transactionType: 'brand_purchase' } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ])

    // Calculate totals
    const totalSpent = await Transaction.aggregate([
      { $match: { brandId: userId, transactionType: 'brand_purchase', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    const pendingPayments = await Transaction.aggregate([
      { $match: { brandId: userId, transactionType: 'brand_purchase', status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    logger.info('Fetched brand transactions', {
      userId,
      transactionCount: transactions.length,
      total: totalCount,
      page,
    })

    return NextResponse.json({
      success: true,
      transactions: enrichedTransactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalSpent: totalSpent[0]?.total || 0,
        pendingPayments: pendingPayments[0]?.total || 0,
        byStatus: stats.reduce((acc: any, stat: any) => {
          acc[stat._id] = {
            total: stat.total,
            count: stat.count,
          }
          return acc
        }, {}),
      },
    })
  } catch (error) {
    logger.error('Error fetching brand transactions', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

