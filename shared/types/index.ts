export interface User {
  id: number
  username: string
  email?: string
  avatar_url?: string
  is_active: boolean
  is_admin: boolean
  created_at: string
  updated_at?: string
}

export interface Room {
  id: number
  name: string
  description?: string
  is_public: boolean
  created_by: number
  created_at: string
  creator?: User
}

export interface Message {
  id: number
  content: string
  room_id: number
  user_id: number
  reply_to_id?: number
  created_at: string
  user?: User
  room?: Room
  reply_to?: Message
}

export interface Token {
  access_token: string
  token_type: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email?: string
  password: string
}

export interface RoomCreate {
  name: string
  description?: string
  is_public?: boolean
}

export interface MessageCreate {
  content: string
  reply_to_id?: number
}

