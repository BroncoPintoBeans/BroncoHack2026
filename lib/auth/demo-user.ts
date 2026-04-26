import { isSupabaseAvailable } from '../db/client'
import { getSupabaseClient } from '../db/client'

export const DEMO_USER_ID = process.env.DEMO_USER_ID ?? 'demo-user-00000000-0000-0000-0000-000000000000'

export async function getRequestUserId(request?: Request): Promise<string | null> {
  if (!isSupabaseAvailable()) {
    return DEMO_USER_ID
  }

  const authHeader = request?.headers.get('authorization')
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) {
    return null
  }

  const { data, error } = await getSupabaseClient().auth.getUser(token)
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
