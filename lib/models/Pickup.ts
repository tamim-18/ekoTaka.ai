import mongoose, { Schema, Document } from 'mongoose'

export interface IPickup extends Document {
  collectorId: string
  category: 'PET' | 'HDPE' | 'LDPE' | 'PP' | 'PS' | 'Other'
  estimatedWeight: number
  actualWeight?: number
  status: 'pending' | 'verified' | 'rejected' | 'paid'
  location: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
    address: string
  }
  photos: {
    before: {
      cloudinaryId: string
      url: string
    }
    after?: {
      cloudinaryId: string
      url: string
    }
  }
  verification?: {
    aiConfidence: number
    aiCategory: string
    aiWeight: number
    manualReview: boolean
    verifiedBy?: string
    verifiedAt?: Date
    rejectionReason?: string
  }
  statusHistory: Array<{
    status: string
    timestamp: Date
    notes?: string
    changedBy?: string
  }>
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const PickupSchema = new Schema<IPickup>(
  {
    collectorId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['PET', 'HDPE', 'LDPE', 'PP', 'PS', 'Other'],
      required: true,
    },
    estimatedWeight: {
      type: Number,
      required: true,
      min: 0,
    },
    actualWeight: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'paid'],
      default: 'pending',
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    photos: {
      before: {
        cloudinaryId: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
      after: {
        cloudinaryId: String,
        url: String,
      },
    },
    verification: {
      aiConfidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      aiCategory: String,
      aiWeight: Number,
      manualReview: {
        type: Boolean,
        default: false,
      },
      verifiedBy: String,
      verifiedAt: Date,
      rejectionReason: String,
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
        changedBy: String,
      },
    ],
    notes: String,
  },
  {
    timestamps: true,
  }
)

// Create 2dsphere index for geospatial queries
PickupSchema.index({ 'location.coordinates': '2dsphere' })
PickupSchema.index({ collectorId: 1, createdAt: -1 })

// Prevent model re-compilation during hot reload
const Pickup = mongoose.models.Pickup || mongoose.model<IPickup>('Pickup', PickupSchema)

export default Pickup

