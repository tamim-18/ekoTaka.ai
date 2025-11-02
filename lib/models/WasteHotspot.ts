import mongoose, { Schema, Document } from 'mongoose'

export interface IWasteHotspot extends Document {
  location: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
    address: string
  }
  status: 'active' | 'depleted' | 'expired'
  estimatedAvailable: {
    totalWeight: number // in kg
    categories: {
      PET?: number
      HDPE?: number
      LDPE?: number
      PP?: number
      PS?: number
      Other?: number
    }
  }
  reportedBy: string // collectorId
  reportedAt: Date
  lastUpdated: Date
  lastCollectedAt?: Date
  collectionHistory: Array<{
    collectorId: string
    pickupId: string
    weight: number
    category: string
    collectedAt: Date
  }>
  metadata: {
    description?: string
    photos?: Array<{
      url: string
      cloudinaryId?: string
    }>
    accessInstructions?: string
    reportedBy: 'collector' | 'authority' | 'brand'
    contactInfo?: string
  }
  createdAt: Date
  updatedAt: Date
}

const WasteHotspotSchema = new Schema<IWasteHotspot>(
  {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords: number[]) {
            return coords.length === 2 && 
                   typeof coords[0] === 'number' && 
                   typeof coords[1] === 'number' &&
                   coords[0] >= -180 && coords[0] <= 180 && // longitude
                   coords[1] >= -90 && coords[1] <= 90 // latitude
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
      address: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['active', 'depleted', 'expired'],
      default: 'active',
      index: true,
    },
    estimatedAvailable: {
      totalWeight: {
        type: Number,
        required: true,
        min: 0,
      },
      categories: {
        PET: Number,
        HDPE: Number,
        LDPE: Number,
        PP: Number,
        PS: Number,
        Other: Number,
      },
    },
    reportedBy: {
      type: String,
      required: true,
      index: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastCollectedAt: Date,
    collectionHistory: [
      {
        collectorId: {
          type: String,
          required: true,
        },
        pickupId: {
          type: String,
          required: true,
        },
        weight: {
          type: Number,
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        collectedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    metadata: {
      description: String,
      photos: [
        {
          url: String,
          cloudinaryId: String,
        },
      ],
      accessInstructions: String,
      reportedBy: {
        type: String,
        enum: ['collector', 'authority', 'brand'],
        default: 'collector',
      },
      contactInfo: String,
    },
  },
  {
    timestamps: true,
  }
)

// Create geospatial index for location-based queries
WasteHotspotSchema.index({ 'location.coordinates': '2dsphere' })
WasteHotspotSchema.index({ status: 1, lastUpdated: -1 })
WasteHotspotSchema.index({ reportedBy: 1 })

// Prevent model re-compilation during hot reload
const WasteHotspot =
  mongoose.models.WasteHotspot ||
  mongoose.model<IWasteHotspot>('WasteHotspot', WasteHotspotSchema)

export default WasteHotspot

