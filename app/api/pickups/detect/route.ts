import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { analyzePlasticImage } from '@/lib/gemini'
import { logger } from '@/lib/logger'

/**
 * API endpoint for AI plastic detection
 * Called by frontend after photo upload to auto-detect category and weight
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  logger.info('=== AI PLASTIC DETECTION REQUEST ===')
  
  try {
    const { userId } = await auth()
    
    if (!userId) {
      logger.warn('Unauthorized AI detection attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.info('Authenticated user requesting AI detection', { userId })

    const formData = await request.formData()
    const photo = formData.get('photo') as File | null

    if (!photo) {
      logger.warn('No photo provided for AI detection')
      return NextResponse.json(
        { error: 'Photo is required' },
        { status: 400 }
      )
    }

    logger.info('Starting AI detection', {
      fileName: photo.name,
      fileSize: `${(photo.size / 1024).toFixed(2)} KB`,
      mimeType: photo.type
    })

    // Analyze image with Gemini AI
    const aiAnalysis = await analyzePlasticImage(photo)

    logger.success('AI detection completed', {
      detectedCategory: aiAnalysis.detectedCategory,
      confidence: `${(aiAnalysis.confidence * 100).toFixed(1)}%`,
      estimatedWeight: `${aiAnalysis.estimatedWeight} kg`,
      totalDuration: `${Date.now() - requestStartTime}ms`
    })

    return NextResponse.json({
      success: true,
      detection: aiAnalysis,
      message: aiAnalysis.detectedCategory 
        ? `Detected: ${aiAnalysis.detectedCategory} with ${(aiAnalysis.confidence * 100).toFixed(1)}% confidence`
        : 'Could not detect plastic category. Please select manually.'
    })

  } catch (error) {
    logger.error('AI detection API error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

