import { WasteHotspot } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * Update or create waste hotspot when a pickup is created
 * This function is called after a pickup is successfully created
 */
export async function updateHotspotFromPickup(
  pickup: {
    location: {
      coordinates: [number, number]
      address: string
    }
    category: string
    estimatedWeight: number
    collectorId: string
    _id: any
  }
) {
  try {
    const { location, category, estimatedWeight, collectorId, _id } = pickup

    // Check if hotspot exists nearby (within 50 meters)
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
      // Update existing hotspot - reduce available weight
      const categoryKey = category as keyof typeof nearbyHotspot.estimatedAvailable.categories
      
      // Reduce weight
      const weightToReduce = estimatedWeight
      nearbyHotspot.estimatedAvailable.totalWeight = Math.max(
        0,
        nearbyHotspot.estimatedAvailable.totalWeight - weightToReduce
      )

      // Reduce category-specific weight
      if (nearbyHotspot.estimatedAvailable.categories[categoryKey]) {
        nearbyHotspot.estimatedAvailable.categories[categoryKey] = Math.max(
          0,
          (nearbyHotspot.estimatedAvailable.categories[categoryKey] || 0) - weightToReduce
        )
      }

      // Add to collection history
      nearbyHotspot.collectionHistory.push({
        collectorId,
        pickupId: _id.toString(),
        weight: estimatedWeight,
        category,
        collectedAt: new Date(),
      })

      // Update status
      if (nearbyHotspot.estimatedAvailable.totalWeight <= 0) {
        nearbyHotspot.status = 'depleted'
        nearbyHotspot.lastCollectedAt = new Date()
      }

      nearbyHotspot.lastUpdated = new Date()
      await nearbyHotspot.save()

      logger.info('Updated hotspot from pickup', {
        hotspotId: nearbyHotspot._id.toString(),
        pickupId: _id.toString(),
        weightCollected: estimatedWeight,
        remainingWeight: nearbyHotspot.estimatedAvailable.totalWeight,
      })
    } else {
      // Create new hotspot (pickup suggests waste location)
      // Only create if weight is significant (> 2kg) to avoid noise
      if (estimatedWeight >= 2) {
        const newHotspot = new WasteHotspot({
          location: {
            type: 'Point',
            coordinates: location.coordinates,
            address: location.address,
          },
          status: 'active',
          estimatedAvailable: {
            totalWeight: estimatedWeight * 1.5, // Estimate more waste available
            categories: {
              [category]: estimatedWeight * 1.5,
            },
          },
          reportedBy: collectorId,
          reportedAt: new Date(),
          lastUpdated: new Date(),
          lastCollectedAt: new Date(),
          collectionHistory: [
            {
              collectorId,
              pickupId: _id.toString(),
              weight: estimatedWeight,
              category,
              collectedAt: new Date(),
            },
          ],
          metadata: {
            reportedBy: 'collector',
            description: `Waste collection point - ${category} plastic collected`,
          },
        })

        await newHotspot.save()

        logger.info('Created new hotspot from pickup', {
          hotspotId: newHotspot._id.toString(),
          pickupId: _id.toString(),
          estimatedWeight,
        })
      }
    }
  } catch (error) {
    // Don't fail pickup creation if hotspot update fails
    logger.error('Error updating hotspot from pickup', error instanceof Error ? error : new Error(String(error)), {
      pickupId: pickup._id?.toString(),
    })
  }
}

