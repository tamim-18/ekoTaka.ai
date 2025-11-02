import mongoose, { Schema, Document } from 'mongoose'

export interface IEkoTokenTransaction extends Document {
  collectorId: string
  amount: number // Positive = earned, negative = redeemed
  type: 'earned' | 'redeemed' | 'bonus' | 'penalty' | 'expired'
  source: 'pickup_verification' | 'milestone' | 'referral' | 'redemption' | 'bonus' | 'penalty'
  pickupId?: string // If earned from pickup verification
  description: string
  metadata?: {
    milestone?: string // e.g., "first_pickup", "10_pickups", "weekly_streak"
    category?: string // Plastic category if from pickup
    weight?: number // Weight if from pickup
    aiConfidence?: number // AI confidence if from pickup
    bonusReason?: string // Reason for bonus
    expiresAt?: Date // Expiration date if applicable
  }
  balanceAfter: number // Token balance after this transaction
  createdAt: Date
  updatedAt: Date
}

const EkoTokenTransactionSchema = new Schema<IEkoTokenTransaction>(
  {
    collectorId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'bonus', 'penalty', 'expired'],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['pickup_verification', 'milestone', 'referral', 'redemption', 'bonus', 'penalty'],
      required: true,
    },
    pickupId: {
      type: String,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      milestone: String,
      category: String,
      weight: Number,
      aiConfidence: Number,
      bonusReason: String,
      expiresAt: Date,
    },
    balanceAfter: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for efficient queries
EkoTokenTransactionSchema.index({ collectorId: 1, createdAt: -1 })
EkoTokenTransactionSchema.index({ collectorId: 1, type: 1 })
EkoTokenTransactionSchema.index({ pickupId: 1 })
EkoTokenTransactionSchema.index({ 'metadata.milestone': 1 })

// Prevent model re-compilation during hot reload
const EkoTokenTransaction =
  mongoose.models.EkoTokenTransaction ||
  mongoose.model<IEkoTokenTransaction>('EkoTokenTransaction', EkoTokenTransactionSchema)

export default EkoTokenTransaction

