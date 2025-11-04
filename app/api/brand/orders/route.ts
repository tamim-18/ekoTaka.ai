import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Order, Pickup, User, BrandProfile } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/brand/orders
 * Get all orders for the brand
 * Query params:
 * - status: Filter by status
 * - page: Page number
 * - limit: Items per page
 * - sortBy: Sort field (date, amount)
 * - sortOrder: asc or desc
 */
export async function GET(request: NextRequest) {
  const requestStartTime = Date.now()
  logger.info('=== BRAND ORDERS REQUEST ===')

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const skip = (page - 1) * limit

    // Build query
    const query: any = { brandId: userId }
    
    if (status && status !== 'all') {
      query.status = status
    }

    // Determine sort field
    let sortField = 'orderDate'
    if (sortBy === 'amount') {
      sortField = 'totalAmount'
    } else if (sortBy === 'date') {
      sortField = 'orderDate'
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1

    logger.debug('Fetching orders with query', { 
      brandId: userId, 
      status, 
      page, 
      limit 
    })

    // Fetch orders with pagination
    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ])

    // Enrich orders with pickup and collector info
    const enrichedOrders = await Promise.all(
      orders.map(async (order: any) => {
        const pickup = await Pickup.findById(order.pickupId).lean() as any
        const collector = await User.findById(order.collectorId).select('fullName email').lean() as any

        return {
          id: order._id.toString(),
          orderId: order.orderId,
          brandId: order.brandId,
          collectorId: order.collectorId,
          collectorName: collector?.fullName || 'Collector',
          collectorEmail: collector?.email,
          pickupId: order.pickupId,
          pickupCategory: pickup?.category,
          pickupLocation: pickup?.location,
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          totalAmount: order.totalAmount,
          status: order.status,
          orderDate: order.orderDate.toISOString(),
          confirmedAt: order.confirmedAt?.toISOString(),
          processingAt: order.processingAt?.toISOString(),
          shippedAt: order.shippedAt?.toISOString(),
          deliveredAt: order.deliveredAt?.toISOString(),
          cancelledAt: order.cancelledAt?.toISOString(),
          cancellationReason: order.cancellationReason,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          transactionId: order.transactionId,
          shippingAddress: order.shippingAddress,
          notes: order.notes,
          collectorNotes: order.collectorNotes,
          estimatedDeliveryDate: order.estimatedDeliveryDate?.toISOString(),
          actualDeliveryDate: order.actualDeliveryDate?.toISOString(),
          trackingNumber: order.trackingNumber,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        }
      })
    )

    logger.success('Orders fetched successfully', {
      count: enrichedOrders.length,
      total: totalCount,
      page,
      fetchDuration: `${Date.now() - requestStartTime}ms`
    })

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + orders.length < totalCount,
      },
    })
  } catch (error) {
    logger.error('Error fetching brand orders', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/brand/orders
 * Create a new order
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  logger.info('=== CREATE BRAND ORDER REQUEST ===')

  try {
    const tokenData = await getCurrentUser()

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const brandId = tokenData.userId

    await connectToDatabase()

    // Verify user is a brand
    const user = await User.findById(brandId)
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
      pickupId,
      quantity,
      unitPrice,
      shippingAddress,
      pickupLocation,
      notes,
      estimatedDeliveryDate,
    } = body

    // Validation
    if (!pickupId || !quantity || !unitPrice || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: pickupId, quantity, unitPrice, shippingAddress' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      )
    }

    if (unitPrice <= 0) {
      return NextResponse.json(
        { error: 'Unit price must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate pickup exists and is available
    const pickup = await Pickup.findById(pickupId)
    if (!pickup) {
      return NextResponse.json(
        { error: 'Pickup not found' },
        { status: 404 }
      )
    }

    if (pickup.status !== 'verified') {
      return NextResponse.json(
        { error: 'Pickup is not available for purchase. Only verified pickups can be ordered.' },
        { status: 400 }
      )
    }

    // Check available quantity
    const availableWeight = pickup.actualWeight || pickup.estimatedWeight || 0
    const activeOrders = await Order.find({
      pickupId,
      status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] },
    })
    const orderedQuantity = activeOrders.reduce((sum, o) => sum + o.quantity, 0)
    const availableQuantity = availableWeight - orderedQuantity

    if (quantity > availableQuantity) {
      return NextResponse.json(
        { 
          error: `Insufficient quantity. Available: ${availableQuantity.toFixed(2)} kg, Requested: ${quantity} kg` 
        },
        { status: 400 }
      )
    }

    // Get brand profile for shipping address defaults
    const brandProfile = await BrandProfile.findOne({ userId: brandId })

    // Calculate total amount
    const totalAmount = quantity * unitPrice

    // Create order
    const newOrder = new Order({
      brandId,
      collectorId: pickup.collectorId,
      pickupId,
      quantity,
      unitPrice,
      totalAmount,
      status: 'pending',
      orderDate: new Date(),
      paymentStatus: 'pending',
      shippingAddress: shippingAddress || brandProfile?.billing?.billingAddress,
      pickupLocation: pickupLocation || {
        type: 'Point',
        coordinates: pickup.location.coordinates,
        address: pickup.location.address,
      },
      notes,
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined,
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          notes: 'Order created',
          changedBy: brandId,
          changedByRole: 'brand',
        },
      ],
      metadata: {
        source: 'web',
      },
    })

    await newOrder.save()

    logger.success('Order created successfully', {
      orderId: newOrder.orderId,
      brandId,
      collectorId: pickup.collectorId,
      pickupId,
      quantity,
      totalAmount,
      duration: `${Date.now() - requestStartTime}ms`
    })

    return NextResponse.json({
      success: true,
      order: {
        id: newOrder._id.toString(),
        orderId: newOrder.orderId,
        brandId: newOrder.brandId,
        collectorId: newOrder.collectorId,
        pickupId: newOrder.pickupId,
        quantity: newOrder.quantity,
        unitPrice: newOrder.unitPrice,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        orderDate: newOrder.orderDate.toISOString(),
        paymentStatus: newOrder.paymentStatus,
        shippingAddress: newOrder.shippingAddress,
        notes: newOrder.notes,
        createdAt: newOrder.createdAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error creating order', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

