import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Transaction, Order, User } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * POST /api/brand/payments/simulate
 * Simulate a payment for an order
 * Body:
 * - orderId: Order ID to pay for
 * - paymentMethod: bkash | nagad | bank_transfer | card
 * - amount: Payment amount (should match order totalAmount)
 * - simulateSuccess: boolean (optional, default: true) - whether to simulate success or failure
 */
export async function POST(request: NextRequest) {
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
    const { orderId, paymentMethod, amount, simulateSuccess = true } = body

    // Validation
    if (!orderId || !paymentMethod || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, paymentMethod, amount' },
        { status: 400 }
      )
    }

    const validPaymentMethods = ['bkash', 'nagad', 'bank_transfer', 'card']
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Find order
    const order = await Order.findOne({
      _id: orderId,
      brandId, // Ensure brand owns this order
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      )
    }

    // Validate amount matches order total
    if (Math.abs(amount - order.totalAmount) > 0.01) {
      return NextResponse.json(
        { error: `Amount mismatch. Order total: ৳${order.totalAmount}, Provided: ৳${amount}` },
        { status: 400 }
      )
    }

    // Simulate payment processing delay (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000))

    // Generate transaction ID (simulate real payment gateway format)
    const timestamp = Date.now()
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    let transactionId: string

    switch (paymentMethod) {
      case 'bkash':
        transactionId = `BK${timestamp}${randomSuffix}`
        break
      case 'nagad':
        transactionId = `NG${timestamp}${randomSuffix}`
        break
      case 'bank_transfer':
        transactionId = `BT${timestamp}${randomSuffix}`
        break
      case 'card':
        transactionId = `CD${timestamp}${randomSuffix}`
        break
      default:
        transactionId = `TX${timestamp}${randomSuffix}`
    }

    if (simulateSuccess) {
      // Create successful transaction
      const transaction = new Transaction({
        collectorId: order.collectorId,
        brandId,
        orderId: order._id.toString(),
        pickupId: order.pickupId,
        amount,
        paymentMethod,
        transactionId,
        status: 'completed',
        transactionType: 'brand_purchase',
        initiatedAt: new Date(),
        completedAt: new Date(),
        metadata: {
          paymentGateway: 'EkoTaka Payment Simulator',
          reference: order.orderId,
          orderReference: order.orderId,
          notes: 'Simulated payment - for testing purposes',
        },
      })

      await transaction.save()

      // Update order payment status
      order.paymentStatus = 'paid'
      order.transactionId = transactionId
      order.statusHistory.push({
        status: order.status,
        timestamp: new Date(),
        notes: `Payment completed via ${paymentMethod}`,
        changedBy: brandId,
        changedByRole: 'brand',
      })

      await order.save()

      logger.info('Payment simulated successfully', {
        brandId,
        orderId: order.orderId,
        transactionId,
        amount,
        paymentMethod,
      })

      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction._id.toString(),
          transactionId,
          orderId: order.orderId,
          amount,
          paymentMethod,
          status: 'completed',
          completedAt: transaction.completedAt.toISOString(),
        },
        order: {
          id: order._id.toString(),
          orderId: order.orderId,
          paymentStatus: order.paymentStatus,
        },
      })
    } else {
      // Simulate failed payment
      const transaction = new Transaction({
        collectorId: order.collectorId,
        brandId,
        orderId: order._id.toString(),
        pickupId: order.pickupId,
        amount,
        paymentMethod,
        transactionId,
        status: 'failed',
        transactionType: 'brand_purchase',
        initiatedAt: new Date(),
        failedAt: new Date(),
        failureReason: 'Simulated payment failure - insufficient funds',
        metadata: {
          paymentGateway: 'EkoTaka Payment Simulator',
          reference: order.orderId,
          orderReference: order.orderId,
          notes: 'Simulated payment failure - for testing purposes',
        },
      })

      await transaction.save()

      logger.info('Payment simulation failed', {
        brandId,
        orderId: order.orderId,
        transactionId,
        amount,
        paymentMethod,
      })

      return NextResponse.json({
        success: false,
        error: 'Payment failed: Insufficient funds',
        transaction: {
          id: transaction._id.toString(),
          transactionId,
          orderId: order.orderId,
          amount,
          paymentMethod,
          status: 'failed',
          failedAt: transaction.failedAt.toISOString(),
          failureReason: transaction.failureReason,
        },
      })
    }
  } catch (error) {
    logger.error('Error simulating payment', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

