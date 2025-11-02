import { logger } from '@/lib/logger'
import { EkoTokenTransaction, CollectorProfile, Pickup } from '@/lib/models'
import {
  calculateTokensForPickup,
  checkMilestones,
  getNextMilestone,
  type PickupTokenCalculationParams,
} from './token-calculator'

/**
 * Award tokens to a collector
 * Creates transaction and updates balance
 */
export async function awardTokens(
  collectorId: string,
  amount: number,
  source: 'pickup_verification' | 'milestone' | 'referral' | 'bonus',
  description: string,
  metadata?: {
    pickupId?: string
    milestone?: string
    category?: string
    weight?: number
    aiConfidence?: number
    bonusReason?: string
  }
): Promise<{ success: boolean; transactionId?: string; newBalance?: number }> {
  try {
    // Get current balance
    const currentBalance = await getTokenBalance(collectorId)

    // Calculate new balance
    const newBalance = currentBalance + amount

    if (newBalance < 0) {
      logger.warn('Token balance would be negative', { collectorId, currentBalance, amount })
      return { success: false }
    }

    // Create transaction
    const transaction = new EkoTokenTransaction({
      collectorId,
      amount,
      type: source === 'milestone' || source === 'bonus' ? 'bonus' : 'earned',
      source,
      pickupId: metadata?.pickupId,
      description,
      metadata: metadata ? {
        milestone: metadata.milestone,
        category: metadata.category,
        weight: metadata.weight,
        aiConfidence: metadata.aiConfidence,
        bonusReason: metadata.bonusReason,
      } : undefined,
      balanceAfter: newBalance,
    })

    await transaction.save()

    // Update profile balance (optimistic update)
    await CollectorProfile.findOneAndUpdate(
      { userId: collectorId },
      { $set: { 'stats.ekoTokens': newBalance } }
    )

    logger.info('Tokens awarded', {
      collectorId,
      amount,
      source,
      newBalance,
      transactionId: transaction._id.toString(),
    })

    return {
      success: true,
      transactionId: transaction._id.toString(),
      newBalance,
    }
  } catch (error) {
    logger.error('Error awarding tokens', error instanceof Error ? error : new Error(String(error)), {
      collectorId,
      amount,
      source,
    })
    return { success: false }
  }
}

/**
 * Get current token balance for a collector
 * Calculated from all transactions for accuracy
 */
export async function getTokenBalance(collectorId: string): Promise<number> {
  try {
    const result = await EkoTokenTransaction.aggregate([
      { $match: { collectorId } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])

    return result[0]?.total || 0
  } catch (error) {
    logger.error('Error getting token balance', error instanceof Error ? error : new Error(String(error)), { collectorId })
    return 0
  }
}

/**
 * Process tokens for a verified pickup
 * This is the main function called when a pickup is verified
 */
export async function processPickupTokens(pickupId: string, collectorId: string): Promise<{
  tokensAwarded: number
  milestonesAwarded: Array<{ milestone: string; tokens: number; description: string }>
}> {
  try {
    // Get pickup details
    const pickup = await Pickup.findById(pickupId).lean() as any
    if (!pickup) {
      throw new Error('Pickup not found')
    }

    // Check if tokens already awarded for this pickup (prevent double awarding)
    const existingTransaction = await EkoTokenTransaction.findOne({
      collectorId,
      pickupId: pickup._id.toString(),
      source: 'pickup_verification',
    })

    if (existingTransaction) {
      logger.warn('Tokens already awarded for this pickup', {
        pickupId,
        collectorId,
        existingTransactionId: existingTransaction._id.toString(),
      })
      return {
        tokensAwarded: existingTransaction.amount,
        milestonesAwarded: [],
      }
    }

    // Calculate tokens for this pickup
    const calculationParams: PickupTokenCalculationParams = {
      category: pickup.category,
      weight: pickup.actualWeight || pickup.estimatedWeight,
      aiConfidence: pickup.verification?.aiConfidence,
      hasAfterPhoto: !!pickup.photos.after,
      actualWeight: pickup.actualWeight,
      wasManuallyReviewed: pickup.verification?.manualReview || false,
    }

    const tokenCalculation = calculateTokensForPickup(calculationParams)

    // Award pickup tokens
    const awardResult = await awardTokens(
      collectorId,
      tokenCalculation.totalTokens,
      'pickup_verification',
      `Verified pickup: ${pickup.category} (${(pickup.actualWeight || pickup.estimatedWeight).toFixed(1)}kg)`,
      {
        pickupId: pickup._id.toString(),
        category: pickup.category,
        weight: pickup.actualWeight || pickup.estimatedWeight,
        aiConfidence: pickup.verification?.aiConfidence,
        bonusReason: tokenCalculation.breakdown.join('; '),
      }
    )

    if (!awardResult.success) {
      throw new Error('Failed to award pickup tokens')
    }

    // Check for milestones
    const verifiedPickups = await Pickup.countDocuments({
      collectorId,
      status: { $in: ['verified', 'paid'] },
    })

    const milestones = checkMilestones(verifiedPickups)
    const milestonesAwarded: Array<{ milestone: string; tokens: number; description: string }> = []

    // Award milestone bonuses
    for (const milestone of milestones) {
      const milestoneResult = await awardTokens(
        collectorId,
        milestone.tokens,
        'milestone',
        milestone.description,
        {
          milestone: milestone.milestone,
          bonusReason: milestone.description,
        }
      )

      if (milestoneResult.success) {
        milestonesAwarded.push(milestone)
        logger.info('Milestone bonus awarded', {
          collectorId,
          milestone: milestone.milestone,
          tokens: milestone.tokens,
        })
      }
    }

    logger.success('Pickup tokens processed', {
      pickupId,
      collectorId,
      tokensAwarded: tokenCalculation.totalTokens,
      milestonesCount: milestonesAwarded.length,
    })

    return {
      tokensAwarded: tokenCalculation.totalTokens,
      milestonesAwarded,
    }
  } catch (error) {
    logger.error('Error processing pickup tokens', error instanceof Error ? error : new Error(String(error)), {
      pickupId,
      collectorId,
    })
    throw error
  }
}

/**
 * Recalculate token balance from transactions
 * Useful for data integrity checks
 */
export async function recalculateTokenBalance(collectorId: string): Promise<number> {
  try {
    const balance = await getTokenBalance(collectorId)

    // Update profile
    await CollectorProfile.findOneAndUpdate(
      { userId: collectorId },
      { $set: { 'stats.ekoTokens': balance } }
    )

    logger.info('Token balance recalculated', { collectorId, balance })

    return balance
  } catch (error) {
    logger.error('Error recalculating token balance', error instanceof Error ? error : new Error(String(error)), { collectorId })
    return 0
  }
}

