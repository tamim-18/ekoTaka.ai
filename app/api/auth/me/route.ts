import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, User } from '@/lib/models'
import { getCurrentUser } from '@/lib/utils/auth'

export async function GET(request: NextRequest) {
  try {
    const tokenData = await getCurrentUser()
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const user = await User.findById(tokenData.userId).select('-password')
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

