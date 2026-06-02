import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { name, slug, targetGp } = await req.json()

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  }

  const supabase = createClient()

  // Check slug not already taken
  const { data: existing } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug.trim())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'That URL is already taken — try a different one.' }, { status: 409 })
  }

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .insert({ name: name.trim(), slug: slug.trim(), target_gp: targetGp ?? 70 })
    .select('id, slug')
    .single()

  if (error || !restaurant) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create restaurant' }, { status: 500 })
  }

  const res = NextResponse.json({ id: restaurant.id, slug: restaurant.slug })
  res.cookies.set('msafe_rid', restaurant.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
  return res
}
