import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Conversation, Message, User } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/collector/messages/conversations/[id]/messages
 * Get messages in a conversation
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Get messages
    const messages = await Message.find({
      conversationId: conversationId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() as any[]

    // Get sender info for each message
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await User.findById(msg.senderId)
          .select('fullName email')
          .lean() as any

        return {
          id: msg._id.toString(),
          senderId: msg.senderId,
          senderName: sender?.fullName || (msg.senderRole === 'brand' ? 'Brand' : 'Collector'),
          senderRole: msg.senderRole,
          content: msg.content,
          readAt: msg.readBy?.collector ? msg.readBy.collector.toISOString() : null,
          isEdited: msg.isEdited,
          editedAt: msg.editedAt?.toISOString(),
          attachments: msg.attachments || [],
          createdAt: msg.createdAt.toISOString(),
        }
      })
    )

    // Reverse to show oldest first
    enrichedMessages.reverse()

    // Mark conversation as read for collector
    if (conversation.unreadCount.collector > 0) {
      conversation.unreadCount.collector = 0
      await conversation.save()
    }

    return NextResponse.json({
      success: true,
      messages: enrichedMessages,
      pagination: {
        page,
        limit,
        total: enrichedMessages.length,
      },
    })
  } catch (error) {
    logger.error('Error fetching messages', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/collector/messages/conversations/[id]/messages
 * Send a message in a conversation
 */
export async function POST(
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
    const { content, attachments } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

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

    // Create message
    const message = await Message.create({
      conversationId: conversationId,
      senderId: userId,
      senderRole: 'collector',
      content: content.trim(),
      attachments: attachments || [],
      readBy: {
        collector: new Date(), // Collector has read their own message
      },
    })

    // Update conversation
    conversation.lastMessage = {
      messageId: message._id.toString(),
      content: content.trim(),
      senderId: userId,
      senderRole: 'collector',
      sentAt: message.createdAt,
    }
    conversation.lastMessageAt = message.createdAt
    conversation.unreadCount.brand += 1
    await conversation.save()

    const sender = await User.findById(userId)
      .select('fullName email')
      .lean() as any

    return NextResponse.json({
      success: true,
      message: {
        id: message._id.toString(),
        senderId: message.senderId,
        senderName: sender?.fullName || 'Collector',
        senderRole: message.senderRole,
        content: message.content,
        readAt: null,
        isEdited: false,
        attachments: message.attachments || [],
        createdAt: message.createdAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error sending message', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

