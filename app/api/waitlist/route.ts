import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { name, email, restaurant } = await req.json()

  if (!name || !email || !restaurant) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.from('waitlist').insert({
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200).toLowerCase(),
    restaurant_name: String(restaurant).slice(0, 200),
  })

  if (error) {
    // Duplicate email — treat as success so we don't leak info
    if (error.code === '23505') return NextResponse.json({ ok: true })
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
