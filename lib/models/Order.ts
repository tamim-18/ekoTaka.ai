import mongoose, { Schema, Document } from 'mongoose'

export interface IOrder extends Document {
  orderId: string // Unique order identifier (e.g., ORD-2024-001234)
  brandId: string // User ID of the brand placing the order
  collectorId: string // User ID of the collector selling
  pickupId: string // Reference to the Pickup being ordered
  quantity: number // Weight in kg being ordered
  unitPrice: number // Price per kg (in BDT)
  totalAmount: number // Total order amount (quantity * unitPrice)
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  orderDate: Date
  confirmedAt?: Date
  processingAt?: Date
  shippedAt?: Date
  deliveredAt?: Date
  cancelledAt?: Date
  cancellationReason?: string
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed'
  paymentMethod?: 'bkash' | 'nagad' | 'bank_transfer' | 'card'
  transactionId?: string // Reference to Transaction document
  shippingAddress: {
    street: string
    city: string
    district: string
    postalCode?: string
    country: string
    contactPerson?: string
    contactPhone?: string
  }
  pickupLocation?: {
    // Location where collector should deliver/pickup
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
    address: string
  }
  notes?: string // Order notes from brand
  collectorNotes?: string // Notes from collector
  estimatedDeliveryDate?: Date
  actualDeliveryDate?: Date
  trackingNumber?: string
  statusHistory: Array<{
    status: string
    timestamp: Date
    notes?: string
    changedBy: string // User ID who changed the status
    changedByRole: 'brand' | 'collector' | 'system'
  }>
  metadata?: {
    source?: string // Where order was created (web, app, etc.)
    discount?: number
    tax?: number
    shippingCost?: number
    reference?: string // External reference number
  }
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    brandId: {
      type: String,
      required: true,
      index: true,
    },
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
    quantity: {
      type: Number,
      required: true,
      min: 0.1, // Minimum 0.1 kg
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    confirmedAt: Date,
    processingAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['bkash', 'nagad', 'bank_transfer', 'card'],
    },
    transactionId: {
      type: String,
      index: true,
    },
    shippingAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      district: {
        type: String,
        required: true,
      },
      postalCode: String,
      country: {
        type: String,
        default: 'Bangladesh',
      },
      contactPerson: String,
      contactPhone: String,
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: String,
    },
    notes: String,
    collectorNotes: String,
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    trackingNumber: String,
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
        changedBy: {
          type: String,
          required: true,
        },
        changedByRole: {
          type: String,
          enum: ['brand', 'collector', 'system'],
          required: true,
        },
      },
    ],
    metadata: {
      source: String,
      discount: Number,
      tax: Number,
      shippingCost: Number,
      reference: String,
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for efficient queries
OrderSchema.index({ brandId: 1, createdAt: -1 })
OrderSchema.index({ collectorId: 1, createdAt: -1 })
OrderSchema.index({ brandId: 1, status: 1 })
OrderSchema.index({ collectorId: 1, status: 1 })
OrderSchema.index({ pickupId: 1 })
OrderSchema.index({ orderDate: -1 })
OrderSchema.index({ paymentStatus: 1 })

// Generate unique order ID before saving
OrderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    // Generate order ID: ORD-YYYY-MMDDHHmm-XXXX
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    this.orderId = `ORD-${year}-${month}${day}${hours}${minutes}-${random}`
  }
  next()
})

// Prevent model re-compilation during hot reload
const Order =
  mongoose.models.Order ||
  mongoose.model<IOrder>('Order', OrderSchema)

export default Order

