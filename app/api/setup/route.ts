import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { name, slug, targetGp, hearAbout, utmSource, utmMedium, utmCampaign, referralCode } = await req.json()

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check slug not already taken
  const { data: existing } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug.trim())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'That URL is already taken — try a different one.' }, { status: 409 })
  }

  const adminClient = createAdminClient()
  const { data: restaurant, error } = await adminClient
    .from('restaurants')
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      target_gp: targetGp ?? 70,
      acquisition_source: hearAbout || utmSource || null,
      acquisition_medium: utmMedium || null,
      acquisition_campaign: utmCampaign || null,
      referred_by: referralCode || null,
      referral_code: require('crypto').randomBytes(4).toString('hex').toUpperCase(),
      plan: 'multi',
    })
    .select('id, slug')
    .single()

  if (error || !restaurant) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create restaurant' }, { status: 500 })
  }

  const res = NextResponse.json({ id: restaurant.id, slug: restaurant.slug })
  res.cookies.set('msafe_rid', restaurant.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  })
  return res
}
