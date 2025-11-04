import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  conversationId: string // Reference to Conversation document
  senderId: string // User ID of the sender
  senderRole: 'brand' | 'collector'
  content: string // Message text content
  readAt?: Date // When the message was read by recipient
  readBy?: {
    brand?: Date // When brand read it
    collector?: Date // When collector read it
  }
  attachments?: Array<{
    type: 'image' | 'document' | 'file'
    url: string
    filename?: string
    size?: number
    cloudinaryId?: string
  }>
  isEdited: boolean
  editedAt?: Date
  isDeleted: boolean
  deletedAt?: Date
  metadata?: {
    systemMessage?: boolean // If it's a system-generated message
    orderUpdate?: boolean // If message is about order update
    pickupUpdate?: boolean // If message is about pickup update
  }
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['brand', 'collector'],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    readAt: Date,
    readBy: {
      brand: Date,
      collector: Date,
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'document', 'file'],
        },
        url: String,
        filename: String,
        size: Number,
        cloudinaryId: String,
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    metadata: {
      systemMessage: Boolean,
      orderUpdate: Boolean,
      pickupUpdate: Boolean,
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 })
MessageSchema.index({ senderId: 1, createdAt: -1 })
MessageSchema.index({ conversationId: 1, readAt: 1 })
MessageSchema.index({ createdAt: -1 })

// Prevent model re-compilation during hot reload
const Message =
  mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema)

export default Message

