import { NextRequest, NextResponse } from 'next/server'
import { removeTokenFromCookies } from '@/lib/utils/auth'

export async function POST(request: NextRequest) {
  try {
    await removeTokenFromCookies()

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to sign out',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

