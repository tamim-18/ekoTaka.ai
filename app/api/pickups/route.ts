import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase, Pickup } from '@/lib/models'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const requestStartTime = Date.now()
  logger.info('=== FETCH ALL PICKUPS REQUEST ===')

  try {
    const { userId } = await auth()

    if (!userId) {
      logger.warn('Unauthorized pickups fetch attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.info('Authenticated user fetching pickups', { userId })

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Connect to database
    await connectToDatabase()

    // Build query
    const query: any = { collectorId: userId }
    
    if (status && status !== 'all') {
      query.status = status
    }

    logger.debug('Fetching pickups with query', { 
      collectorId: userId, 
      status, 
      page, 
      limit 
    })

    // Fetch pickups with pagination
    const [pickups, totalCount] = await Promise.all([
      Pickup.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Pickup.countDocuments(query)
    ])

    logger.success('Pickups fetched successfully', {
      count: pickups.length,
      total: totalCount,
      page,
      fetchDuration: `${Date.now() - requestStartTime}ms`
    })

    // Format pickups for frontend
    const formattedPickups = pickups.map((pickup: any) => ({
      id: pickup._id.toString(),
      collectorId: pickup.collectorId,
      category: pickup.category,
      estimatedWeight: pickup.estimatedWeight,
      actualWeight: pickup.actualWeight,
      status: pickup.status,
      location: {
        coordinates: pickup.location.coordinates,
        address: pickup.location.address,
      },
      photos: {
        before: {
          url: pickup.photos.before.url,
        },
        after: pickup.photos.after ? {
          url: pickup.photos.after.url,
        } : undefined,
      },
      verification: pickup.verification ? {
        aiConfidence: pickup.verification.aiConfidence,
        aiCategory: pickup.verification.aiCategory,
        aiWeight: pickup.verification.aiWeight,
        manualReview: pickup.verification.manualReview || false,
      } : undefined,
      notes: pickup.notes,
      createdAt: pickup.createdAt.toISOString(),
      updatedAt: pickup.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      pickups: formattedPickups,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + pickups.length < totalCount,
      },
    })

  } catch (error) {
    logger.error('Error fetching pickups', error instanceof Error ? error : new Error(String(error)))

    return NextResponse.json(
      {
        error: 'Failed to fetch pickups',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

