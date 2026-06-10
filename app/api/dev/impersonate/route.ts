import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  DEV_RESTAURANT_COOKIE, DEV_ROLE_COOKIE, DEV_LOG_COOKIE, VALID_ROLES, type Role,
} from '@/lib/dev/context'

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

// Start or update an impersonation session.
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('id, restaurant_id, role, is_developer').eq('id', user.id).single()
  if (!profile?.is_developer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const restaurantId: string | null = body.restaurantId ?? null
  const role: string | null = body.role ?? null

  if (role && !VALID_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const cookieStore = cookies()
  const currentRestaurantId = cookieStore.get(DEV_RESTAURANT_COOKIE)?.value ?? profile.restaurant_id
  const currentRole = cookieStore.get(DEV_ROLE_COOKIE)?.value ?? profile.role

  const nextRestaurantId = restaurantId ?? currentRestaurantId
  const nextRole = role ?? currentRole

  // Set cookies for the new view
  if (nextRestaurantId && nextRestaurantId !== profile.restaurant_id) {
    cookieStore.set(DEV_RESTAURANT_COOKIE, nextRestaurantId, COOKIE_OPTS)
  } else {
    cookieStore.delete(DEV_RESTAURANT_COOKIE)
  }

  if (nextRole && nextRole !== profile.role) {
    cookieStore.set(DEV_ROLE_COOKIE, nextRole, COOKIE_OPTS)
  } else {
    cookieStore.delete(DEV_ROLE_COOKIE)
  }

  const isImpersonating =
    (nextRestaurantId && nextRestaurantId !== profile.restaurant_id) ||
    (nextRole && nextRole !== profile.role)

  // Close out any previous log entry
  const admin = createAdminClient()
  const existingLogId = cookieStore.get(DEV_LOG_COOKIE)?.value
  if (existingLogId) {
    await admin.from('dev_impersonation_logs').update({ ended_at: new Date().toISOString() }).eq('id', existingLogId)
    cookieStore.delete(DEV_LOG_COOKIE)
  }

  if (isImpersonating) {
    const { data: log } = await admin.from('dev_impersonation_logs').insert({
      developer_id: user.id,
      viewed_restaurant_id: nextRestaurantId,
      viewed_role: nextRole,
    }).select('id').single()

    if (log?.id) cookieStore.set(DEV_LOG_COOKIE, log.id, COOKIE_OPTS)
  }

  return NextResponse.json({ ok: true, restaurantId: nextRestaurantId, role: nextRole, isImpersonating: !!isImpersonating })
}

// Exit impersonation entirely.
export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_developer').eq('id', user.id).single()
  if (!profile?.is_developer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cookieStore = cookies()
  const admin = createAdminClient()
  const existingLogId = cookieStore.get(DEV_LOG_COOKIE)?.value
  if (existingLogId) {
    await admin.from('dev_impersonation_logs').update({ ended_at: new Date().toISOString() }).eq('id', existingLogId)
  }

  cookieStore.delete(DEV_RESTAURANT_COOKIE)
  cookieStore.delete(DEV_ROLE_COOKIE)
  cookieStore.delete(DEV_LOG_COOKIE)

  return NextResponse.json({ ok: true })
}
