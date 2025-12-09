'use client'

import { CloudSun, Newspaper, MessageCircle, X } from 'lucide-react'

interface WelcomeScreenProps {
    username: string
    onClose: () => void
    onNavigate?: (appId: string) => void
}

export default function WelcomeScreen({ username, onClose, onNavigate }: WelcomeScreenProps) {
    return (
        <div className="flex flex-col h-full bg-white/60 backdrop-blur-xl p-8 items-center justify-center text-center">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
                Welcome Back, {username}!
            </h1>
            <p className="text-gray-600 mb-8 max-w-md">
                You're logged into the What You Sayin' OS. Connect with friends and explore the island life.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
                <button
                    onClick={() => onNavigate?.('chat')}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/50 hover:bg-white/80 border border-white/60 shadow-lg transition-all hover:scale-105 active:scale-95 group"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <MessageCircle size={24} />
                    </div>
                    <span className="font-semibold text-gray-800">Chat</span>
                </button>
                <button
                    onClick={() => onNavigate?.('weather')}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/50 hover:bg-white/80 border border-white/60 shadow-lg transition-all hover:scale-105 active:scale-95 group"
                >
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <CloudSun size={24} />
                    </div>
                    <span className="font-semibold text-gray-800">Weather</span>
                </button>
                <button
                    onClick={() => onNavigate?.('news')}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/50 hover:bg-white/80 border border-white/60 shadow-lg transition-all hover:scale-105 active:scale-95 group"
                >
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Newspaper size={24} />
                    </div>
                    <span className="font-semibold text-gray-800">News</span>
                </button>
            </div>

            <button
                onClick={onClose}
                className="mt-12 text-sm text-gray-400 hover:text-gray-600 hover:underline transition-colors"
            >
                Dismiss
            </button>
        </div>
    )
}
