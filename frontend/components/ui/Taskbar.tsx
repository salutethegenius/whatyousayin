'use client'

import { MessageCircle, Monitor } from 'lucide-react'

interface TaskbarProps {
    windows: Array<{
        id: string
        title: string
        isOpen: boolean
        isMinimized?: boolean
        isActive?: boolean // focused
        icon?: any
    }>
    onWindowClick: (id: string) => void
    onStartClick?: () => void
}

export default function Taskbar({ windows, onWindowClick, onStartClick }: TaskbarProps) {
    // Only show open windows
    const openWindows = windows.filter(w => w.isOpen)

    return (
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#d4d0c8] border-t-2 border-white flex items-center px-1 z-[100] shadow-md select-none">
            {/* Start Button */}
            <button
                onClick={onStartClick}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#d4d0c8] border-2 border-white border-r-gray-600 border-b-gray-600 active:border-gray-600 active:border-r-white active:border-b-white active:bg-gray-300 mr-2 hover:bg-gray-200 transition-colors"
            >
                <Monitor size={16} className="text-[#000080]" />
                <span className="font-bold text-sm text-black italic">Start</span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-400 mx-1 border-r border-white" />

            {/* Window Tasks */}
            <div className="flex-1 flex gap-1 overflow-x-auto px-1">
                {openWindows.map(window => (
                    <button
                        key={window.id}
                        onClick={() => onWindowClick(window.id)}
                        className={`
              flex items-center gap-2 px-3 py-1 min-w-[140px] max-w-[200px] text-sm truncate
              border-2 transition-all
              ${window.isActive && !window.isMinimized
                                ? 'bg-[#e0e0e0] border-gray-600 border-r-white border-b-white font-bold shadow-inner' // Depressed (Active)
                                : 'bg-[#d4d0c8] border-white border-r-gray-600 border-b-gray-600 hover:bg-gray-200' // Raised (Inactive)
                            }
            `}
                    >
                        {/* Icon */}
                        {window.icon ? (
                            <window.icon size={14} className="shrink-0" />
                        ) : (
                            <div className="w-3.5 h-3.5 bg-gray-400 rounded-sm shrink-0" />
                        )}
                        <span className="truncate">{window.title}</span>
                    </button>
                ))}
            </div>

            {/* Clock / Tray */}
            <div className="px-3 py-1 border-2 border-gray-600 border-r-white border-b-white bg-[#d4d0c8] inset-shadow ml-auto text-xs font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    )
}
