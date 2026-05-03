import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => createClientComponentClient()

export const createServerClient = () =>
  createServerComponentClient({ cookies })

export type Profile = {
  id: string
  email: string
  username: string
  avatar_url: string | null
  is_premium: boolean
  premium_until: string | null
  subscription_status: 'free' | 'active' | 'cancelled' | 'expired'
  streak_days: number
  total_xp: number
  last_activity_date: string | null
  created_at: string
}

export type Unit = {
  id: string
  category_id: string
  title: string
  description: string
  emoji: string
  color: string
  level: string
  is_premium: boolean
  sort_order: number
}

export type Category = {
  id: string
  title: string
  description: string
  emoji: string
  color: string
  is_premium: boolean
}

export type UserProgress = {
  id: string
  user_id: string
  unit_id: string
  score: number
  total: number
  xp_earned: number
  completed_at: string
}

export type LeaderboardEntry = {
  id: string
  username: string
  avatar_url: string | null
  total_xp: number
  streak_days: number
  units_completed: number
  total_sessions: number
  avg_score: number
  rank: number
}
