import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { restaurantId, dishes } = await req.json()

  if (!restaurantId || !dishes?.length) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.restaurant_id !== restaurantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminSupabase = createAdminClient()

  const rows = dishes.map((d: { name: string; category: string; price: number | null; description: string | null }) => ({
    restaurant_id: restaurantId,
    name: d.name,
    category: d.category || null,
    sell_price: d.price || null,
    description: d.description || null,
    status: 'draft',
    method: null,
  }))

  const { data, error } = await adminSupabase.from('recipes').insert(rows).select('id, name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: rows.length, recipes: data })
}
