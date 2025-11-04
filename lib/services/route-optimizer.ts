/**
 * Route Optimization Service
 * Optimizes collection routes for collectors using multiple strategies
 */

import { logger } from '@/lib/logger'

export interface Waypoint {
  id: string
  location: {
    coordinates: [number, number] // [lng, lat]
    address: string
  }
  weight: number // Estimated weight in kg
  value?: number // Estimated value/priority
  category?: string
  status?: string
}

export interface OptimizedRoute {
  waypoints: Waypoint[]
  totalDistance: number // in meters
  totalDuration: number // in seconds
  estimatedValue: number
  routeOrder: number[] // Index order
  summary: {
    totalStops: number
    totalWeight: number
    averageDistance: number
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lng1, lat1] = coord1
  const [lng2, lat2] = coord2

  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Simple Nearest Neighbor algorithm
 * Starts from origin, always picks nearest unvisited point
 */
function nearestNeighbor(
  origin: [number, number],
  waypoints: Waypoint[]
): OptimizedRoute {
  if (waypoints.length === 0) {
    return {
      waypoints: [],
      totalDistance: 0,
      totalDuration: 0,
      estimatedValue: 0,
      routeOrder: [],
      summary: {
        totalStops: 0,
        totalWeight: 0,
        averageDistance: 0,
      },
    }
  }

  const visited = new Set<number>()
  const routeOrder: number[] = []
  let currentPos = origin
  let totalDistance = 0
  let totalWeight = 0

  // While there are unvisited waypoints
  while (visited.size < waypoints.length) {
    let nearestIdx = -1
    let nearestDist = Infinity

    // Find nearest unvisited waypoint
    for (let i = 0; i < waypoints.length; i++) {
      if (visited.has(i)) continue

      const dist = calculateDistance(
        currentPos,
        waypoints[i].location.coordinates
      )

      // Consider weight/value as priority modifier
      // Higher weight/value gets slight preference (reduce distance by 5% per kg)
      const priorityModifier = waypoints[i].weight * 0.05
      const adjustedDist = dist * (1 - priorityModifier)

      if (adjustedDist < nearestDist) {
        nearestDist = adjustedDist
        nearestIdx = i
      }
    }

    if (nearestIdx === -1) break

    // Add to route
    visited.add(nearestIdx)
    routeOrder.push(nearestIdx)
    totalDistance += nearestDist
    totalWeight += waypoints[nearestIdx].weight
    currentPos = waypoints[nearestIdx].location.coordinates
  }

  // Calculate estimated duration (assuming 30 km/h average speed + 5 min per stop)
  const totalDuration =
    (totalDistance / 8333) * 3600 + routeOrder.length * 300 // 8333 m/s = ~30 km/h

  const orderedWaypoints = routeOrder.map((idx) => waypoints[idx])

  return {
    waypoints: orderedWaypoints,
    totalDistance,
    totalDuration,
    estimatedValue: orderedWaypoints.reduce(
      (sum, wp) => sum + (wp.value || wp.weight * 30),
      0
    ),
    routeOrder,
    summary: {
      totalStops: routeOrder.length,
      totalWeight,
      averageDistance: totalDistance / routeOrder.length || 0,
    },
  }
}

/**
 * Weighted optimization - prioritizes high-value locations
 */
function weightedOptimization(
  origin: [number, number],
  waypoints: Waypoint[]
): OptimizedRoute {
  if (waypoints.length === 0) {
    return {
      waypoints: [],
      totalDistance: 0,
      totalDuration: 0,
      estimatedValue: 0,
      routeOrder: [],
      summary: {
        totalStops: 0,
        totalWeight: 0,
        averageDistance: 0,
      },
    }
  }

  // Sort by value/weight ratio (highest first)
  const sortedByValue = [...waypoints]
    .map((wp, idx) => ({ wp, idx, score: (wp.value || wp.weight * 30) / wp.weight }))
    .sort((a, b) => b.score - a.score)

  const visited = new Set<number>()
  const routeOrder: number[] = []
  let currentPos = origin
  let totalDistance = 0
  let totalWeight = 0

  // Start with highest value locations first
  for (const { idx, wp } of sortedByValue) {
    if (visited.has(idx)) continue

    const dist = calculateDistance(currentPos, wp.location.coordinates)
    
    // If this is a high-value location far away, still prioritize it
    const value = wp.value || wp.weight * 30
    const isHighValue = value > 500 // High value threshold
    
    // Find if there's a closer high-value location
    let shouldVisit = true
    if (!isHighValue) {
      // Check if there's a closer high-value location
      for (const { idx: otherIdx, wp: otherWp } of sortedByValue) {
        if (visited.has(otherIdx)) continue
        const otherValue = otherWp.value || otherWp.weight * 30
        if (otherValue > value) {
          const otherDist = calculateDistance(currentPos, otherWp.location.coordinates)
          if (otherDist < dist * 1.5) { // If within 1.5x distance, prefer higher value
            shouldVisit = false
            break
          }
        }
      }
    }

    if (shouldVisit) {
      visited.add(idx)
      routeOrder.push(idx)
      totalDistance += dist
      totalWeight += wp.weight
      currentPos = wp.location.coordinates
    }
  }

  // Fill remaining waypoints using nearest neighbor
  while (visited.size < waypoints.length) {
    let nearestIdx = -1
    let nearestDist = Infinity

    for (let i = 0; i < waypoints.length; i++) {
      if (visited.has(i)) continue
      const dist = calculateDistance(currentPos, waypoints[i].location.coordinates)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }

    if (nearestIdx === -1) break

    visited.add(nearestIdx)
    routeOrder.push(nearestIdx)
    totalDistance += nearestDist
    totalWeight += waypoints[nearestIdx].weight
    currentPos = waypoints[nearestIdx].location.coordinates
  }

  const totalDuration = (totalDistance / 8333) * 3600 + routeOrder.length * 300
  const orderedWaypoints = routeOrder.map((idx) => waypoints[idx])

  return {
    waypoints: orderedWaypoints,
    totalDistance,
    totalDuration,
    estimatedValue: orderedWaypoints.reduce(
      (sum, wp) => sum + (wp.value || wp.weight * 30),
      0
    ),
    routeOrder,
    summary: {
      totalStops: routeOrder.length,
      totalWeight,
      averageDistance: totalDistance / routeOrder.length || 0,
    },
  }
}

/**
 * Optimize route using specified strategy
 */
export function optimizeRoute(
  origin: [number, number],
  waypoints: Waypoint[],
  strategy: 'nearest' | 'weighted' | 'balanced' = 'balanced'
): OptimizedRoute {
  logger.info('Optimizing route', {
    origin,
    waypointCount: waypoints.length,
    strategy,
  })

  if (waypoints.length === 0) {
    return {
      waypoints: [],
      totalDistance: 0,
      totalDuration: 0,
      estimatedValue: 0,
      routeOrder: [],
      summary: {
        totalStops: 0,
        totalWeight: 0,
        averageDistance: 0,
      },
    }
  }

  // Limit to 25 waypoints max (Google Directions API limit)
  const limitedWaypoints = waypoints.slice(0, 25)

  switch (strategy) {
    case 'nearest':
      return nearestNeighbor(origin, limitedWaypoints)
    case 'weighted':
      return weightedOptimization(origin, limitedWaypoints)
    case 'balanced':
    default:
      // Use weighted for high-value routes, nearest for others
      const avgValue = limitedWaypoints.reduce(
        (sum, wp) => sum + (wp.value || wp.weight * 30),
        0
      ) / limitedWaypoints.length

      if (avgValue > 400) {
        return weightedOptimization(origin, limitedWaypoints)
      } else {
        return nearestNeighbor(origin, limitedWaypoints)
      }
  }
}

/**
 * Format waypoints for Google Directions API
 */
export function formatWaypointsForDirections(
  waypoints: Waypoint[]
): string {
  return waypoints
    .map((wp) => `${wp.location.coordinates[1]},${wp.location.coordinates[0]}`)
    .join('|')
}

