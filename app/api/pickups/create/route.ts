import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase, Pickup } from '@/lib/models'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { analyzePlasticImage } from '@/lib/gemini'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  logger.info('=== NEW PICKUP REQUEST RECEIVED ===')
  
  try {
    const { userId } = await auth()
    
    if (!userId) {
      logger.warn('Unauthorized pickup creation attempt', { userId })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.info('Authenticated user', { userId })
    
    const formData = await request.formData()
    logger.debug('Form data received', {
      hasBeforePhoto: !!formData.get('beforePhoto'),
      hasAfterPhoto: !!formData.get('afterPhoto'),
      category: formData.get('category'),
      weight: formData.get('weight'),
      hasAddress: !!formData.get('address'),
      hasNotes: !!formData.get('notes'),
      hasCoordinates: !!formData.get('coordinates')
    })
    
    const beforePhoto = formData.get('beforePhoto') as File | null
    const afterPhoto = formData.get('afterPhoto') as File | null
    const category = formData.get('category') as string
    const weight = parseFloat(formData.get('weight') as string)
    const address = formData.get('address') as string
    const notes = formData.get('notes') as string || ''
    const coordinatesStr = formData.get('coordinates') as string | null

    // Validate required fields
    if (!beforePhoto || !category || !weight || !address) {
      return NextResponse.json(
        { error: 'Missing required fields. Required: beforePhoto, category, weight, address' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['PET', 'HDPE', 'LDPE', 'PP', 'PS', 'Other']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate weight
    if (isNaN(weight) || weight <= 0 || weight > 1000) {
      return NextResponse.json(
        { error: 'Weight must be a number between 0 and 1000 kg' },
        { status: 400 }
      )
    }

    // Generate pickup ID early for folder naming
    const pickupId = `pickup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const folderPath = `ekotaka/pickups/${pickupId}`

    logger.info('Starting photo uploads to Cloudinary', { pickupId, folderPath })
    
    // Step 1: Upload photos to Cloudinary
    let beforePhotoResult
    let afterPhotoResult
    
    try {
      beforePhotoResult = await uploadToCloudinary(beforePhoto, `${folderPath}/before`)
      logger.success('Before photo uploaded', { publicId: beforePhotoResult.publicId })
      
      if (afterPhoto) {
        afterPhotoResult = await uploadToCloudinary(afterPhoto, `${folderPath}/after`)
        logger.success('After photo uploaded', { publicId: afterPhotoResult.publicId })
      }
    } catch (uploadError) {
      logger.error('Cloudinary upload failed', uploadError instanceof Error ? uploadError : new Error(String(uploadError)), {
        pickupId,
        hasAfterPhoto: !!afterPhoto
      })
      return NextResponse.json(
        { 
          error: 'Failed to upload photos',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown upload error'
        },
        { status: 500 }
      )
    }

    logger.info('Starting AI analysis with Gemini', { pickupId, userCategory: category, userWeight: weight })
    
    // Step 2: Analyze image with Gemini AI
    let aiAnalysis
    try {
      aiAnalysis = await analyzePlasticImage(beforePhoto, category, weight)
      logger.info('AI analysis completed', {
        pickupId,
        detectedCategory: aiAnalysis.detectedCategory,
        confidence: aiAnalysis.confidence,
        aiWeight: aiAnalysis.estimatedWeight
      })
    } catch (aiError) {
      logger.error('Gemini AI analysis failed', aiError instanceof Error ? aiError : new Error(String(aiError)), {
        pickupId
      })
      // Continue with user-provided data if AI fails, but flag for manual review
      aiAnalysis = {
        detectedCategory: null,
        confidence: 0.3,
        estimatedWeight: weight,
        reasoning: `AI analysis failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`,
        manualReviewRequired: true,
        detectedItems: [],
      }
      logger.warn('Using fallback AI analysis result', { pickupId, fallbackResult: aiAnalysis })
    }

    // Determine final category (AI detected vs user provided)
    const finalCategory = aiAnalysis.detectedCategory || (category as any)
    
    // Compare AI detection with user input
    const categoryMatch = aiAnalysis.detectedCategory === category
    const weightDifference = Math.abs(aiAnalysis.estimatedWeight - weight) / weight
    
    // Determine if manual review is needed
    const threshold = parseFloat(process.env.AI_VERIFICATION_THRESHOLD || '0.7')
    const needsManualReview = 
      aiAnalysis.manualReviewRequired ||
      aiAnalysis.confidence < threshold ||
      (!categoryMatch && aiAnalysis.confidence > 0.5) ||
      weightDifference > 0.3 // More than 30% weight difference

    // Step 3: Parse coordinates
    let coordinates: [number, number] | null = null
    if (coordinatesStr) {
      try {
        const parsed = JSON.parse(coordinatesStr) as [number, number]
        if (Array.isArray(parsed) && parsed.length === 2) {
          coordinates = parsed
        }
      } catch (e) {
        console.error('Error parsing coordinates:', e)
      }
    }

    // Default to Dhaka if no coordinates provided
    if (!coordinates) {
      coordinates = [90.4125, 23.8103] // Dhaka, Bangladesh
    }

    // Step 4: Create pickup document
    const pickupData = {
      collectorId: userId,
      category: finalCategory,
      estimatedWeight: weight,
      status: needsManualReview ? ('pending' as const) : ('verified' as const),
      location: {
        type: 'Point' as const,
        coordinates: coordinates,
        address: address,
      },
      photos: {
        before: {
          cloudinaryId: beforePhotoResult.cloudinaryId,
          url: beforePhotoResult.url,
        },
        ...(afterPhotoResult && {
          after: {
            cloudinaryId: afterPhotoResult.cloudinaryId,
            url: afterPhotoResult.url,
          },
        }),
      },
      verification: {
        aiConfidence: aiAnalysis.confidence,
        aiCategory: aiAnalysis.detectedCategory || category,
        aiWeight: aiAnalysis.estimatedWeight,
        manualReview: needsManualReview,
        verifiedBy: needsManualReview ? undefined : 'system',
        verifiedAt: needsManualReview ? undefined : new Date(),
        ...(needsManualReview && aiAnalysis.reasoning ? {
          rejectionReason: `Manual review required. ${aiAnalysis.reasoning}`,
        } : {}),
      },
      statusHistory: [
        {
          status: needsManualReview ? 'pending' : 'verified',
          timestamp: new Date(),
          notes: notes || undefined,
          changedBy: 'system',
        },
      ],
      notes: notes || undefined,
    }

    logger.info('Saving pickup to MongoDB', {
      pickupId,
      category: finalCategory,
      weight,
      status: needsManualReview ? 'pending' : 'verified',
      location: address
    })
    
    // Step 5: Save to MongoDB
    try {
      await connectToDatabase()
      
      const newPickup = new Pickup(pickupData)
      const saveStartTime = Date.now()
      const savedPickup = await newPickup.save()
      
      logger.success('Pickup saved to MongoDB', {
        pickupId: savedPickup._id.toString(),
        mongoId: savedPickup._id,
        saveDuration: `${Date.now() - saveStartTime}ms`
      })
      
      // Convert to plain object for response
      const responseData = {
        id: savedPickup._id.toString(),
        collectorId: savedPickup.collectorId,
        category: savedPickup.category,
        estimatedWeight: savedPickup.estimatedWeight,
        status: savedPickup.status,
        location: savedPickup.location,
        photos: savedPickup.photos,
        verification: {
          ...savedPickup.verification,
          verifiedAt: savedPickup.verification?.verifiedAt?.toISOString(),
        },
        statusHistory: savedPickup.statusHistory.map((h: any) => ({
          ...h,
          timestamp: h.timestamp.toISOString(),
        })),
        notes: savedPickup.notes,
        createdAt: savedPickup.createdAt.toISOString(),
        updatedAt: savedPickup.updatedAt.toISOString(),
      }

      return NextResponse.json({
        success: true,
        pickupId: responseData.id,
        pickup: responseData,
        aiAnalysis: {
          detectedCategory: aiAnalysis.detectedCategory,
          confidence: aiAnalysis.confidence,
          estimatedWeight: aiAnalysis.estimatedWeight,
          reasoning: aiAnalysis.reasoning,
          categoryMatch,
          weightDifference: weightDifference.toFixed(2),
        },
        message: needsManualReview 
          ? 'Pickup submitted! AI detected some discrepancies. It will be reviewed manually.'
          : 'Pickup verified and submitted successfully! AI analysis confirmed your submission.',
      })
      
      logger.success('=== PICKUP CREATION COMPLETED ===', {
        pickupId: responseData.id,
        status: responseData.status,
        totalDuration: `${Date.now() - requestStartTime}ms`,
        manualReview: needsManualReview
      })
    } catch (dbError) {
      logger.error('MongoDB save failed', dbError instanceof Error ? dbError : new Error(String(dbError)), {
        pickupId,
        totalDuration: `${Date.now() - requestStartTime}ms`
      })
      
      // If database save fails, we should ideally clean up Cloudinary uploads
      // For now, log the error and return failure
      return NextResponse.json(
        { 
          error: 'Failed to save pickup to database',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('=== PICKUP CREATION FAILED ===', error instanceof Error ? error : new Error(String(error)), {
      totalDuration: `${Date.now() - requestStartTime}ms`
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
