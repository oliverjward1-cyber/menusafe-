import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { blockIfImpersonating } from '@/lib/dev/guard'

export async function POST(request: Request) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const body = await request.json()
  const { restaurantId, taskId, taskName, signedBy, source } = body

  const adminSupabase = createAdminClient()

  if (source === 'staff') {
    const { data: restaurant } = await adminSupabase.from('restaurants').select('id').eq('id', restaurantId).single()
    if (!restaurant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    if (profile?.restaurant_id !== restaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await adminSupabase.from('cleaning_logs').insert({
    restaurant_id: restaurantId,
    task_id: taskId,
    task_name: taskName,
    signed_by: signedBy,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
