/**
 * Role Checker Utility
 * 
 * Architecture:
 * - Primary: Use user.role from database (single source of truth)
 * - Fallback: Email-based check for backward compatibility (legacy users)
 * 
 * IMPORTANT: Always prefer user.role from database when available.
 * Email-based check is only for backward compatibility with old users.
 */

// Legacy brand email addresses (for backward compatibility only)
const LEGACY_BRAND_EMAILS = [
  'taohidkhantamim@gmail.com',
  'taohidkhan633@gmail.com',
]

export type UserRole = 'brand' | 'collector'

/**
 * Get user role from user object (preferred method)
 * @param user - User object with role property
 * @returns User role ('brand' or 'collector')
 */
export function getUserRoleFromUser(user: { role?: string } | null | undefined): UserRole {
  if (!user || !user.role) {
    return 'collector' // Default to collector
  }
  
  return user.role === 'brand' ? 'brand' : 'collector'
}

/**
 * Get user role based on email address (legacy/fallback method)
 * Use this only when user object is not available
 * @param email - User's email address
 * @returns User role ('brand' or 'collector')
 * @deprecated Use getUserRoleFromUser instead. This is only for backward compatibility.
 */
export function getUserRole(email: string | null | undefined): UserRole {
  if (!email) {
    return 'collector' // Default to collector if no email
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Legacy email check (for backward compatibility only)
  if (LEGACY_BRAND_EMAILS.includes(normalizedEmail)) {
    console.log('[Role Check] Legacy brand email detected:', normalizedEmail)
    return 'brand'
  }

  // Default to collector
  return 'collector'
}

/**
 * Check if email is a brand email
 */
export function isBrandEmail(email: string | null | undefined): boolean {
  return getUserRole(email) === 'brand'
}

/**
 * Get dashboard URL based on role
 * @param role - User role ('brand' or 'collector')
 * @returns Dashboard URL path
 */
export function getDashboardUrl(role: UserRole | string): string {
  return role === 'brand' ? '/brand/dashboard' : '/collector/dashboard'
}

