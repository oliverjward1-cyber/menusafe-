import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { blockIfImpersonating } from '@/lib/dev/guard'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  const rid = profile?.restaurant_id
  if (!rid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { status, assignedTo, dueDate } = body

  const updates: Record<string, unknown> = {}
  if (status) {
    updates.status = status
    if (status === 'done') updates.completed_at = new Date().toISOString()
  }
  if (assignedTo !== undefined) updates.assigned_to = assignedTo
  if (dueDate !== undefined) updates.due_date = dueDate

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('corrective_actions')
    .update(updates)
    .eq('id', params.id)
    .eq('restaurant_id', rid)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, action: data })
}
