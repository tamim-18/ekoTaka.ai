import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, User } from '@/lib/models'
import { hashPassword, generateToken, setTokenInCookies } from '@/lib/utils/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { email, password, fullName, phone, role } = body

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Validate and determine role
    const validRoles: ('collector' | 'brand')[] = ['collector', 'brand']
    let userRole: 'collector' | 'brand' = role || 'collector'
    
    // Validate role
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "collector" or "brand"' },
        { status: 400 }
      )
    }
    
    // Use provided role, default to collector
    userRole = role || 'collector'

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      phone,
      role: userRole,
      isEmailVerified: false, // Can add email verification later
    })

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    // Set token in cookies
    await setTokenInCookies(token)

    logger.info('User signed up', {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Signup error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to create account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

