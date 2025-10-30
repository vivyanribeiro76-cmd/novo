import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://aopbzryufcpsawaweico.supabase.co'
  const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcGJ6cnl1ZmNwc2F3YXdlaWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxODY1MTQsImV4cCI6MjA0NDc2MjUxNH0.IuHNrFjyv8qC4apc4_YJ7kNlKNJ2_tLmOagygTI5SoA'
  if (!supabaseUrl || !supabaseAnonKey) {
    if (import.meta.env.DEV) {
      console.warn('Supabase env vars missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    }
    return null
  }
  client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  return client
}
