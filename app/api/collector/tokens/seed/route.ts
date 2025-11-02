import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateDummyTokenTransactions } from '@/lib/utils/token-dummy-data'
import { logger } from '@/lib/logger'

/**
 * POST /api/collector/tokens/seed
 * Generate dummy token transactions for the logged-in user
 * This is useful for testing and development
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const count = body.count || 30 // Default to 30 transactions

    logger.info('Seeding dummy token transactions', { userId, count })

    await generateDummyTokenTransactions({
      collectorId: userId,
      count: typeof count === 'number' ? count : 30,
    })

    return NextResponse.json({
      success: true,
      message: `Generated ${count} dummy token transactions`,
    })
  } catch (error) {
    logger.error('Error seeding token transactions', error instanceof Error ? error : new Error(String(error)), {
      userId: await auth().then((a) => a.userId),
    })
    return NextResponse.json(
      {
        error: 'Failed to seed token transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

