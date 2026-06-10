import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { blockIfImpersonating } from '@/lib/dev/guard'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('ops_task_templates')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Wipe today's logs so trail regenerates
  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (profile?.restaurant_id) {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('ops_task_logs').delete()
      .eq('restaurant_id', profile.restaurant_id)
      .eq('scheduled_date', today)
  }

  return NextResponse.json({ template: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { error } = await supabase
    .from('ops_task_templates')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
