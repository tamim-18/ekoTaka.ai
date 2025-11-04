import mongoose, { Schema, Document } from 'mongoose'

export interface IBrandProfile extends Document {
  userId: string // User ID (from User model)
  companyInfo: {
    companyName: string
    companyType: 'manufacturer' | 'recycler' | 'brand' | 'other'
    businessLicense?: string
    taxId?: string
    website?: string
    logo?: {
      cloudinaryId: string
      url: string
    }
    description?: string
  }
  contactInfo: {
    email: string
    phone?: string
    address?: {
      street: string
      city: string
      district: string
      postalCode?: string
      country: string
    }
    contactPerson?: string
    contactPersonRole?: string
  }
  verification: {
    isVerified: boolean
    verifiedAt?: Date
    verificationLevel: 'basic' | 'verified' | 'premium'
    documents?: Array<{
      type: string // 'business_license', 'tax_certificate', etc.
      url: string
      uploadedAt: Date
    }>
    verificationNotes?: string
  }
  stats: {
    totalPurchases: number // Total number of orders
    totalSpent: number // Total amount spent (in BDT)
    activeOrders: number // Currently active orders
    completedOrders: number // Successfully completed orders
    cancelledOrders: number // Cancelled orders
    totalWeightPurchased: number // Total kg of plastic purchased
    totalCO2Impact: number // Total CO₂ impact from purchases
    averageOrderValue: number // Average order amount
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
    preferredCategories?: string[] // Preferred plastic categories
    preferredLocations?: string[] // Preferred collection locations
    autoOrderConfirmation?: boolean // Auto-confirm orders
  }
  billing: {
    billingAddress?: {
      street: string
      city: string
      district: string
      postalCode?: string
      country: string
    }
    paymentMethods?: Array<{
      type: 'bkash' | 'nagad' | 'bank_transfer' | 'card'
      details: string // Account number, card last 4 digits, etc.
      isDefault: boolean
    }>
  }
  createdAt: Date
  updatedAt: Date
}

const BrandProfileSchema = new Schema<IBrandProfile>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyInfo: {
      companyName: {
        type: String,
        required: true,
      },
      companyType: {
        type: String,
        enum: ['manufacturer', 'recycler', 'brand', 'other'],
        required: true,
        default: 'brand',
      },
      businessLicense: String,
      taxId: String,
      website: String,
      logo: {
        cloudinaryId: String,
        url: String,
      },
      description: String,
    },
    contactInfo: {
      email: {
        type: String,
        required: true,
      },
      phone: String,
      address: {
        street: String,
        city: String,
        district: String,
        postalCode: String,
        country: {
          type: String,
          default: 'Bangladesh',
        },
      },
      contactPerson: String,
      contactPersonRole: String,
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
      verificationNotes: String,
    },
    stats: {
      totalPurchases: {
        type: Number,
        default: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
      },
      activeOrders: {
        type: Number,
        default: 0,
      },
      completedOrders: {
        type: Number,
        default: 0,
      },
      cancelledOrders: {
        type: Number,
        default: 0,
      },
      totalWeightPurchased: {
        type: Number,
        default: 0,
      },
      totalCO2Impact: {
        type: Number,
        default: 0,
      },
      averageOrderValue: {
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
      preferredCategories: [String],
      preferredLocations: [String],
      autoOrderConfirmation: {
        type: Boolean,
        default: false,
      },
    },
    billing: {
      billingAddress: {
        street: String,
        city: String,
        district: String,
        postalCode: String,
        country: {
          type: String,
          default: 'Bangladesh',
        },
      },
      paymentMethods: [
        {
          type: {
            type: String,
            enum: ['bkash', 'nagad', 'bank_transfer', 'card'],
          },
          details: String,
          isDefault: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes
BrandProfileSchema.index({ userId: 1 })
BrandProfileSchema.index({ 'companyInfo.companyName': 1 })
BrandProfileSchema.index({ 'verification.isVerified': 1 })
BrandProfileSchema.index({ 'stats.totalSpent': -1 })

// Prevent model re-compilation during hot reload
const BrandProfile =
  mongoose.models.BrandProfile ||
  mongoose.model<IBrandProfile>('BrandProfile', BrandProfileSchema)

export default BrandProfile

