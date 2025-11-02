import mongoose, { Schema, Document } from 'mongoose'

export interface ICollectorProfile extends Document {
  userId: string // Clerk user ID
  personalInfo: {
    fullName?: string
    phone?: string
    address?: string
    profilePhoto?: {
      cloudinaryId: string
      url: string
    }
    bio?: string
  }
  verification: {
    isVerified: boolean
    verifiedAt?: Date
    verificationLevel: 'basic' | 'verified' | 'premium'
    documents?: Array<{
      type: string
      url: string
      uploadedAt: Date
    }>
  }
  stats: {
    totalPickups: number
    totalEarnings: number
    totalWeightCollected: number
    totalCO2Saved: number
    ekoTokens: number
    verificationRate: number
    memberSince: Date
    lastStatsUpdate: Date
  }
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    language: 'en' | 'bn'
    currency: string
  }
  payment: {
    bkasNumber?: string
    nagadNumber?: string
    accountName?: string
  }
  createdAt: Date
  updatedAt: Date
}

const CollectorProfileSchema = new Schema<ICollectorProfile>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    personalInfo: {
      fullName: String,
      phone: String,
      address: String,
      profilePhoto: {
        cloudinaryId: String,
        url: String,
      },
      bio: String,
    },
    verification: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
      verificationLevel: {
        type: String,
        enum: ['basic', 'verified', 'premium'],
        default: 'basic',
      },
      documents: [
        {
          type: String,
          url: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    stats: {
      totalPickups: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      totalWeightCollected: {
        type: Number,
        default: 0,
      },
      totalCO2Saved: {
        type: Number,
        default: 0,
      },
      ekoTokens: {
        type: Number,
        default: 0,
      },
      verificationRate: {
        type: Number,
        default: 0,
      },
      memberSince: {
        type: Date,
        default: Date.now,
      },
      lastStatsUpdate: {
        type: Date,
        default: Date.now,
      },
    },
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      },
      language: {
        type: String,
        enum: ['en', 'bn'],
        default: 'en',
      },
      currency: {
        type: String,
        default: 'BDT',
      },
    },
    payment: {
      bkasNumber: String,
      nagadNumber: String,
      accountName: String,
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes
CollectorProfileSchema.index({ userId: 1 })

// Prevent model re-compilation during hot reload
const CollectorProfile =
  mongoose.models.CollectorProfile ||
  mongoose.model<ICollectorProfile>('CollectorProfile', CollectorProfileSchema)

export default CollectorProfile

