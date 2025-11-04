import mongoose from 'mongoose'
import { logger } from '../logger'

// Support both MONGO_URI and MONGODB_URI for compatibility
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local as MONGO_URI or MONGODB_URI')
}

let isConnected = false

export async function connectToDatabase() {
  // If already connected, return early
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (isConnected && mongoose.connection.readyState === 1) {
    return
  }

  // If connection is in progress, wait for it
  if (mongoose.connection.readyState === 2) {
    await new Promise<void>((resolve, reject) => {
      mongoose.connection.once('connected', () => {
        isConnected = true
        resolve()
      })
      mongoose.connection.once('error', reject)
    })
    return
  }

  try {
    // Connect to MongoDB using Mongoose
    // MONGODB_URI is guaranteed to be defined due to the check above
    const uri = MONGODB_URI!
    logger.info('Connecting to MongoDB', { uri: uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') })
    const connectStartTime = Date.now()
    
    await mongoose.connect(uri, {
      bufferCommands: false,
    })
    
    isConnected = true
    logger.success('Connected to MongoDB', {
      duration: `${Date.now() - connectStartTime}ms`,
      database: mongoose.connection.db?.databaseName || 'unknown'
    })
  } catch (error) {
    logger.error('MongoDB connection failed', error instanceof Error ? error : new Error(String(error)), {
      uri: MONGODB_URI!.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
    })
    isConnected = false
    throw error
  }
}

export { default as User } from './User'
export { default as Pickup } from './Pickup'
export { default as CollectorProfile } from './CollectorProfile'
export { default as BrandProfile } from './BrandProfile'
export { default as Order } from './Order'
export { default as WasteHotspot } from './WasteHotspot'
export { default as Transaction } from './Transaction'
export { default as EkoTokenTransaction } from './EkoTokenTransaction'
export { default as Conversation } from './Conversation'
export { default as Message } from './Message'

