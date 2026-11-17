import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '')
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()

export const isSupabaseConfigured = Boolean(
  url === 'https://ijbumnxkcvmstfpbstnm.supabase.co' &&
  (key.startsWith('sb_publishable_') || key.startsWith('eyJ'))
)
export const supabase = isSupabaseConfigured ? createClient(url, key) : null
