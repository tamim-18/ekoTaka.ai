import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Pickup, Order, User } from '@/lib/models'
import { logger } from '@/lib/logger'
import mongoose from 'mongoose'

/**
 * GET /api/brand/inventory
 * Get available plastic collections for brands to purchase
 * Query params:
 * - category: Filter by category (PET, HDPE, LDPE, PP, PS, Other)
 * - minWeight: Minimum weight in kg
 * - maxWeight: Maximum weight in kg
 * - location: Filter by location/district
 * - sortBy: Sort field (date, weight, price)
 * - sortOrder: asc or desc
 * - page: Page number
 * - limit: Items per page
 */
export async function GET(request: NextRequest) {
  const requestStartTime = Date.now()
  logger.info('=== BRAND INVENTORY REQUEST ===')

  try {
    const tokenData = await getCurrentUser()

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = tokenData.userId

    await connectToDatabase()

    // Verify user is a brand
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'brand') {
      return NextResponse.json(
        { error: 'Forbidden: Brand access only' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const minWeight = searchParams.get('minWeight') ? parseFloat(searchParams.get('minWeight')!) : undefined
    const maxWeight = searchParams.get('maxWeight') ? parseFloat(searchParams.get('maxWeight')!) : undefined
    const location = searchParams.get('location')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build query - only show verified pickups available for purchase
    const query: any = {
      status: 'verified', // Only verified pickups are available
    }

    // Filter by category
    if (category && category !== 'all') {
      const validCategories = ['PET', 'HDPE', 'LDPE', 'PP', 'PS', 'Other']
      if (validCategories.includes(category)) {
        query.category = category
      }
    }

    // Filter by weight range
    if (minWeight !== undefined || maxWeight !== undefined) {
      query.$or = [
        { estimatedWeight: {} },
        { actualWeight: {} },
      ]
      
      if (minWeight !== undefined) {
        query.$or[0].estimatedWeight.$gte = minWeight
        query.$or[1].actualWeight.$gte = minWeight
      }
      if (maxWeight !== undefined) {
        query.$or[0].estimatedWeight.$lte = maxWeight
        query.$or[1].actualWeight.$lte = maxWeight
      }
    }

    // Filter by location (search in address)
    if (location) {
      query['location.address'] = { $regex: location, $options: 'i' }
    }

    logger.debug('Fetching inventory with query', { 
      brandId: userId, 
      category, 
      minWeight, 
      maxWeight,
      location,
      page, 
      limit 
    })

    // Determine sort field
    let sortField = 'createdAt'
    if (sortBy === 'weight') {
      sortField = 'estimatedWeight'
    } else if (sortBy === 'date') {
      sortField = 'createdAt'
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1

    // Fetch pickups with pagination
    const [pickups, totalCount] = await Promise.all([
      Pickup.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      Pickup.countDocuments(query)
    ])

    // Get orders for these pickups to calculate available quantity
    const pickupIds = pickups.map((p: any) => p._id.toString())
    const orders = await Order.find({
      pickupId: { $in: pickupIds },
      status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] }, // Active orders
    }).lean()

    // Calculate ordered quantities per pickup
    const orderedQuantities: Record<string, number> = {}
    orders.forEach((order: any) => {
      const pid = order.pickupId
      orderedQuantities[pid] = (orderedQuantities[pid] || 0) + order.quantity
    })

    // Format pickups for frontend with availability info
    const formattedPickups = await Promise.all(
      pickups.map(async (pickup: any) => {
        const pickupId = pickup._id.toString()
        const orderedQty = orderedQuantities[pickupId] || 0
        const availableWeight = pickup.actualWeight || pickup.estimatedWeight || 0
        const availableQty = Math.max(0, availableWeight - orderedQty)

        // Get collector info - handle both ObjectId and string IDs
        let collector: any = null
        try {
          // Check if collectorId is a valid MongoDB ObjectId
          if (mongoose.Types.ObjectId.isValid(pickup.collectorId)) {
            collector = await User.findById(pickup.collectorId).select('fullName email').lean() as any
          } else {
            // If not a valid ObjectId, skip lookup and use default values
            logger.debug('Invalid ObjectId for collector', { collectorId: pickup.collectorId })
          }
        } catch (error) {
          // If lookup fails, continue with default values
          logger.debug('Error fetching collector info', { collectorId: pickup.collectorId, error })
        }

        return {
          id: pickupId,
          collectorId: pickup.collectorId,
          collectorName: collector?.fullName || 'Collector',
          collectorEmail: collector?.email,
          category: pickup.category,
          estimatedWeight: pickup.estimatedWeight,
          actualWeight: pickup.actualWeight,
          availableWeight: Math.round(availableQty * 100) / 100,
          orderedWeight: Math.round(orderedQty * 100) / 100,
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
          isAvailable: availableQty > 0,
        }
      })
    )

    logger.success('Inventory fetched successfully', {
      count: formattedPickups.length,
      total: totalCount,
      page,
      fetchDuration: `${Date.now() - requestStartTime}ms`
    })

    return NextResponse.json({
      success: true,
      inventory: formattedPickups,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + pickups.length < totalCount,
      },
      filters: {
        category: category || 'all',
        minWeight,
        maxWeight,
        location: location || null,
        sortBy,
        sortOrder,
      },
    })
  } catch (error) {
    logger.error('Error fetching brand inventory', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to fetch inventory',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

