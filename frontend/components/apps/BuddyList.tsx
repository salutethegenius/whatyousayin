'use client'

import { useState } from 'react'
import { User, ChevronDown, ChevronRight, Settings, MessageSquare } from 'lucide-react'

interface BuddyListProps {
    onlineUsers: string[]
    currentUser: string
    onChatClick?: (username: string) => void
}

export default function BuddyList({ onlineUsers, currentUser, onChatClick }: BuddyListProps) {
    const [isOnlineOpen, setIsOnlineOpen] = useState(true)
    const [isOfflineOpen, setIsOfflineOpen] = useState(false)

    // Filter out current user from list
    const buddies = onlineUsers.filter(u => u !== currentUser)

    return (
        <div className="flex flex-col h-full bg-white/60 backdrop-blur-md font-sans text-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-200/20 flex justify-between items-center">
                <span className="font-semibold text-gray-800 tracking-wide">Contacts</span>
                <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-black/5 rounded-full text-gray-600 transition-colors">
                        <MessageSquare size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-black/5 rounded-full text-gray-600 transition-colors">
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* Search (Optional later) */}

            {/* Main List Area */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">

                {/* Online Group */}
                <div className="mb-4">
                    <div
                        className="flex items-center cursor-pointer hover:bg-black/5 px-3 py-2 rounded-lg transition-colors group"
                        onClick={() => setIsOnlineOpen(!isOnlineOpen)}
                    >
                        {isOnlineOpen ? <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600" /> : <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600" />}
                        <span className="font-medium text-gray-700 ml-2 text-sm uppercase tracking-wider">Online ({buddies.length})</span>
                    </div>

                    {isOnlineOpen && (
                        <div className="mt-1 ml-2 space-y-0.5">
                            {buddies.length === 0 ? (
                                <div className="text-gray-400 text-xs italic pl-6 py-2">No one is online</div>
                            ) : (
                                buddies.map(username => (
                                    <div
                                        key={username}
                                        onDoubleClick={() => onChatClick?.(username)}
                                        className="flex items-center gap-3 cursor-pointer hover:bg-blue-50/50 hover:text-blue-600 px-3 py-2 rounded-lg group transition-all"
                                    >
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                {username[0].toUpperCase()}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <span className="font-medium text-gray-700 group-hover:text-blue-600">{username}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Offline Group */}
                <div>
                    <div
                        className="flex items-center cursor-pointer hover:bg-black/5 px-3 py-2 rounded-lg transition-colors group"
                        onClick={() => setIsOfflineOpen(!isOfflineOpen)}
                    >
                        {isOfflineOpen ? <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600" /> : <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600" />}
                        <span className="font-medium text-gray-500 ml-2 text-sm uppercase tracking-wider">Offline</span>
                    </div>
                    {isOfflineOpen && (
                        <div className="ml-8 mt-2 text-gray-400 text-xs italic">
                            Offline contacts hidden
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
