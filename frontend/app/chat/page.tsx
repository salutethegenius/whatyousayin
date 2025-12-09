'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import ChatPanel from '@/components/ChatPanel'
import api from '@/lib/api'
import { wsClient, type WebSocketMessage } from '@/lib/websocket'
import type { Room, Message, User } from '@/shared/types'

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesRef = useRef<Message[]>([])
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    loadUser()
    loadRooms()

    // Cleanup WebSocket on unmount
    return () => {
      wsClient.disconnect()
      // Clear all typing timeouts
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id)
      connectWebSocket(selectedRoom.id)
      setTypingUsers([]) // Reset typing users when changing rooms
    } else {
      wsClient.disconnect()
      setMessages([])
      setTypingUsers([])
    }
  }, [selectedRoom])

  const handleTypingEvent = useCallback((username: string) => {
    // Add user to typing list if not already there
    setTypingUsers(prev => {
      if (!prev.includes(username)) {
        return [...prev, username]
      }
      return prev
    })

    // Clear existing timeout for this user
    const existingTimeout = typingTimeoutsRef.current.get(username)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set new timeout to remove user from typing list after 3s
    const timeout = setTimeout(() => {
      setTypingUsers(prev => prev.filter(u => u !== username))
      typingTimeoutsRef.current.delete(username)
    }, 3000)
    typingTimeoutsRef.current.set(username, timeout)
  }, [])

  const connectWebSocket = (roomId: number) => {
    // Disconnect from previous room
    wsClient.disconnect()

    // Set up message handler
    const unsubscribe = wsClient.onMessage((wsMessage: WebSocketMessage) => {
      if (wsMessage.type === 'message' && wsMessage.id) {
        // Check if message already exists (avoid duplicates)
        const exists = messagesRef.current.some(m => m.id === wsMessage.id)
        if (!exists) {
          // Convert WebSocket message to Message type
          const newMessage: Message = {
            id: wsMessage.id,
            content: wsMessage.content || '',
            room_id: wsMessage.room_id || roomId,
            user_id: wsMessage.user_id || 0,
            reply_to_id: wsMessage.reply_to_id,
            created_at: wsMessage.created_at || new Date().toISOString(),
            user: wsMessage.username ? {
              id: wsMessage.user_id || 0,
              username: wsMessage.username,
              is_active: true,
              is_admin: false,
              created_at: new Date().toISOString()
            } : undefined
          }
          setMessages(prev => [...prev, newMessage])

          // Remove user from typing when they send a message
          if (wsMessage.username) {
            setTypingUsers(prev => prev.filter(u => u !== wsMessage.username))
          }
        }
      } else if (wsMessage.type === 'typing' && wsMessage.username) {
        handleTypingEvent(wsMessage.username)
      }
    })

    // Connect to room
    wsClient.connect(roomId)

    // Return cleanup function
    return unsubscribe
  }

  const loadUser = async () => {
    try {
      const response = await api.get<User>('/api/auth/me')
      setUser(response.data)
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }

  const loadRooms = async () => {
    try {
      const response = await api.get<Room[]>('/api/rooms')
      setRooms(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load rooms:', error)
      setIsLoading(false)
    }
  }

  const loadMessages = async (roomId: number) => {
    try {
      const response = await api.get<Message[]>(`/api/rooms/${roomId}/messages`)
      setMessages(response.data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleSendMessage = async (content: string, replyToId?: number) => {
    if (!selectedRoom) return

    // Optimistic update - message will be added via WebSocket
    // But we can send via WebSocket directly for real-time
    if (wsClient.isConnected()) {
      wsClient.sendMessage(content, replyToId)
    } else {
      // Fallback to HTTP API if WebSocket is not connected
      try {
        const response = await api.post<Message>(`/api/rooms/${selectedRoom.id}/messages`, {
          content,
          reply_to_id: replyToId
        })
        setMessages(prev => [...prev, response.data])
      } catch (error) {
        console.error('Failed to send message:', error)
        alert('Failed to send message. Please try again.')
      }
    }
  }

  const handleTyping = useCallback(() => {
    if (wsClient.isConnected()) {
      wsClient.sendTyping()
    }
  }, [])

  const handleCreateRoom = () => {
    const name = prompt('Enter room name:')
    if (!name) return

    const description = prompt('Enter room description (optional):') || undefined

    api.post<Room>('/api/rooms', {
      name,
      description,
      is_public: true
    })
      .then((response) => {
        setRooms([...rooms, response.data])
        setSelectedRoom(response.data)
      })
      .catch((error) => {
        console.error('Failed to create room:', error)
        alert('Failed to create room. Please try again.')
      })
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelectRoom={setSelectedRoom}
          user={user}
          onCreateRoom={handleCreateRoom}
        />
        <ChatPanel
          room={selectedRoom}
          messages={messages}
          user={user}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          typingUsers={typingUsers}
          isLoading={isLoading}
        />
      </div>
    </AuthGuard>
  )
}


