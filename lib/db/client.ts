import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

if (typeof window !== 'undefined') {
  throw new Error('lib/db/client must only be imported on the server')
}

export function isSupabaseAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase is not configured')
  }

  return createServerSupabaseClient()
}
