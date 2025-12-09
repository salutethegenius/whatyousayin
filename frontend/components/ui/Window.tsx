'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { X, Minus, Square, Maximize2 } from 'lucide-react'

interface WindowProps {
  id: string
  title: string
  isOpen: boolean
  onClose: () => void
  onMinimize?: () => void
  children?: React.ReactNode
  zIndex?: number
  onFocus?: () => void
  initialPosition?: { x: number; y: number }
  isMobile?: boolean
  isMinimized?: boolean
}

export default function Window({
  id,
  title,
  isOpen,
  onClose,
  onMinimize,
  children,
  zIndex,
  onFocus,
  initialPosition = { x: 50, y: 50 },
  isMobile = false,
  isMinimized = false
}: WindowProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const constraintsRef = useRef(null)

  if (!isOpen) return null

  // If mobile, force full screen simplified view (or handle via separate layout)
  // But for this component, we'll adapt styles.
  if (isMobile) {
    if (isMinimized) return null // On mobile, minimized = hidden
    return (
      <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-lg shadow-sm">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200/50 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      drag={!isMaximized}
      dragMomentum={false}
      initial={initialPosition}
      onDragStart={onFocus}
      onClick={onFocus}
      style={{ zIndex, display: isMinimized ? 'none' : 'flex' }}
      className={`absolute top-0 left-0 flex-col bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-xl overflow-hidden
        ${isMaximized ? 'inset-4 !transform-none !w-auto !h-auto' : 'w-[900px] h-[700px]'}
      `}
    >
      {/* Title Bar - Drag Handle */}
      <div
        className="h-10 shrink-0 bg-white/40 border-b border-white/30 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none"
        onDoubleClick={() => setIsMaximized(!isMaximized)}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 group">
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 border border-red-500/50 flex items-center justify-center"
            >
              <X size={8} className="opacity-0 group-hover:opacity-100 text-red-900" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMinimize?.(); }}
              className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 border border-yellow-500/50 flex items-center justify-center"
            >
              <Minus size={8} className="opacity-0 group-hover:opacity-100 text-yellow-900" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}
              className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 border border-green-500/50 flex items-center justify-center"
            >
              {isMaximized ? <Minus size={8} className="opacity-0 group-hover:opacity-100 text-green-900" /> : <Maximize2 size={8} className="opacity-0 group-hover:opacity-100 text-green-900" />}
            </button>
          </div>
          <span className="text-sm font-medium text-gray-700/80 ml-2">{title}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative flex flex-col min-h-0">
        {children}
      </div>
    </motion.div>
  )
}
