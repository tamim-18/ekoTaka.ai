'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import BrandLayout from '@/components/layouts/BrandLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Send,
  Loader2,
  Search,
  User,
  ArrowLeft,
  MoreVertical,
  Archive,
  Clock,
  Package,
  ExternalLink,
  ShoppingCart,
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { toast } from 'sonner'

interface Conversation {
  id: string
  collector: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  lastMessage?: {
    content: string
    senderId: string
    senderRole: 'brand' | 'collector'
    sentAt: string
  }
  lastMessageAt?: string
  unreadCount: number
  subject?: string
  relatedOrderId?: string
  relatedPickupId?: string
  isArchived: boolean
  createdAt: string
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: 'brand' | 'collector'
  content: string
  readAt: string | null
  isEdited: boolean
  editedAt?: string
  attachments: any[]
  createdAt: string
}

export default function BrandMessagesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [pickupInfo, setPickupInfo] = useState<any>(null)

  // Redirect if not authenticated or not brand
  useEffect(() => {
    if (!loading && (!user || user.role !== 'brand')) {
      router.push('/sign-in')
    }
  }, [user, loading, router])

  // Handle URL query parameter for conversation selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const conversationId = params.get('conversation')
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === conversationId)
      if (conv) {
        setSelectedConversation(conv)
      }
    }
  }, [conversations])

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/brand/messages/conversations')
      const data = await response.json()
      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoadingConversations(false)
    }
  }

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/brand/messages/conversations/${conversationId}/messages`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages)
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return

    setSendingMessage(true)
    try {
      const response = await fetch(
        `/api/brand/messages/conversations/${selectedConversation.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: messageInput.trim() }),
        }
      )

      const data = await response.json()
      if (data.success) {
        setMessageInput('')
        // Add message to local state
        setMessages((prev) => [...prev, data.message])
        // Refresh conversations to update last message
        fetchConversations()
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        toast.error(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  // Load conversations on mount
  useEffect(() => {
    if (user && user.role === 'brand') {
      fetchConversations()
      
      // Set up auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchConversations()
        if (selectedConversation) {
          fetchMessages(selectedConversation.id)
        }
      }, 10000)
      setRefreshInterval(interval)

      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [user])

  // Load messages and pickup info when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      // Mark as read
      fetch(`/api/brand/messages/conversations/${selectedConversation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAsRead: true }),
      })

      // Fetch pickup info if conversation is related to a pickup
      if (selectedConversation.relatedPickupId) {
        fetchPickupInfo(selectedConversation.relatedPickupId)
      } else {
        setPickupInfo(null)
      }
    }
  }, [selectedConversation])

  // Fetch pickup information
  const fetchPickupInfo = async (pickupId: string) => {
    try {
      // Get pickup details from pickup API
      const response = await fetch(`/api/pickups/${pickupId}`)
      const data = await response.json()
      if (data.success && data.pickup) {
        const pickup = data.pickup
        setPickupInfo({
          id: pickup.id,
          category: pickup.category,
          availableWeight: pickup.actualWeight || pickup.estimatedWeight,
          location: pickup.location,
        })
      }
    } catch (error) {
      console.error('Error fetching pickup info:', error)
    }
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      conv.collector.name.toLowerCase().includes(query) ||
      conv.subject?.toLowerCase().includes(query) ||
      conv.lastMessage?.content.toLowerCase().includes(query)
    )
  })

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }

  if (loading || !user || user.role !== 'brand') {
    return (
      <BrandLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </BrandLayout>
    )
  }

  return (
    <BrandLayout>
      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations List */}
        <div className="w-full md:w-80 border-r bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {conv.collector.name}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-emerald-500 text-white text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conv.subject && (
                          <p className="text-xs text-emerald-600 font-medium truncate mb-1">
                            {conv.subject}
                          </p>
                        )}
                        {conv.lastMessage && (
                          <p className="text-sm text-gray-600 truncate">
                            {conv.lastMessage.senderRole === 'brand' ? 'You: ' : ''}
                            {conv.lastMessage.content}
                          </p>
                        )}
                        {conv.lastMessageAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatMessageTime(conv.lastMessageAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b bg-white">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {selectedConversation.collector.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedConversation.collector.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pickup Context & Quick Actions */}
                {selectedConversation.relatedPickupId && pickupInfo && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 flex-1">
                        <Package className="h-5 w-5 text-emerald-600" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            Related Pickup: {pickupInfo.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            {pickupInfo.availableWeight} kg available • {pickupInfo.location?.address || 'Location not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/brand/inventory?highlight=${pickupInfo.id}`)}
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            router.push(`/brand/inventory?highlight=${pickupInfo.id}&order=true`)
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-xs"
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Order
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.senderRole === 'brand' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.senderRole === 'brand'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-gray-900 border'
                        }`}
                      >
                        {msg.senderRole === 'collector' && (
                          <p className="text-xs font-semibold mb-1 text-emerald-600">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p
                            className={`text-xs ${
                              msg.senderRole === 'brand' ? 'text-emerald-100' : 'text-gray-400'
                            }`}
                          >
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </p>
                          {msg.senderRole === 'brand' && msg.readAt && (
                            <Clock className="h-3 w-3 text-emerald-100" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </BrandLayout>
  )
}

