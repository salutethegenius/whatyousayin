'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Message, User } from '@/shared/types'
import { getGravatarUrl } from '@/lib/gravatar'

interface MessageBubbleProps {
  message: Message
  currentUser: User | null
  onReply?: (message: Message) => void
}

export default function MessageBubble({ message, currentUser, onReply }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [imgError, setImgError] = useState(false)
  const isOwnMessage = currentUser && message.user_id === currentUser.id
  const displayName = message.user?.username || 'Unknown'
  const avatarInitial = displayName[0].toUpperCase()
  const avatarUrl = getGravatarUrl(message.user?.email || message.user?.username, 40)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold ${isOwnMessage ? 'bg-bahamian-turquoise' : 'bg-bahamian-green'}`}>
        {!imgError ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          avatarInitial
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col relative`}>
        {!isOwnMessage && (
          <p className="text-xs text-gray-500 mb-1 px-1">{displayName}</p>
        )}
        <div className={`rounded-lg px-4 py-2 max-w-[70%] ${isOwnMessage
          ? 'bg-bahamian-turquoise text-white'
          : 'bg-gray-100 text-gray-800'
          }`}>
          {/* Reply Preview */}
          {message.reply_to && (
            <div className={`text-xs mb-2 pb-2 border-b ${isOwnMessage ? 'border-white/30' : 'border-gray-300'
              }`}>
              <span className="opacity-75">↩ Replying to {message.reply_to.user?.username}: </span>
              {message.reply_to.content.substring(0, 40)}...
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Actions (Reply button) */}
        {showActions && onReply && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onReply(message)}
            className={`absolute top-0 ${isOwnMessage ? 'left-0 -ml-8' : 'right-0 -mr-8'} 
              bg-white border border-gray-200 rounded-full px-2 py-1 text-xs text-gray-600 
              hover:bg-bahamian-turquoise hover:text-white hover:border-bahamian-turquoise 
              transition-colors shadow-sm`}
            title="Reply"
          >
            ↩
          </motion.button>
        )}

        <p className={`text-xs text-gray-400 mt-1 px-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </motion.div>
  )
}


