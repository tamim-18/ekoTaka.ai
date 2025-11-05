import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Conversation, User } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/collector/messages/conversations/[id]
 * Get conversation details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const tokenData = await getCurrentUser()

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = tokenData.userId
    const resolvedParams = await Promise.resolve(params)
    const conversationId = resolvedParams.id

    await connectToDatabase()

    // Verify user is a collector
    const user = await User.findById(userId)
    if (!user || user.role !== 'collector') {
      return NextResponse.json(
        { error: 'Forbidden: Collector access only' },
        { status: 403 }
      )
    }

    // Find conversation
    const conversation = await Conversation.findById(conversationId).lean() as any

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify user is a participant
    if (conversation.participants.collectorId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Not your conversation' },
        { status: 403 }
      )
    }

    // Get brand info
    const brand = await User.findById(conversation.participants.brandId)
      .select('fullName email phone')
      .lean() as any

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        brand: {
          id: conversation.participants.brandId,
          name: brand?.fullName || 'Brand',
          email: brand?.email,
          phone: brand?.phone,
        },
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt?.toISOString(),
        unreadCount: conversation.unreadCount.collector,
        subject: conversation.subject,
        relatedOrderId: conversation.relatedOrderId,
        relatedPickupId: conversation.relatedPickupId,
        isArchived: conversation.isArchived.collector,
        createdAt: conversation.createdAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error fetching conversation', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/collector/messages/conversations/[id]
 * Update conversation (archive/unarchive, mark as read)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const tokenData = await getCurrentUser()

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = tokenData.userId
    const resolvedParams = await Promise.resolve(params)
    const conversationId = resolvedParams.id

    await connectToDatabase()

    // Verify user is a collector
    const user = await User.findById(userId)
    if (!user || user.role !== 'collector') {
      return NextResponse.json(
        { error: 'Forbidden: Collector access only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { archived, markAsRead } = body

    // Find conversation
    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify user is a participant
    if (conversation.participants.collectorId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Not your conversation' },
        { status: 403 }
      )
    }

    // Update fields
    if (typeof archived === 'boolean') {
      conversation.isArchived.collector = archived
    }

    if (markAsRead === true) {
      conversation.unreadCount.collector = 0
    }

    await conversation.save()

    return NextResponse.json({
      success: true,
      message: 'Conversation updated',
    })
  } catch (error) {
    logger.error('Error updating conversation', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}

