import { logger } from '@/lib/logger'

/**
 * Token calculation service for EkoTokens
 * Handles all token earning logic and calculations
 */

// Base token rates per kg by plastic category
const CATEGORY_MULTIPLIERS: Record<string, number> = {
  PET: 1.2,    // Higher value plastic
  HDPE: 1.1,   // High-density polyethylene
  LDPE: 0.9,   // Low-density polyethylene
  PP: 1.0,     // Polypropylene
  PS: 0.9,     // Polystyrene
  Other: 0.8,  // Mixed/unknown
}

// Base tokens per kg
const BASE_TOKENS_PER_KG = 1.0

// Bonus configurations
const AI_CONFIDENCE_BONUS = {
  high: { threshold: 0.95, multiplier: 1.2 },  // >95% confidence
  medium: { threshold: 0.90, multiplier: 1.1 }, // >90% confidence
}

const BONUS_TOKENS = {
  afterPhoto: 5,
  accuracyBonus: 10,  // If AI weight vs actual weight difference <5%
  manualReviewVerified: 0.05, // 5% bonus multiplier
}

// Milestone rewards
export const MILESTONES = {
  first_pickup: { threshold: 1, tokens: 50, description: 'First Pickup - Welcome Bonus!' },
  ten_pickups: { threshold: 10, tokens: 100, description: '10 Verified Pickups - Great Progress!' },
  fifty_pickups: { threshold: 50, tokens: 500, description: '50 Verified Pickups - Amazing Dedication!' },
  hundred_pickups: { threshold: 100, tokens: 1000, description: '100 Verified Pickups - Elite Collector!' },
}

export interface PickupTokenCalculationParams {
  category: 'PET' | 'HDPE' | 'LDPE' | 'PP' | 'PS' | 'Other'
  weight: number // Estimated or actual weight
  aiConfidence?: number
  hasAfterPhoto?: boolean
  actualWeight?: number // For accuracy calculation
  wasManuallyReviewed?: boolean
  isFirstPickup?: boolean
}

export interface TokenCalculationResult {
  baseTokens: number
  categoryBonus: number
  confidenceBonus: number
  afterPhotoBonus: number
  accuracyBonus: number
  manualReviewBonus: number
  totalTokens: number
  breakdown: string[]
}

/**
 * Calculate tokens for a verified pickup
 */
export function calculateTokensForPickup(params: PickupTokenCalculationParams): TokenCalculationResult {
  const {
    category,
    weight,
    aiConfidence = 1.0,
    hasAfterPhoto = false,
    actualWeight,
    wasManuallyReviewed = false,
  } = params

  const breakdown: string[] = []
  let totalTokens = 0

  // Base calculation: weight × category multiplier
  const categoryMultiplier = CATEGORY_MULTIPLIERS[category] || CATEGORY_MULTIPLIERS.Other
  const baseTokens = weight * BASE_TOKENS_PER_KG * categoryMultiplier
  totalTokens += baseTokens
  breakdown.push(`${weight.toFixed(1)}kg × ${BASE_TOKENS_PER_KG} × ${categoryMultiplier.toFixed(1)} = ${baseTokens.toFixed(1)} base tokens`)

  // Category bonus (already included in multiplier, but track separately)
  const categoryBonus = baseTokens - (weight * BASE_TOKENS_PER_KG)
  
  // AI Confidence bonus
  let confidenceMultiplier = 1.0
  let confidenceBonus = 0
  
  if (aiConfidence >= AI_CONFIDENCE_BONUS.high.threshold) {
    confidenceMultiplier = AI_CONFIDENCE_BONUS.high.multiplier
    confidenceBonus = baseTokens * (AI_CONFIDENCE_BONUS.high.multiplier - 1)
    breakdown.push(`High AI confidence (${(aiConfidence * 100).toFixed(0)}%): +${confidenceBonus.toFixed(1)} tokens`)
  } else if (aiConfidence >= AI_CONFIDENCE_BONUS.medium.threshold) {
    confidenceMultiplier = AI_CONFIDENCE_BONUS.medium.multiplier
    confidenceBonus = baseTokens * (AI_CONFIDENCE_BONUS.medium.multiplier - 1)
    breakdown.push(`Good AI confidence (${(aiConfidence * 100).toFixed(0)}%): +${confidenceBonus.toFixed(1)} tokens`)
  }
  
  totalTokens = baseTokens * confidenceMultiplier

  // After photo bonus
  let afterPhotoBonus = 0
  if (hasAfterPhoto) {
    afterPhotoBonus = BONUS_TOKENS.afterPhoto
    totalTokens += afterPhotoBonus
    breakdown.push(`After photo provided: +${afterPhotoBonus} tokens`)
  }

  // Accuracy bonus (if actual weight provided and within 5% of estimated)
  let accuracyBonus = 0
  if (actualWeight && weight > 0) {
    const weightDifference = Math.abs(actualWeight - weight) / weight
    if (weightDifference <= 0.05) { // Within 5%
      accuracyBonus = BONUS_TOKENS.accuracyBonus
      totalTokens += accuracyBonus
      breakdown.push(`High accuracy estimate: +${accuracyBonus} tokens`)
    }
  }

  // Manual review bonus
  let manualReviewBonus = 0
  if (wasManuallyReviewed) {
    manualReviewBonus = totalTokens * BONUS_TOKENS.manualReviewVerified
    totalTokens += manualReviewBonus
    breakdown.push(`Manual review verified: +${manualReviewBonus.toFixed(1)} tokens`)
  }

  // Round to nearest integer
  totalTokens = Math.round(totalTokens)

  return {
    baseTokens: Math.round(baseTokens),
    categoryBonus: Math.round(categoryBonus),
    confidenceBonus: Math.round(confidenceBonus),
    afterPhotoBonus,
    accuracyBonus,
    manualReviewBonus: Math.round(manualReviewBonus),
    totalTokens,
    breakdown,
  }
}

/**
 * Check if collector has achieved any milestones
 */
export function checkMilestones(verifiedPickupCount: number): Array<{
  milestone: string
  tokens: number
  description: string
}> {
  const achieved: Array<{ milestone: string; tokens: number; description: string }> = []

  for (const [key, milestone] of Object.entries(MILESTONES)) {
    if (verifiedPickupCount === milestone.threshold) {
      achieved.push({
        milestone: key,
        tokens: milestone.tokens,
        description: milestone.description,
      })
    }
  }

  return achieved
}

/**
 * Get next milestone progress
 */
export function getNextMilestone(verifiedPickupCount: number): {
  milestone: string
  tokens: number
  description: string
  progress: number
  current: number
  target: number
} | null {
  const milestoneEntries = Object.entries(MILESTONES).sort((a, b) => a[1].threshold - b[1].threshold)

  for (const [key, milestone] of milestoneEntries) {
    if (verifiedPickupCount < milestone.threshold) {
      return {
        milestone: key,
        tokens: milestone.tokens,
        description: milestone.description,
        progress: (verifiedPickupCount / milestone.threshold) * 100,
        current: verifiedPickupCount,
        target: milestone.threshold,
      }
    }
  }

  return null // All milestones achieved
}

