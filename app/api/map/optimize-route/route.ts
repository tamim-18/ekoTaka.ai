import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { optimizeRoute, type Waypoint } from '@/lib/services/route-optimizer'
import { logger } from '@/lib/logger'

/**
 * POST /api/map/optimize-route
 * Optimize a route for collection
 * Body: {
 *   origin: [lng, lat]
 *   waypoints: Waypoint[]
 *   strategy?: 'nearest' | 'weighted' | 'balanced'
 * }
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

    const body = await request.json()
    const { origin, waypoints, strategy = 'balanced' } = body

    // Validate origin
    if (!origin || !Array.isArray(origin) || origin.length !== 2) {
      return NextResponse.json(
        { error: 'Origin coordinates [lng, lat] are required' },
        { status: 400 }
      )
    }

    // Validate waypoints
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length === 0) {
      return NextResponse.json(
        { error: 'At least one waypoint is required' },
        { status: 400 }
      )
    }

    // Validate and format waypoints
    const formattedWaypoints: Waypoint[] = waypoints.map((wp: any, idx: number) => {
      if (!wp.location || !wp.location.coordinates) {
        throw new Error(`Waypoint ${idx} missing location coordinates`)
      }

      return {
        id: wp.id || `wp-${idx}`,
        location: {
          coordinates: wp.location.coordinates,
          address: wp.location.address || 'Unknown address',
        },
        weight: wp.weight || wp.estimatedAvailable?.totalWeight || 0,
        value: wp.value || wp.estimatedAvailable?.totalWeight * 30,
        category: wp.category,
        status: wp.status,
      }
    })

    // Optimize route
    const optimizedRoute = optimizeRoute(
      origin as [number, number],
      formattedWaypoints,
      strategy
    )

    logger.info('Route optimized', {
      userId,
      waypointCount: formattedWaypoints.length,
      optimizedStops: optimizedRoute.summary.totalStops,
      totalDistance: `${(optimizedRoute.totalDistance / 1000).toFixed(2)} km`,
      strategy,
    })

    return NextResponse.json({
      success: true,
      route: optimizedRoute,
    })
  } catch (error) {
    logger.error('Error optimizing route', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to optimize route',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

