import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase, WasteHotspot } from '@/lib/models'
import { Pickup } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/map/hotspots
 * Get waste hotspots for map display
 * Query params:
 * - lat, lng: Center coordinates
 * - radius: Radius in km (default: 10)
 * - status: Filter by status (active, depleted, expired)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const lat = parseFloat(searchParams.get('lat') || '23.8103') // Default to Dhaka
    const lng = parseFloat(searchParams.get('lng') || '90.4125')
    const radius = parseFloat(searchParams.get('radius') || '10') // km
    const statusFilter = searchParams.get('status') || 'active'

    // Convert radius from km to meters
    const radiusInMeters = radius * 1000

    // Build query
    const query: any = {
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat], // MongoDB uses [lng, lat]
          },
          $maxDistance: radiusInMeters,
        },
      },
    }

    // Filter by status if specified
    if (statusFilter !== 'all') {
      query.status = statusFilter
    } else {
      // Exclude expired by default
      query.status = { $in: ['active', 'depleted'] }
    }

    // Get active hotspots
    const hotspots = await WasteHotspot.find(query)
      .sort({ 'estimatedAvailable.totalWeight': -1, lastUpdated: -1 })
      .limit(100) // Limit results for performance
      .lean()

    // Also get recent pickups (last 14 days) as "proven collection points"
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const recentPickups = await Pickup.find({
      status: { $in: ['verified', 'paid'] },
      createdAt: { $gte: fourteenDaysAgo },
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radiusInMeters,
        },
      },
    })
      .select('location category estimatedWeight createdAt status')
      .limit(50)
      .lean()

    logger.info('Fetched hotspots for map', {
      userId,
      hotspotCount: hotspots.length,
      pickupCount: recentPickups.length,
      radius: radius + 'km',
    })

    // Format hotspots
    const formattedHotspots = hotspots.map((hotspot: any) => ({
      id: hotspot._id.toString(),
      location: {
        coordinates: hotspot.location.coordinates,
        address: hotspot.location.address,
      },
      status: hotspot.status,
      estimatedAvailable: hotspot.estimatedAvailable,
      reportedBy: hotspot.reportedBy,
      reportedAt: hotspot.reportedAt.toISOString(),
      lastUpdated: hotspot.lastUpdated.toISOString(),
      lastCollectedAt: hotspot.lastCollectedAt?.toISOString(),
      collectionCount: hotspot.collectionHistory?.length || 0,
      metadata: hotspot.metadata,
    }))

    // Format recent pickups as collection points
    const collectionPoints = recentPickups.map((pickup: any) => ({
      id: `pickup-${pickup._id.toString()}`,
      location: {
        coordinates: pickup.location.coordinates,
        address: pickup.location.address,
      },
      category: pickup.category,
      weight: pickup.estimatedWeight,
      collectedAt: pickup.createdAt.toISOString(),
      status: pickup.status,
      type: 'collection', // Distinguish from hotspots
    }))

    return NextResponse.json({
      success: true,
      hotspots: formattedHotspots,
      collectionPoints: collectionPoints,
      center: { lat, lng },
      radius: radius,
    })
  } catch (error) {
    logger.error('Error fetching hotspots', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to fetch hotspots',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/map/hotspots
 * Report a new waste location
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const body = await request.json()
    const {
      location,
      estimatedAvailable,
      description,
      photos,
      accessInstructions,
    } = body

    // Validate required fields
    if (!location || !location.coordinates || !location.address) {
      return NextResponse.json(
        { error: 'Location coordinates and address are required' },
        { status: 400 }
      )
    }

    if (!estimatedAvailable || !estimatedAvailable.totalWeight) {
      return NextResponse.json(
        { error: 'Estimated available weight is required' },
        { status: 400 }
      )
    }

    // Check if hotspot exists nearby (within 50m)
    const nearbyHotspot = await WasteHotspot.findOne({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates,
          },
          $maxDistance: 50, // 50 meters
        },
      },
      status: { $in: ['active', 'depleted'] },
    })

    if (nearbyHotspot) {
      // Update existing hotspot instead of creating duplicate
      nearbyHotspot.estimatedAvailable.totalWeight += estimatedAvailable.totalWeight
      
      // Merge categories
      if (estimatedAvailable.categories) {
        Object.keys(estimatedAvailable.categories).forEach((cat) => {
          if (nearbyHotspot.estimatedAvailable.categories[cat as keyof typeof nearbyHotspot.estimatedAvailable.categories]) {
            nearbyHotspot.estimatedAvailable.categories[cat as keyof typeof nearbyHotspot.estimatedAvailable.categories]! += 
              estimatedAvailable.categories[cat as keyof typeof estimatedAvailable.categories] || 0
          } else {
            nearbyHotspot.estimatedAvailable.categories[cat as keyof typeof nearbyHotspot.estimatedAvailable.categories] =
              estimatedAvailable.categories[cat as keyof typeof estimatedAvailable.categories] || 0
          }
        })
      }

      nearbyHotspot.status = 'active'
      nearbyHotspot.lastUpdated = new Date()
      
      if (description) {
        nearbyHotspot.metadata.description = description
      }
      if (photos && photos.length > 0) {
        nearbyHotspot.metadata.photos = [...(nearbyHotspot.metadata.photos || []), ...photos]
      }

      await nearbyHotspot.save()

      logger.info('Updated existing hotspot', {
        hotspotId: nearbyHotspot._id.toString(),
        userId,
      })

      return NextResponse.json({
        success: true,
        hotspot: {
          id: nearbyHotspot._id.toString(),
          location: nearbyHotspot.location,
          status: nearbyHotspot.status,
          estimatedAvailable: nearbyHotspot.estimatedAvailable,
        },
        message: 'Updated existing hotspot nearby',
      })
    }

    // Create new hotspot
    const newHotspot = new WasteHotspot({
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
      },
      status: 'active',
      estimatedAvailable: {
        totalWeight: estimatedAvailable.totalWeight,
        categories: estimatedAvailable.categories || {},
      },
      reportedBy: userId,
      reportedAt: new Date(),
      lastUpdated: new Date(),
      metadata: {
        description,
        photos: photos || [],
        accessInstructions,
        reportedBy: 'collector',
      },
    })

    await newHotspot.save()

    logger.info('Created new waste hotspot', {
      hotspotId: newHotspot._id.toString(),
      userId,
      location: location.address,
    })

    return NextResponse.json({
      success: true,
      hotspot: {
        id: newHotspot._id.toString(),
        location: newHotspot.location,
        status: newHotspot.status,
        estimatedAvailable: newHotspot.estimatedAvailable,
      },
      message: 'Waste location reported successfully',
    })
  } catch (error) {
    logger.error('Error creating hotspot', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to report waste location',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

