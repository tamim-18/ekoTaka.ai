import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: 'collector' | 'brand'
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Compare password with hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions)
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Get token from cookies (server-side)
 */
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth-token')?.value || null
}

/**
 * Set token in cookies (server-side)
 */
export async function setTokenInCookies(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Remove token from cookies (server-side)
 */
export async function removeTokenFromCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

/**
 * Get current user from token (server-side)
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getTokenFromCookies()
  if (!token) return null
  return verifyToken(token)
}

