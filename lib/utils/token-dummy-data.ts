import { EkoTokenTransaction, connectToDatabase } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * Generate dummy EkoTokenTransaction data for a collector
 * Creates realistic transaction history based on pickup patterns
 */

interface DummyTokenTransactionParams {
  collectorId: string
  count?: number
  startDate?: Date
}

export async function generateDummyTokenTransactions({
  collectorId,
  count = 30,
  startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
}: DummyTokenTransactionParams): Promise<void> {
  try {
    await connectToDatabase()

    // Check if user already has transactions
    const existingCount = await EkoTokenTransaction.countDocuments({ collectorId })
    if (existingCount > 0) {
      logger.info('User already has token transactions', { collectorId, existingCount })
      return
    }

    const transactions: Array<{
      collectorId: string
      amount: number
      type: 'earned' | 'redeemed' | 'bonus' | 'penalty' | 'expired'
      source: 'pickup_verification' | 'milestone' | 'referral' | 'redemption' | 'bonus' | 'penalty'
      pickupId?: string
      description: string
      metadata?: any
      balanceAfter: number
      createdAt: Date
    }> = []

    let currentBalance = 0
    const categories = ['PET', 'HDPE', 'LDPE', 'PP', 'PS', 'Other'] as const
    const milestones = [
      { threshold: 1, tokens: 50, description: 'First Pickup - Welcome Bonus!' },
      { threshold: 10, tokens: 100, description: '10 Verified Pickups - Great Progress!' },
      { threshold: 50, tokens: 500, description: '50 Verified Pickups - Amazing Dedication!' },
    ]

    // Generate transactions over the past 30 days
    const now = new Date()
    const daysAgo = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))

    let pickupCount = 0
    let milestoneIndex = 0

    for (let i = 0; i < count; i++) {
      // Generate random date within the range
      const daysBack = Math.random() * daysAgo
      const transactionDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

      // 80% chance of pickup verification, 15% milestone, 5% bonus
      const rand = Math.random()

      if (rand < 0.8) {
        // Pickup verification transaction
        pickupCount++
        const category = categories[Math.floor(Math.random() * categories.length)]
        const weight = Math.random() * 15 + 2 // 2-17 kg
        const aiConfidence = 0.85 + Math.random() * 0.15 // 85-100%
        const hasAfterPhoto = Math.random() > 0.3 // 70% chance

        // Calculate tokens based on formula
        const categoryMultipliers: Record<string, number> = {
          PET: 1.2,
          HDPE: 1.1,
          LDPE: 0.9,
          PP: 1.0,
          PS: 0.9,
          Other: 0.8,
        }
        const multiplier = categoryMultipliers[category] || 1.0
        let tokens = Math.round(weight * multiplier)

        // AI confidence bonus
        if (aiConfidence >= 0.95) {
          tokens = Math.round(tokens * 1.2)
        } else if (aiConfidence >= 0.90) {
          tokens = Math.round(tokens * 1.1)
        }

        // After photo bonus
        if (hasAfterPhoto) {
          tokens += 5
        }

        // Accuracy bonus (30% chance)
        if (Math.random() > 0.7) {
          tokens += 10
        }

        currentBalance += tokens

        transactions.push({
          collectorId,
          amount: tokens,
          type: 'earned',
          source: 'pickup_verification',
          description: `Verified pickup: ${category} (${weight.toFixed(1)}kg)`,
          metadata: {
            category,
            weight: Math.round(weight * 10) / 10,
            aiConfidence: Math.round(aiConfidence * 100) / 100,
          },
          balanceAfter: currentBalance,
          createdAt: transactionDate,
        })

        // Check for milestones
        if (milestoneIndex < milestones.length && pickupCount === milestones[milestoneIndex].threshold) {
          const milestone = milestones[milestoneIndex]
          currentBalance += milestone.tokens

          transactions.push({
            collectorId,
            amount: milestone.tokens,
            type: 'bonus',
            source: 'milestone',
            description: milestone.description,
            metadata: {
              milestone: Object.keys(milestones)[milestoneIndex],
              bonusReason: milestone.description,
            },
            balanceAfter: currentBalance,
            createdAt: new Date(transactionDate.getTime() + 1000), // 1 second after pickup
          })

          milestoneIndex++
        }
      } else if (rand < 0.95) {
        // Milestone bonus (if not already triggered)
        if (milestoneIndex < milestones.length && pickupCount >= milestones[milestoneIndex].threshold) {
          const milestone = milestones[milestoneIndex]
          currentBalance += milestone.tokens

          transactions.push({
            collectorId,
            amount: milestone.tokens,
            type: 'bonus',
            source: 'milestone',
            description: milestone.description,
            metadata: {
              milestone: `milestone_${milestoneIndex}`,
              bonusReason: milestone.description,
            },
            balanceAfter: currentBalance,
            createdAt: transactionDate,
          })

          milestoneIndex++
        }
      } else {
        // Random bonus (5%)
        const bonusAmount = [10, 25, 50][Math.floor(Math.random() * 3)]
        currentBalance += bonusAmount

        transactions.push({
          collectorId,
          amount: bonusAmount,
          type: 'bonus',
          source: 'bonus',
          description: 'Special bonus reward',
          metadata: {
            bonusReason: 'Quality contribution bonus',
          },
          balanceAfter: currentBalance,
          createdAt: transactionDate,
        })
      }
    }

    // Sort by date (oldest first)
    transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    // Insert all transactions
    if (transactions.length > 0) {
      await EkoTokenTransaction.insertMany(transactions)
      logger.success('Generated dummy token transactions', {
        collectorId,
        count: transactions.length,
        finalBalance: currentBalance,
      })
    }
  } catch (error) {
    logger.error('Error generating dummy token transactions', error instanceof Error ? error : new Error(String(error)), {
      collectorId,
    })
    throw error
  }
}

