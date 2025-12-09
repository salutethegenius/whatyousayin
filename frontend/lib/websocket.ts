import { getToken } from './auth'
import type { Message } from '@/shared/types'

const WS_URL = (typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000')
  : 'ws://localhost:8000')

export interface WebSocketMessage {
  type: 'message' | 'connected' | 'user_joined' | 'user_left' | 'typing' | 'presence' | 'presence_sync'
  id?: number
  content?: string
  room_id?: number
  user_id?: number
  username?: string
  reply_to_id?: number
  created_at?: string
  message?: string
  status?: 'online' | 'offline'
  users?: string[]
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private target: number | 'system' | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageHandlers: Set<(message: WebSocketMessage) => void> = new Set()
  private onConnectHandlers: Set<() => void> = new Set()
  private onDisconnectHandlers: Set<() => void> = new Set()

  connect(target: number | 'system'): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.target === target) {
      return // Already connected
    }

    this.disconnect()
    this.target = target

    const token = getToken()
    if (!token) {
      console.error('No authentication token found')
      return
    }

    const path = target === 'system' ? 'ws/system' : `ws/${target}`
    const url = `${WS_URL}/${path}?token=${encodeURIComponent(token)}`

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log(`WebSocket connected to ${target}`)
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.onConnectHandlers.forEach(handler => handler())
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.messageHandlers.forEach(handler => handler(message))
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.stopHeartbeat()
        this.onDisconnectHandlers.forEach(handler => handler())
        this.attemptReconnect(target)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.attemptReconnect(target)
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.target = null
    this.reconnectAttempts = 0
  }

  sendMessage(content: string, replyToId?: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        content,
        reply_to_id: replyToId
      }))
    } else {
      console.error('WebSocket is not connected')
    }
  }

  sendTyping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing'
      }))
    }
  }

  onMessage(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onConnect(handler: () => void): () => void {
    this.onConnectHandlers.add(handler)
    return () => this.onConnectHandlers.delete(handler)
  }

  onDisconnect(handler: () => void): () => void {
    this.onDisconnectHandlers.add(handler)
    return () => this.onDisconnectHandlers.delete(handler)
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private attemptReconnect(target: number | 'system'): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      this.connect(target)
    }, delay)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send a ping to keep connection alive
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

// Singleton instance
export const wsClient = new WebSocketClient()

