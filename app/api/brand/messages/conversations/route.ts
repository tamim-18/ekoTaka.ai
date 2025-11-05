import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Conversation, Message, User } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/brand/messages/conversations
 * Get all conversations for the brand
 */
export async function GET(request: NextRequest) {
  try {
    const tokenData = await getCurrentUser()

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = tokenData.userId

    await connectToDatabase()

    // Verify user is a brand
    const user = await User.findById(userId)
    if (!user || user.role !== 'brand') {
      return NextResponse.json(
        { error: 'Forbidden: Brand access only' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const archived = searchParams.get('archived') === 'true'

    // Find conversations where user is the brand
    const conversations = await Conversation.find({
      'participants.brandId': userId,
      'isArchived.brand': archived,
    })
      .sort({ lastMessageAt: -1 })
      .lean() as any[]

    // Enrich with collector info
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const collector = await User.findById(conv.participants.collectorId)
          .select('fullName email phone')
          .lean() as any

        return {
          id: conv._id.toString(),
          collector: {
            id: conv.participants.collectorId,
            name: collector?.fullName || 'Collector',
            email: collector?.email,
            phone: collector?.phone,
          },
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt?.toISOString(),
          unreadCount: conv.unreadCount.brand,
          subject: conv.subject,
          relatedOrderId: conv.relatedOrderId,
          relatedPickupId: conv.relatedPickupId,
          isArchived: conv.isArchived.brand,
          createdAt: conv.createdAt.toISOString(),
        }
      })
    )

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations,
    })
  } catch (error) {
    logger.error('Error fetching brand conversations', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/brand/messages/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const tokenData = await getCurrentUser()

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = tokenData.userId

    await connectToDatabase()

    // Verify user is a brand
    const user = await User.findById(userId)
    if (!user || user.role !== 'brand') {
      return NextResponse.json(
        { error: 'Forbidden: Brand access only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { collectorId, subject, relatedOrderId, relatedPickupId, initialMessage } = body

    if (!collectorId) {
      return NextResponse.json(
        { error: 'Collector ID is required' },
        { status: 400 }
      )
    }

    // Verify collector exists
    const collector = await User.findById(collectorId)
    if (!collector || collector.role !== 'collector') {
      return NextResponse.json(
        { error: 'Invalid collector ID' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants.brandId': userId,
      'participants.collectorId': collectorId,
    })

    if (conversation) {
      // Return existing conversation
      const collectorInfo = await User.findById(collectorId)
        .select('fullName email phone')
        .lean() as any

      return NextResponse.json({
        success: true,
        conversation: {
          id: conversation._id.toString(),
          collector: {
            id: conversation.participants.collectorId,
            name: collectorInfo?.fullName || 'Collector',
            email: collectorInfo?.email,
            phone: collectorInfo?.phone,
          },
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt?.toISOString(),
          unreadCount: conversation.unreadCount.brand,
          subject: conversation.subject,
          relatedOrderId: conversation.relatedOrderId,
          relatedPickupId: conversation.relatedPickupId,
          isArchived: conversation.isArchived.brand,
          createdAt: conversation.createdAt.toISOString(),
        },
      })
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: {
        brandId: userId,
        collectorId: collectorId,
      },
      subject: subject || `Conversation with ${collector.fullName}`,
      relatedOrderId,
      relatedPickupId,
      unreadCount: {
        brand: 0,
        collector: 0,
      },
      isArchived: {
        brand: false,
        collector: false,
      },
    })

    // If initial message provided, create it
    if (initialMessage) {
      const message = await Message.create({
        conversationId: conversation._id.toString(),
        senderId: userId,
        senderRole: 'brand',
        content: initialMessage,
        readBy: {},
      })

      // Update conversation with last message
      conversation.lastMessage = {
        messageId: message._id.toString(),
        content: initialMessage,
        senderId: userId,
        senderRole: 'brand',
        sentAt: message.createdAt,
      }
      conversation.lastMessageAt = message.createdAt
      conversation.unreadCount.collector = 1
      await conversation.save()
    }

    const collectorInfo = await User.findById(collectorId)
      .select('fullName email phone')
      .lean() as any

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        collector: {
          id: conversation.participants.collectorId,
          name: collectorInfo?.fullName || 'Collector',
          email: collectorInfo?.email,
          phone: collectorInfo?.phone,
        },
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt?.toISOString(),
        unreadCount: conversation.unreadCount.brand,
        subject: conversation.subject,
        relatedOrderId: conversation.relatedOrderId,
        relatedPickupId: conversation.relatedPickupId,
        isArchived: conversation.isArchived.brand,
        createdAt: conversation.createdAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error creating conversation', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

