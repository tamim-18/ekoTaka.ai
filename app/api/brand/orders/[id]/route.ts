import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Order, Pickup, User } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/brand/orders/[id]
 * Get order details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Handle Next.js 15 async params or legacy sync params
    const resolvedParams = params instanceof Promise ? await params : params
    const idString = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id

    // Find order
    const order = await Order.findOne({
      _id: idString,
      brandId: userId, // Ensure brand owns this order
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get related data
    const pickup = await Pickup.findById(order.pickupId).lean() as any
    const collector = await User.findById(order.collectorId).select('fullName email phone').lean() as any

    return NextResponse.json({
      success: true,
      order: {
        id: order._id.toString(),
        orderId: order.orderId,
        brandId: order.brandId,
        collectorId: order.collectorId,
        collector: {
          id: collector?._id?.toString() || order.collectorId,
          name: collector?.fullName || 'Collector',
          email: collector?.email,
          phone: collector?.phone,
        },
        pickupId: order.pickupId,
        pickup: pickup ? {
          id: pickup._id?.toString() || order.pickupId,
          category: pickup.category,
          estimatedWeight: pickup.estimatedWeight,
          actualWeight: pickup.actualWeight,
          location: pickup.location,
          photos: pickup.photos,
          verification: pickup.verification,
        } : null,
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
        pickupLocation: order.pickupLocation,
        notes: order.notes,
        collectorNotes: order.collectorNotes,
        estimatedDeliveryDate: order.estimatedDeliveryDate?.toISOString(),
        actualDeliveryDate: order.actualDeliveryDate?.toISOString(),
        trackingNumber: order.trackingNumber,
        statusHistory: order.statusHistory.map((entry: any) => ({
          status: entry.status,
          timestamp: entry.timestamp.toISOString(),
          notes: entry.notes,
          changedBy: entry.changedBy,
          changedByRole: entry.changedByRole,
        })),
        metadata: order.metadata,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error fetching order', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/brand/orders/[id]
 * Update order (cancel, update notes, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Handle Next.js 15 async params or legacy sync params
    const resolvedParams = params instanceof Promise ? await params : params
    const idString = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id

    const body = await request.json()
    const { action, notes, cancellationReason } = body

    // Find order
    const order = await Order.findOne({
      _id: idString,
      brandId: userId,
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Handle different actions
    if (action === 'cancel') {
      // Only allow cancellation if order is not already delivered or cancelled
      if (order.status === 'delivered') {
        return NextResponse.json(
          { error: 'Cannot cancel a delivered order' },
          { status: 400 }
        )
      }

      if (order.status === 'cancelled') {
        return NextResponse.json(
          { error: 'Order is already cancelled' },
          { status: 400 }
        )
      }

      order.status = 'cancelled'
      order.cancelledAt = new Date()
      order.cancellationReason = cancellationReason || 'Cancelled by brand'
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        notes: cancellationReason || 'Cancelled by brand',
        changedBy: userId,
        changedByRole: 'brand',
      })

      logger.info('Order cancelled', { orderId: order.orderId, brandId: userId })
    } else if (action === 'update_notes') {
      if (notes !== undefined) {
        order.notes = notes
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: cancel, update_notes' },
        { status: 400 }
      )
    }

    await order.save()

    return NextResponse.json({
      success: true,
      order: {
        id: order._id.toString(),
        orderId: order.orderId,
        status: order.status,
        cancelledAt: order.cancelledAt?.toISOString(),
        cancellationReason: order.cancellationReason,
        notes: order.notes,
        updatedAt: order.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error updating order', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/brand/orders/[id]
 * Cancel order (soft delete by setting status to cancelled)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Handle Next.js 15 async params or legacy sync params
    const resolvedParams = params instanceof Promise ? await params : params
    const idString = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id

    // Find order
    const order = await Order.findOne({
      _id: idString,
      brandId: userId,
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow cancellation if order is not already delivered or cancelled
    if (order.status === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot cancel a delivered order' },
        { status: 400 }
      )
    }

    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      )
    }

    // Cancel the order
    order.status = 'cancelled'
    order.cancelledAt = new Date()
    order.cancellationReason = 'Cancelled by brand'
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      notes: 'Cancelled by brand',
      changedBy: userId,
      changedByRole: 'brand',
    })

    await order.save()

    logger.info('Order cancelled via DELETE', { orderId: order.orderId, brandId: userId })

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: order._id.toString(),
        orderId: order.orderId,
        status: order.status,
        cancelledAt: order.cancelledAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error cancelling order', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to cancel order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

