import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()

  // RLS already scopes by restaurant, but we add restaurant_id filter for defence-in-depth
  const { error } = await supabase
    .from('incidents')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('restaurant_id', profile?.restaurant_id ?? '')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
