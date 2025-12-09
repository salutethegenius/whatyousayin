'use client'

import { LucideIcon } from 'lucide-react'

interface AppIconProps {
    icon: LucideIcon
    label: string
    onClick: () => void
    color?: string
    isActive?: boolean
}

export default function AppIcon({ icon: Icon, label, onClick, color = "bg-blue-500", isActive = false }: AppIconProps) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2 group p-2 rounded-xl hover:bg-white/20 transition-all duration-200 active:scale-95 w-[80px] sm:w-[100px] relative"
        >
            <div className={`
        w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center 
        shadow-lg backdrop-blur-md border border-white/20
        ${color} bg-opacity-80 group-hover:bg-opacity-100 transition-all
        ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}
      `}>
                <Icon className="text-white w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-white drop-shadow-md text-center leading-tight">
                {label}
            </span>
            {isActive && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
        </button>
    )
}
