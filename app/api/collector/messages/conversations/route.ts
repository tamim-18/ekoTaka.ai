import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { connectToDatabase, Conversation, Message, User } from '@/lib/models'
import { logger } from '@/lib/logger'

/**
 * GET /api/collector/messages/conversations
 * Get all conversations for the collector
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

    // Verify user is a collector
    const user = await User.findById(userId)
    if (!user || user.role !== 'collector') {
      return NextResponse.json(
        { error: 'Forbidden: Collector access only' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const archived = searchParams.get('archived') === 'true'

    // Find conversations where user is the collector
    const conversations = await Conversation.find({
      'participants.collectorId': userId,
      'isArchived.collector': archived,
    })
      .sort({ lastMessageAt: -1 })
      .lean() as any[]

    // Enrich with brand info
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const brand = await User.findById(conv.participants.brandId)
          .select('fullName email phone')
          .lean() as any

        return {
          id: conv._id.toString(),
          brand: {
            id: conv.participants.brandId,
            name: brand?.fullName || 'Brand',
            email: brand?.email,
            phone: brand?.phone,
          },
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt?.toISOString(),
          unreadCount: conv.unreadCount.collector,
          subject: conv.subject,
          relatedOrderId: conv.relatedOrderId,
          relatedPickupId: conv.relatedPickupId,
          isArchived: conv.isArchived.collector,
          createdAt: conv.createdAt.toISOString(),
        }
      })
    )

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations,
    })
  } catch (error) {
    logger.error('Error fetching collector conversations', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/collector/messages/conversations
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

    // Verify user is a collector
    const user = await User.findById(userId)
    if (!user || user.role !== 'collector') {
      return NextResponse.json(
        { error: 'Forbidden: Collector access only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { brandId, subject, relatedOrderId, relatedPickupId, initialMessage } = body

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      )
    }

    // Verify brand exists
    const brand = await User.findById(brandId)
    if (!brand || brand.role !== 'brand') {
      return NextResponse.json(
        { error: 'Invalid brand ID' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants.brandId': brandId,
      'participants.collectorId': userId,
    })

    if (conversation) {
      // Return existing conversation
      const brandInfo = await User.findById(brandId)
        .select('fullName email phone')
        .lean() as any

      return NextResponse.json({
        success: true,
        conversation: {
          id: conversation._id.toString(),
          brand: {
            id: conversation.participants.brandId,
            name: brandInfo?.fullName || 'Brand',
            email: brandInfo?.email,
            phone: brandInfo?.phone,
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
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: {
        brandId: brandId,
        collectorId: userId,
      },
      subject: subject || `Conversation with ${brand.fullName}`,
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
        senderRole: 'collector',
        content: initialMessage,
        readBy: {},
      })

      // Update conversation with last message
      conversation.lastMessage = {
        messageId: message._id.toString(),
        content: initialMessage,
        senderId: userId,
        senderRole: 'collector',
        sentAt: message.createdAt,
      }
      conversation.lastMessageAt = message.createdAt
      conversation.unreadCount.brand = 1
      await conversation.save()
    }

    const brandInfo = await User.findById(brandId)
      .select('fullName email phone')
      .lean() as any

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        brand: {
          id: conversation.participants.brandId,
          name: brandInfo?.fullName || 'Brand',
          email: brandInfo?.email,
          phone: brandInfo?.phone,
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
    logger.error('Error creating conversation', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

