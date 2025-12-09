'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MessageBubble from './MessageBubble'
import type { Room, Message, User } from '@/shared/types'

interface ChatPanelProps {
  room: Room | null
  messages: Message[]
  user: User | null
  onSendMessage: (content: string, replyToId?: number) => void
  onTyping?: () => void
  typingUsers?: string[]
  isLoading?: boolean
}

export default function ChatPanel({
  room,
  messages,
  user,
  onSendMessage,
  onTyping,
  typingUsers = [],
  isLoading = false
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastTypingRef = useRef<number>(0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Debounced typing handler (500ms)
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)

    // Only send typing event if enough time has passed (500ms debounce)
    const now = Date.now()
    if (onTyping && now - lastTypingRef.current > 500) {
      onTyping()
      lastTypingRef.current = now
    }
  }, [onTyping])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && room) {
      onSendMessage(inputValue.trim(), replyingTo?.id)
      setInputValue('')
      setReplyingTo(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message)
    inputRef.current?.focus()
  }, [])

  // Filter out current user from typing users
  const otherTypingUsers = typingUsers.filter(u => u !== user?.username)

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-xl mb-2">👋</p>
          <p>Select a room to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Room Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">{room.name}</h2>
        {room.description && (
          <p className="text-sm text-gray-500 mt-1">{room.description}</p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-xl mb-2">💬</p>
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUser={user}
                onReply={handleReply}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {otherTypingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-gray-100 border-t border-gray-200"
          >
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">
                {otherTypingUsers.length === 1
                  ? otherTypingUsers[0]
                  : otherTypingUsers.length === 2
                    ? `${otherTypingUsers[0]} and ${otherTypingUsers[1]}`
                    : `${otherTypingUsers[0]} and ${otherTypingUsers.length - 1} others`}
              </span>
              <span className="ml-1">{otherTypingUsers.length === 1 ? 'is' : 'are'} typing</span>
              <span className="ml-1 flex space-x-1">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                >•</motion.span>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }}
                >•</motion.span>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }}
                >•</motion.span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="bg-bahamian-turquoise/10 border-t border-bahamian-turquoise p-2 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Replying to: <span className="font-semibold">{replyingTo.user?.username}</span>
            <span className="ml-2 text-gray-500">{replyingTo.content.substring(0, 50)}...</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-bahamian-turquoise hover:text-bahamian-green"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise resize-none"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-bahamian-turquoise text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}


