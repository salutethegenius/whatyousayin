'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Room, User } from '@/shared/types'
import { getGravatarUrl } from '@/lib/gravatar'

interface SidebarProps {
  rooms: Room[]
  selectedRoom: Room | null
  onSelectRoom: (room: Room) => void
  user: User | null
  onCreateRoom: () => void
}

export default function Sidebar({
  rooms,
  selectedRoom,
  onSelectRoom,
  user,
  onCreateRoom
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: isCollapsed ? -280 : 0 }}
      className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-64'
        }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-bahamian-turquoise text-white">
        {!isCollapsed && (
          <h2 className="text-lg font-bold">What You Sayin'?</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 right-2 text-white hover:bg-white/20 rounded p-1"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* User Profile Section */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-bahamian-turquoise overflow-hidden flex items-center justify-center text-white font-semibold">
              <img
                src={getGravatarUrl(user.email || user.username, 40)}
                alt={user.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <span className="absolute">{user.username[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user.username}
              </p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        </div>
      )}

      {/* Rooms Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Public Rooms
              </h3>
              <button
                onClick={onCreateRoom}
                className="text-bahamian-turquoise hover:text-bahamian-green text-xl font-bold"
                title="Create Room"
              >
                +
              </button>
            </div>
          )}

          <div className="space-y-1">
            {rooms.map((room) => (
              <motion.button
                key={room.id}
                onClick={() => onSelectRoom(room)}
                whileHover={{ x: 4 }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedRoom?.id === room.id
                  ? 'bg-bahamian-turquoise text-white'
                  : 'hover:bg-gray-100 text-gray-700'
                  }`}
              >
                {!isCollapsed && (
                  <div>
                    <p className="font-medium truncate">{room.name}</p>
                    {room.description && (
                      <p className="text-xs opacity-75 truncate mt-1">
                        {room.description}
                      </p>
                    )}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

