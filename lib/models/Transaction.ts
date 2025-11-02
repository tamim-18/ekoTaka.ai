import mongoose, { Schema, Document } from 'mongoose'

export interface ITransaction extends Document {
  collectorId: string
  pickupId: string
  amount: number
  paymentMethod: 'bkash' | 'nagad'
  transactionId: string // External payment gateway transaction ID
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  initiatedAt: Date
  completedAt?: Date
  failedAt?: Date
  failureReason?: string
  metadata?: {
    paymentGateway?: string
    reference?: string
    notes?: string
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
    pickupId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['bkash', 'nagad'],
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
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for efficient queries
TransactionSchema.index({ collectorId: 1, createdAt: -1 })
TransactionSchema.index({ collectorId: 1, status: 1 })
TransactionSchema.index({ pickupId: 1 })

// Prevent model re-compilation during hot reload
const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema)

export default Transaction

