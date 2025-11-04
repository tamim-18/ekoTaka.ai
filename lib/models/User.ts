import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  password: string // Hashed
  role: 'collector' | 'brand'
  fullName: string
  phone?: string
  isEmailVerified: boolean
  emailVerificationToken?: string
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['collector', 'brand'],
      required: true,
      default: 'collector',
      index: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes
UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })

// Prevent model re-compilation during hot reload
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User

