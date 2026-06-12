import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const DEV_RESTAURANT_COOKIE = 'dev_view_restaurant_id'
export const DEV_ROLE_COOKIE = 'dev_view_role'
export const DEV_LOG_COOKIE = 'dev_impersonation_log_id'

export type Role = 'owner' | 'manager' | 'head_chef' | 'chef' | 'foh'
export const VALID_ROLES: Role[] = ['owner', 'manager', 'head_chef', 'chef', 'foh']

export type DevContext = {
  userId: string
  isDeveloper: boolean
  actualRole: Role
  actualRestaurantId: string | null
  restaurantId: string | null
  role: Role
  isImpersonating: boolean
}

/**
 * Resolves the effective role/restaurant for the current request, applying
 * developer impersonation overrides from cookies. is_developer is always
 * read from the database — cookies alone can never grant developer access.
 */
export async function getDevContext(): Promise<DevContext | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id, is_developer')
    .eq('id', user.id)
    .single()

  const actualRole: Role = VALID_ROLES.includes(profile?.role as Role) ? (profile!.role as Role) : 'chef'
  const actualRestaurantId: string | null = profile?.restaurant_id ?? null
  const isDeveloper = !!profile?.is_developer

  let restaurantId = actualRestaurantId
  let role = actualRole
  let isImpersonating = false

  if (isDeveloper) {
    const cookieStore = cookies()
    const viewRestaurantId = cookieStore.get(DEV_RESTAURANT_COOKIE)?.value
    const viewRole = cookieStore.get(DEV_ROLE_COOKIE)?.value as Role | undefined

    if (viewRestaurantId && viewRestaurantId !== actualRestaurantId) {
      restaurantId = viewRestaurantId
      isImpersonating = true
    }
    if (viewRole && VALID_ROLES.includes(viewRole) && viewRole !== actualRole) {
      role = viewRole
      isImpersonating = true
    }
  }

  return {
    userId: user.id,
    isDeveloper,
    actualRole,
    actualRestaurantId,
    restaurantId,
    role,
    isImpersonating,
  }
}
