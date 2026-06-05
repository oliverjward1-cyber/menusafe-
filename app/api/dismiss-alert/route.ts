import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  const { alertId } = await req.json()

  // Scope update to the user's own restaurant — prevents dismissing other restaurants' alerts
  await supabase
    .from('allergen_alerts')
    .update({ dismissed: true })
    .eq('id', alertId)
    .eq('restaurant_id', profile?.restaurant_id ?? '')

  return NextResponse.json({ ok: true })
}
