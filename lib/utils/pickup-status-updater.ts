/**
 * Utility to handle pickup status updates and trigger token processing
 * This can be called when pickup status changes from pending to verified
 */

import { logger } from '@/lib/logger'
import { Pickup } from '@/lib/models'
import { processPickupTokens } from '@/lib/services/token-service'

/**
 * Update pickup status and process tokens if verified
 * This should be called whenever a pickup status changes to 'verified'
 */
export async function updatePickupStatus(
  pickupId: string,
  newStatus: 'pending' | 'verified' | 'rejected' | 'paid',
  changedBy?: string,
  notes?: string
): Promise<{ success: boolean; tokensAwarded?: number }> {
  try {
    const pickup = await Pickup.findById(pickupId)

    if (!pickup) {
      throw new Error('Pickup not found')
    }

    const oldStatus = pickup.status

    // Update status
    pickup.status = newStatus
    pickup.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      changedBy: changedBy || 'system',
      notes,
    })

    await pickup.save()

    // Process tokens if status changed to verified
    if (oldStatus !== 'verified' && newStatus === 'verified') {
      logger.info('Pickup status changed to verified, processing tokens', {
        pickupId,
        collectorId: pickup.collectorId,
        oldStatus,
        newStatus,
      })

      const tokenResult = await processPickupTokens(pickupId, pickup.collectorId)

      return {
        success: true,
        tokensAwarded: tokenResult.tokensAwarded,
      }
    }

    return { success: true }
  } catch (error) {
    logger.error('Error updating pickup status', error instanceof Error ? error : new Error(String(error)), {
      pickupId,
      newStatus,
    })
    throw error
  }
}

