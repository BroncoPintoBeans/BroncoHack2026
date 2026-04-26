import { isSupabaseAvailable } from '../db/client'
import { createClient } from '@/lib/supabase/server'

export const DEMO_USER_ID = process.env.DEMO_USER_ID ?? 'demo-user-00000000-0000-0000-0000-000000000000'

export async function getRequestUserId(request?: Request): Promise<string | null> {
  void request

  if (!isSupabaseAvailable()) {
    return DEMO_USER_ID
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user.id
}

export function isDemoUserOwner(userId: string): boolean {
  return userId === DEMO_USER_ID
}

export async function isRequestUserOwner(request: Request | undefined, ownerUserId: string): Promise<boolean> {
  const requestUserId = await getRequestUserId(request)
  return requestUserId === ownerUserId
}
