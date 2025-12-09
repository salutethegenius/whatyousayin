'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import ChatPanel from '@/components/ChatPanel'
import LoginForm from '@/components/LoginForm'
import api from '@/lib/api'
import { wsClient, type WebSocketMessage } from '@/lib/websocket'
import type { Room, Message, User } from '@/shared/types'

export default function ChatApp() {
    const [user, setUser] = useState<User | null>(null)
    const [rooms, setRooms] = useState<Room[]>([])
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [typingUsers, setTypingUsers] = useState<string[]>([])
    const messagesRef = useRef<Message[]>([])
    const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
    const [isAuthChecking, setIsAuthChecking] = useState(true)

    // Keep messagesRef in sync
    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    useEffect(() => {
        checkAuthAndLoad()

        // Cleanup WebSocket on unmount
        return () => {
            wsClient.disconnect()
            typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
        }
    }, [])

    const checkAuthAndLoad = async () => {
        try {
            await loadUser()
            await loadRooms()
        } catch (error) {
            // If auth fails, we just don't set user, so LoginForm shows
        } finally {
            setIsAuthChecking(false)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (selectedRoom && user) {
            loadMessages(selectedRoom.id)
            connectWebSocket(selectedRoom.id)
            setTypingUsers([])
        } else {
            wsClient.disconnect()
            setMessages([])
            setTypingUsers([])
        }
    }, [selectedRoom, user])

    const handleTypingEvent = useCallback((username: string) => {
        setTypingUsers(prev => {
            if (!prev.includes(username)) {
                return [...prev, username]
            }
            return prev
        })

        const existingTimeout = typingTimeoutsRef.current.get(username)
        if (existingTimeout) {
            clearTimeout(existingTimeout)
        }

        const timeout = setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u !== username))
            typingTimeoutsRef.current.delete(username)
        }, 3000)
        typingTimeoutsRef.current.set(username, timeout)
    }, [])

    const connectWebSocket = (roomId: number) => {
        wsClient.disconnect()

        const unsubscribe = wsClient.onMessage((wsMessage: WebSocketMessage) => {
            if (wsMessage.type === 'message' && wsMessage.id) {
                const exists = messagesRef.current.some(m => m.id === wsMessage.id)
                if (!exists) {
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

                    if (wsMessage.username) {
                        setTypingUsers(prev => prev.filter(u => u !== wsMessage.username))
                    }
                }
            } else if (wsMessage.type === 'typing' && wsMessage.username) {
                handleTypingEvent(wsMessage.username)
            }
        })

        wsClient.connect(roomId)
        return unsubscribe
    }

    const loadUser = async () => {
        try {
            const response = await api.get<User>('/api/auth/me')
            setUser(response.data)
            return response.data
        } catch (error) {
            console.error('Failed to load user:', error)
            throw error
        }
    }

    const loadRooms = async () => {
        try {
            const response = await api.get<Room[]>('/api/rooms')
            setRooms(response.data)
            // Automatically select first room if none selected
            if (response.data.length > 0 && !selectedRoom) {
                setSelectedRoom(response.data[0])
            }
        } catch (error) {
            console.error('Failed to load rooms:', error)
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

        if (wsClient.isConnected()) {
            wsClient.sendMessage(content, replyToId)
        } else {
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
        api.post<Room>('/api/rooms', { name, description, is_public: true })
            .then((response) => {
                setRooms([...rooms, response.data])
                setSelectedRoom(response.data)
            })
            .catch((error) => {
                console.error('Failed to create room:', error)
                alert('Failed to create room. Please try again.')
            })
    }

    const handleLoginSuccess = () => {
        checkAuthAndLoad()
    }

    if (isAuthChecking) {
        return <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
    }

    if (!user) {
        return (
            <div className="h-full overflow-y-auto">
                <LoginForm onLogin={handleLoginSuccess} />
            </div>
        )
    }

    return (
        <div className="flex h-full bg-gray-50">
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
    )
}
