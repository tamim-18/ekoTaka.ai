import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Order, Transaction, User, Pickup } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/brand/analytics
 * Get analytics data for the brand
 * Query params:
 * - startDate: Start date for analytics (ISO string)
 * - endDate: End date for analytics (ISO string)
 * - period: Period type (daily, weekly, monthly) - for grouping
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'monthly' // daily, weekly, monthly

    // Default to last 12 months if no dates provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date()
    start.setMonth(start.getMonth() - 12)

    // Build date filter
    const dateFilter = {
      orderDate: {
        $gte: start,
        $lte: end,
      },
    }

    // Get all orders in date range
    const orders = await Order.find({
      brandId: userId,
      ...dateFilter,
    }).lean()

    // Get all transactions in date range
    const transactions = await Transaction.find({
      brandId: userId,
      transactionType: 'brand_purchase',
      initiatedAt: {
        $gte: start,
        $lte: end,
      },
    }).lean()

    // Calculate spending trends (grouped by period)
    const spendingTrends = calculateSpendingTrends(orders, start, end, period)

    // Category breakdown
    const categoryBreakdown = await calculateCategoryBreakdown(orders)

    // Purchase volume over time
    const purchaseVolume = calculatePurchaseVolume(orders, start, end, period)

    // Top collectors
    const topCollectors = await calculateTopCollectors(orders)

    // CO₂ impact
    const co2Impact = calculateCO2Impact(orders)

    // Summary stats
    const summary = {
      totalOrders: orders.length,
      completedOrders: orders.filter((o: any) => o.status === 'delivered').length,
      totalSpent: transactions
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, t: any) => sum + t.amount, 0),
      totalWeightPurchased: orders
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + o.quantity, 0),
      averageOrderValue: orders.length > 0
        ? orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0) / orders.length
        : 0,
      activeOrders: orders.filter((o: any) => 
        ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)
      ).length,
    }

    logger.info('Analytics fetched', {
      userId,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      totalOrders: orders.length,
    })

    return NextResponse.json({
      success: true,
      analytics: {
        summary,
        spendingTrends,
        categoryBreakdown,
        purchaseVolume,
        topCollectors,
        co2Impact,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        period,
      },
    })
  } catch (error) {
    logger.error('Error fetching brand analytics', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate spending trends grouped by period
 */
function calculateSpendingTrends(
  orders: any[],
  start: Date,
  end: Date,
  period: string
): Array<{ date: string; amount: number; count: number }> {
  const trends: Record<string, { amount: number; count: number }> = {}
  
  orders.forEach((order: any) => {
    const orderDate = new Date(order.orderDate)
    let key: string

    if (period === 'daily') {
      key = orderDate.toISOString().split('T')[0]
    } else if (period === 'weekly') {
      const weekStart = new Date(orderDate)
      weekStart.setDate(orderDate.getDate() - orderDate.getDay())
      key = weekStart.toISOString().split('T')[0]
    } else {
      // monthly
      key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
    }

    if (!trends[key]) {
      trends[key] = { amount: 0, count: 0 }
    }
    trends[key].amount += order.totalAmount
    trends[key].count += 1
  })

  return Object.keys(trends)
    .sort()
    .map(key => ({
      date: key,
      amount: Math.round(trends[key].amount * 100) / 100,
      count: trends[key].count,
    }))
}

/**
 * Calculate category breakdown
 */
async function calculateCategoryBreakdown(orders: any[]): Promise<Array<{ category: string; weight: number; orders: number; amount: number }>> {
  const breakdown: Record<string, { weight: number; orders: number; amount: number }> = {}

  await Promise.all(
    orders.map(async (order: any) => {
      const pickup = await Pickup.findById(order.pickupId).lean() as any
      if (!pickup) return

      const category = pickup.category || 'Other'
      if (!breakdown[category]) {
        breakdown[category] = { weight: 0, orders: 0, amount: 0 }
      }
      breakdown[category].weight += order.quantity
      breakdown[category].orders += 1
      breakdown[category].amount += order.totalAmount
    })
  )

  return Object.keys(breakdown).map(category => ({
    category,
    weight: Math.round(breakdown[category].weight * 100) / 100,
    orders: breakdown[category].orders,
    amount: Math.round(breakdown[category].amount * 100) / 100,
  }))
}

/**
 * Calculate purchase volume over time
 */
function calculatePurchaseVolume(
  orders: any[],
  start: Date,
  end: Date,
  period: string
): Array<{ date: string; weight: number; count: number }> {
  const volume: Record<string, { weight: number; count: number }> = {}
  
  orders.forEach((order: any) => {
    const orderDate = new Date(order.orderDate)
    let key: string

    if (period === 'daily') {
      key = orderDate.toISOString().split('T')[0]
    } else if (period === 'weekly') {
      const weekStart = new Date(orderDate)
      weekStart.setDate(orderDate.getDate() - orderDate.getDay())
      key = weekStart.toISOString().split('T')[0]
    } else {
      key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
    }

    if (!volume[key]) {
      volume[key] = { weight: 0, count: 0 }
    }
    volume[key].weight += order.quantity
    volume[key].count += 1
  })

  return Object.keys(volume)
    .sort()
    .map(key => ({
      date: key,
      weight: Math.round(volume[key].weight * 100) / 100,
      count: volume[key].count,
    }))
}

/**
 * Calculate top collectors
 */
async function calculateTopCollectors(orders: any[]): Promise<Array<{ collectorId: string; collectorName: string; orders: number; totalAmount: number; totalWeight: number }>> {
  const collectorStats: Record<string, { orders: number; totalAmount: number; totalWeight: number }> = {}

  await Promise.all(
    orders.map(async (order: any) => {
      const collectorId = order.collectorId
      if (!collectorStats[collectorId]) {
        collectorStats[collectorId] = { orders: 0, totalAmount: 0, totalWeight: 0 }
      }
      collectorStats[collectorId].orders += 1
      collectorStats[collectorId].totalAmount += order.totalAmount
      collectorStats[collectorId].totalWeight += order.quantity
    })
  )

  // Get collector names
  const topCollectorsData = await Promise.all(
    Object.keys(collectorStats).map(async (collectorId) => {
      const collector = await User.findById(collectorId).select('fullName').lean() as any
      return {
        collectorId,
        collectorName: collector?.fullName || 'Collector',
        orders: collectorStats[collectorId].orders,
        totalAmount: Math.round(collectorStats[collectorId].totalAmount * 100) / 100,
        totalWeight: Math.round(collectorStats[collectorId].totalWeight * 100) / 100,
      }
    })
  )

  return topCollectorsData
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10) // Top 10
}

/**
 * Calculate CO₂ impact
 */
function calculateCO2Impact(orders: any[]): {
  totalCO2Saved: number
  totalWeightPurchased: number
  averageCO2PerKg: number
} {
  const completedOrders = orders.filter((o: any) => o.status === 'delivered')
  const totalWeightPurchased = completedOrders.reduce((sum: number, o: any) => sum + o.quantity, 0)
  const totalCO2Saved = totalWeightPurchased * 1.4 // 1 kg plastic ≈ 1.4 kg CO₂
  const averageCO2PerKg = 1.4

  return {
    totalCO2Saved: Math.round(totalCO2Saved * 100) / 100,
    totalWeightPurchased: Math.round(totalWeightPurchased * 100) / 100,
    averageCO2PerKg,
  }
}

