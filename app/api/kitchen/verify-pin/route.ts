import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { signStaffToken, staffCookieOptions } from '@/lib/staff-session'
import { blockIfImpersonating } from '@/lib/dev/guard'

// In-memory rate limiter: max 10 attempts per slug per 15 min window
const attempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(slug: string): boolean {
  const now = Date.now()
  const entry = attempts.get(slug)
  if (!entry || entry.resetAt < now) {
    attempts.set(slug, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return false
  }
  if (entry.count >= 10) return true
  entry.count++
  return false
}

export async function POST(request: Request) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const { slug, pin } = await request.json()
  if (!slug || !pin) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  if (isRateLimited(slug)) {
    return NextResponse.json({ error: 'Too many attempts — try again in 15 minutes' }, { status: 429 })
  }

  const supabase = createAdminClient()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, staff_pin')
    .eq('slug', slug)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!restaurant.staff_pin) return NextResponse.json({ error: 'No PIN set — ask your manager' }, { status: 403 })
  if (restaurant.staff_pin !== pin) return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 })

  const token = signStaffToken(restaurant.id)
  const res = NextResponse.json({ ok: true, restaurantId: restaurant.id, restaurantName: restaurant.name })
  res.cookies.set(staffCookieOptions(token))
  return res
}
