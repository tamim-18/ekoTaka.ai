import mongoose, { Schema, Document } from 'mongoose'

export interface IConversation extends Document {
  participants: {
    brandId: string // User ID of the brand
    collectorId: string // User ID of the collector
  }
  lastMessage?: {
    messageId: string // Reference to the last Message document
    content: string // Preview of last message
    senderId: string // Who sent the last message
    senderRole: 'brand' | 'collector'
    sentAt: Date
  }
  lastMessageAt?: Date
  unreadCount: {
    brand: number // Unread messages for brand
    collector: number // Unread messages for collector
  }
  subject?: string // Optional conversation subject/title
  relatedOrderId?: string // If conversation is about a specific order
  relatedPickupId?: string // If conversation is about a specific pickup
  isArchived: {
    brand: boolean
    collector: boolean
  }
  createdAt: Date
  updatedAt: Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: {
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
    },
    lastMessage: {
      messageId: String,
      content: String,
      senderId: String,
      senderRole: {
        type: String,
        enum: ['brand', 'collector'],
      },
      sentAt: Date,
    },
    lastMessageAt: {
      type: Date,
      index: true,
    },
    unreadCount: {
      brand: {
        type: Number,
        default: 0,
      },
      collector: {
        type: Number,
        default: 0,
      },
    },
    subject: String,
    relatedOrderId: {
      type: String,
      index: true,
    },
    relatedPickupId: {
      type: String,
      index: true,
    },
    isArchived: {
      brand: {
        type: Boolean,
        default: false,
      },
      collector: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for efficient queries
ConversationSchema.index({ 'participants.brandId': 1, lastMessageAt: -1 })
ConversationSchema.index({ 'participants.collectorId': 1, lastMessageAt: -1 })
ConversationSchema.index({ 'participants.brandId': 1, 'participants.collectorId': 1 }, { unique: true })
ConversationSchema.index({ relatedOrderId: 1 })
ConversationSchema.index({ relatedPickupId: 1 })

// Prevent model re-compilation during hot reload
const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema)

export default Conversation

