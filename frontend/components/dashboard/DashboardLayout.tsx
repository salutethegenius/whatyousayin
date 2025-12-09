'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, CloudSun, Newspaper, Calendar, ShoppingBag, Map as MapIcon, User as UserIcon } from 'lucide-react'
import AppIcon from './AppIcon'
import Window from '../ui/Window'
import Taskbar from '../ui/Taskbar'
import ChatApp from '../apps/ChatApp'
import BuddyList from '../apps/BuddyList'
import WelcomeScreen from '../apps/WelcomeScreen'
import LoginForm from '../LoginForm'
import api from '@/lib/api'
import { WebSocketClient, WebSocketMessage } from '@/lib/websocket'
import { User } from '@/shared/types'

interface DashboardWindow {
    id: string
    title: string
    component: React.ReactNode
    isOpen: boolean
    isMinimized?: boolean
    zIndex: number
    icon?: any
}

export default function DashboardLayout() {
    const [user, setUser] = useState<User | null>(null)
    const [windows, setWindows] = useState<DashboardWindow[]>([])
    const [topZIndex, setTopZIndex] = useState(10)
    const [isMobile, setIsMobile] = useState(false)
    const [onlineBuddies, setOnlineBuddies] = useState<string[]>([])
    const [currentTime, setCurrentTime] = useState<string>('')

    // System WebSocket for Presence & DMs
    const systemWs = useRef<WebSocketClient | null>(null)

    useEffect(() => {
        // Init time
        const updateTime = () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        updateTime()
        const infoInterval = setInterval(updateTime, 60000)

        // Mobile check
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)

        // Initial Auth Check
        checkAuth()

        return () => {
            clearInterval(infoInterval)
            window.removeEventListener('resize', checkMobile)
            systemWs.current?.disconnect()
        }
    }, [])

    const checkAuth = async () => {
        try {
            const response = await api.get<User>('/api/auth/me')
            handleLoginSuccess(response.data)
        } catch (error) {
            // Not logged in - show Login Window
            openWindow('login', 'Sign On', <LoginForm onLogin={() => checkAuth()} />, { isUnique: true, centered: true, noClose: true })
        }
    }

    const handleLoginSuccess = (userData: User) => {
        setUser(userData)
        closeWindow('login')

        // Connect to System WS
        systemWs.current = new WebSocketClient()
        systemWs.current.connect('system')
        systemWs.current.onMessage((msg: WebSocketMessage) => {
            if (msg.type === 'presence_sync' && msg.users) {
                setOnlineBuddies(msg.users)
            } else if (msg.type === 'presence' && msg.username && msg.status) {
                setOnlineBuddies(prev => {
                    if (msg.status === 'online') return [...new Set([...prev, msg.username!])]
                    return prev.filter(u => u !== msg.username)
                })
            }
        })

        // Open Default Apps
        setTimeout(() => {
            // Buddy List: Top Right, Credit Card Portrait Size (~240x380)
            const buddyWidth = 240
            const buddyHeight = 380
            const xPos = window.innerWidth - buddyWidth - 20

            openWindow('buddy-list', 'Buddy List',
                <BuddyList
                    onlineUsers={onlineBuddies}
                    currentUser={userData.username}
                    onChatClick={(username) => {
                        openWindow('chat', 'The Verandah', <ChatApp />)
                    }}
                />,
                { initialPosition: { x: xPos, y: 60 }, isUnique: true, width: buddyWidth, height: buddyHeight }
            )

            // Welcome Screen: Centered, passes navigation handler
            openWindow('welcome', 'Welcome',
                <WelcomeScreen
                    username={userData.username}
                    onClose={() => closeWindow('welcome')}
                    onNavigate={(appId) => {
                        closeWindow('welcome') // Hide welcome screen
                        // Find app component
                        const app = apps.find(a => a.id === appId)
                        if (app) {
                            openWindow(app.id, app.label, app.component, { icon: app.icon })
                        }
                    }}
                />,
                { centered: true, width: 600, height: 400 }
            )
        }, 500)
    }

    const openWindow = (id: string, title: string, component: React.ReactNode, options: any = {}) => {
        setWindows(prev => {
            const existing = prev.find(w => w.id === id)
            if (existing) {
                return prev.map(w => w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: topZIndex + 1 } : w)
            }

            // Determine position: 'centered' or explicit 'initialPosition' or random
            let pos = options.initialPosition || { x: 100 + (Math.random() * 50), y: 100 + (Math.random() * 50) }
            if (options.centered) {
                // Simple center approximation, ideally would use window ref dimensions
                // Assuming standard size if not provided
                pos = { x: window.innerWidth / 2 - (options.width || 600) / 2, y: window.innerHeight / 2 - (options.height || 400) / 2 }
            }

            return [...prev, {
                id,
                title,
                component,
                isOpen: true,
                isMinimized: false,
                zIndex: topZIndex + 1,
                icon: options.icon,
                initialPosition: pos, // Apply calculated position
                width: options.width,
                height: options.height,
            }]
        })
        setTopZIndex(prev => prev + 1)
    }

    const closeWindow = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w))
    }

    const minimizeWindow = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w))
    }

    const focusWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, zIndex: topZIndex + 1, isMinimized: false } // Also unminimize on focus
            }
            return w
        }))
        setTopZIndex(prev => prev + 1)
    }

    // Apps Configuration
    // Added Buddy List to apps so it has an icon
    const apps = [
        { id: 'chat', label: 'Verandah', icon: MessageCircle, color: 'bg-emerald-500', component: <ChatApp /> },
        {
            id: 'buddy-list',
            label: 'Buddies',
            icon: UserIcon,
            color: 'bg-indigo-500',
            component: <BuddyList onlineUsers={onlineBuddies} currentUser={user?.username || ''} onChatClick={(u) => openWindow('chat', 'The Verandah', <ChatApp />)} />
        },
        { id: 'weather', label: 'Weather', icon: CloudSun, color: 'bg-orange-400', component: <div className="p-4">Weather Widget Coming Soon...</div> },
        { id: 'news', label: 'Newsstand', icon: Newspaper, color: 'bg-blue-600', component: <div className="p-4">News Feed Coming Soon...</div> },
    ]

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-bahamian-turquoise via-blue-400 to-bahamian-green select-none font-sans">
            {/* Desktop UI: Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-white/10 backdrop-blur-xl border-b border-white/20 flex items-center justify-between px-6 z-50 text-white shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg tracking-tight">What You Sayin'</span>
                    <span className="text-white/50 text-sm hidden sm:inline-block">|</span>
                    <span className="text-white/80 text-sm font-medium hidden sm:inline-block">{currentTime}</span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Status Indicators / Profile could go here */}
                    {user && (
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                            <UserIcon size={14} className="text-white" />
                            <span className="text-xs font-semibold">{user.username}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* App Grid Container */}
            <div className={`pt-20 px-6 flex flex-wrap gap-8 items-start align-content-start h-[calc(100vh-60px)] w-full overflow-y-auto`}>
                {apps.map(app => {
                    // Check if app window is open (active or minimized)
                    const appWindow = windows.find(w => w.id === app.id)
                    const isActive = appWindow?.isOpen && !appWindow?.isMinimized

                    return (
                        <AppIcon
                            key={app.id}
                            icon={app.icon}
                            label={app.label}
                            color={app.color}
                            isActive={!!appWindow?.isOpen} // Show dot if open (even if minimized)
                            onClick={() => openWindow(app.id, app.label, app.component, { icon: app.icon })}
                        />
                    )
                })}
            </div>

            {/* Windows Layer */}
            {windows.map(w => (
                <Window
                    key={w.id}
                    id={w.id}
                    title={w.title}
                    isOpen={w.isOpen}
                    zIndex={w.zIndex}
                    onClose={() => closeWindow(w.id)}
                    onFocus={() => focusWindow(w.id)}
                    isMinimized={w.isMinimized}
                    initialPosition={{ x: 100, y: 100 }} // Randomize properly if needed
                    isMobile={isMobile}
                    // Pass minimize handler to allow minimizing to icon
                    onMinimize={() => minimizeWindow(w.id)}
                >
                    {w.component}
                </Window>
            ))}

            {/* No Taskbar - Windows minimize to icons */}
        </div>
    )
}
