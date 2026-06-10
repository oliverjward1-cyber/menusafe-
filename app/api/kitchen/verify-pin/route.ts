import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { blockIfImpersonating } from '@/lib/dev/guard'

export async function POST(request: Request) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const { slug, pin } = await request.json()
  if (!slug || !pin) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, staff_pin')
    .eq('slug', slug)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!restaurant.staff_pin) return NextResponse.json({ error: 'No PIN set — ask your manager' }, { status: 403 })
  if (restaurant.staff_pin !== pin) return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 })

  return NextResponse.json({ ok: true, restaurantId: restaurant.id, restaurantName: restaurant.name })
}
