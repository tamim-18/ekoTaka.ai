import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/models'

export async function GET() {
  try {
    await connectToDatabase()
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful!',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('MongoDB connection error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

