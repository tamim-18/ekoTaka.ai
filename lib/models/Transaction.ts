import mongoose, { Schema, Document } from 'mongoose'

export interface ITransaction extends Document {
  collectorId: string // Required - who receives the payment
  brandId?: string // Optional - who makes the payment (for brand purchases)
  pickupId?: string // Optional - pickup this transaction is for
  orderId?: string // Optional - order this transaction is for
  amount: number
  paymentMethod: 'bkash' | 'nagad' | 'bank_transfer' | 'card'
  transactionId: string // External payment gateway transaction ID
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  transactionType: 'collector_payment' | 'brand_purchase' // Who initiated the transaction
  initiatedAt: Date
  completedAt?: Date
  failedAt?: Date
  failureReason?: string
  metadata?: {
    paymentGateway?: string
    reference?: string
    notes?: string
    orderReference?: string // Reference to order if applicable
  }
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    collectorId: {
      type: String,
      required: true,
      index: true,
    },
    brandId: {
      type: String,
      index: true,
    },
    pickupId: {
      type: String,
      index: true,
    },
    orderId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['bkash', 'nagad', 'bank_transfer', 'card'],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    transactionType: {
      type: String,
      enum: ['collector_payment', 'brand_purchase'],
      default: 'collector_payment',
      index: true,
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: Date,
    failedAt: Date,
    failureReason: String,
    metadata: {
      paymentGateway: String,
      reference: String,
      notes: String,
      orderReference: String,
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for efficient queries
TransactionSchema.index({ collectorId: 1, createdAt: -1 })
TransactionSchema.index({ collectorId: 1, status: 1 })
TransactionSchema.index({ brandId: 1, createdAt: -1 })
TransactionSchema.index({ brandId: 1, status: 1 })
TransactionSchema.index({ pickupId: 1 })
TransactionSchema.index({ orderId: 1 })
TransactionSchema.index({ transactionType: 1 })

// Prevent model re-compilation during hot reload
const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema)

export default Transaction

