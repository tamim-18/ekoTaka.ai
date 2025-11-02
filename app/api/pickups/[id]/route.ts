import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase, Pickup } from '@/lib/models'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const requestStartTime = Date.now()
  
  // Handle Next.js 15 async params or legacy sync params
  const resolvedParams = params instanceof Promise ? await params : params
  const idString = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id
  
  logger.info('=== FETCH PICKUP BY ID REQUEST ===', { 
    pickupId: idString,
    rawParams: resolvedParams.id,
    isArray: Array.isArray(resolvedParams.id)
  })

  try {
    const { userId } = await auth()

    if (!userId) {
      logger.warn('Unauthorized pickup fetch attempt', { pickupId: idString })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.info('Authenticated user fetching pickup', { userId, pickupId: idString })

    // Connect to database
    await connectToDatabase()

    // Validate MongoDB ObjectId format
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idString)
    
    if (!isValidObjectId) {
      logger.warn('Invalid pickup ID format', { 
        pickupId: idString, 
        userId,
        idType: typeof idString,
        isArray: Array.isArray(resolvedParams.id),
        rawParams: resolvedParams.id
      })
      return NextResponse.json(
        { error: 'Invalid pickup ID format' },
        { status: 400 }
      )
    }

    // Find pickup by ID (use the validated string)
    const pickup = await Pickup.findById(idString)

    if (!pickup) {
      logger.warn('Pickup not found', { 
        pickupId: idString, 
        userId,
        isValidObjectId,
        idLength: idString.length,
        idType: typeof idString
      })
      return NextResponse.json(
        { error: 'Pickup not found' },
        { status: 404 }
      )
    }

    // Check if user owns this pickup (unless admin)
    if (pickup.collectorId !== userId) {
      logger.warn('User attempted to access pickup they do not own', {
        pickupId: idString,
        userId,
        pickupCollectorId: pickup.collectorId
      })
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this pickup' },
        { status: 403 }
      )
    }

    logger.success('Pickup fetched successfully', {
      pickupId: pickup._id.toString(),
      status: pickup.status,
      category: pickup.category,
      fetchDuration: `${Date.now() - requestStartTime}ms`
    })

    // Convert to plain object and format for frontend
    const pickupData = {
      id: pickup._id.toString(),
      collectorId: pickup.collectorId,
      category: pickup.category,
      estimatedWeight: pickup.estimatedWeight,
      actualWeight: pickup.actualWeight,
      status: pickup.status,
      location: {
        type: pickup.location.type,
        coordinates: pickup.location.coordinates,
        address: pickup.location.address,
      },
      photos: {
        before: {
          cloudinaryId: pickup.photos.before.cloudinaryId,
          url: pickup.photos.before.url,
        },
        ...(pickup.photos.after && {
          after: {
            cloudinaryId: pickup.photos.after.cloudinaryId,
            url: pickup.photos.after.url,
          },
        }),
      },
      verification: pickup.verification ? {
        aiConfidence: pickup.verification.aiConfidence,
        aiCategory: pickup.verification.aiCategory,
        aiWeight: pickup.verification.aiWeight,
        manualReview: pickup.verification.manualReview || false,
        verifiedBy: pickup.verification.verifiedBy,
        verifiedAt: pickup.verification.verifiedAt,
        rejectionReason: pickup.verification.rejectionReason,
      } : undefined,
      statusHistory: pickup.statusHistory.map((entry: any) => ({
        status: entry.status,
        timestamp: entry.timestamp.toISOString(),
        notes: entry.notes,
        changedBy: entry.changedBy,
      })),
      notes: pickup.notes,
      createdAt: pickup.createdAt.toISOString(),
      updatedAt: pickup.updatedAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      pickup: pickupData,
    })

  } catch (error) {
    logger.error('Error fetching pickup', error instanceof Error ? error : new Error(String(error)), {
      pickupId: idString
    })

    // Handle invalid ObjectId format
    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid pickup ID format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch pickup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

