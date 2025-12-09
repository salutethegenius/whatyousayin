'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { setToken } from '@/lib/auth'
import type { RegisterRequest, LoginRequest, Token } from '@/shared/types'

interface LoginFormProps {
  onLogin: () => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isRegistering) {
        const registerData: RegisterRequest = {
          username: formData.username,
          email: formData.email || undefined,
          password: formData.password
        }
        await api.post('/api/auth/register', registerData)
      }

      const loginData: LoginRequest = {
        username: formData.username,
        password: formData.password
      }

      const response = await api.post<Token>('/api/auth/token',
        new URLSearchParams({
          username: loginData.username,
          password: loginData.password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      )

      setToken(response.data.access_token)
      onLogin()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-4 bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full"
      >
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          What You Sayin'?
        </h1>
        <p className="text-center text-gray-600 mb-6 text-sm">
          Join the Bahamian chat community
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
              required
              disabled={isLoading}
            />
          </div>

          {isRegistering && (
            <div>
              <input
                type="email"
                placeholder="Email (optional)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-bahamian-turquoise text-white py-3 rounded-md hover:bg-opacity-90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : (isRegistering ? 'Register' : 'Login')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering)
              setError(null)
            }}
            className="text-bahamian-turquoise hover:underline text-sm"
            disabled={isLoading}
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

