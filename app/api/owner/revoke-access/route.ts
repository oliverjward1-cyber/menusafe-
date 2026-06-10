import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { blockIfImpersonating } from '@/lib/dev/guard'

export async function POST(request: Request) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, restaurant_id').eq('id', user.id).single()

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { staffId } = await request.json()
  if (!staffId || staffId === user.id) {
    return NextResponse.json({ error: 'Cannot revoke your own access' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the staff member belongs to this restaurant
  const { data: target } = await admin
    .from('profiles')
    .select('id, restaurant_id')
    .eq('id', staffId)
    .single()

  if (!target || target.restaurant_id !== profile.restaurant_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Remove restaurant association from profile (keeps the user account but removes access)
  await admin.from('profiles').update({ restaurant_id: null }).eq('id', staffId)

  return NextResponse.json({ ok: true })
}
