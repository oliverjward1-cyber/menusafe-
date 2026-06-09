import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const body = await req.json()
  const { status, completed_by, data, notes, flag_reason } = body

  const { error } = await supabase
    .from('ops_task_logs')
    .update({
      status,
      completed_by,
      data: data ?? null,
      notes: notes ?? null,
      flag_reason: flag_reason ?? null,
      completed_at: status === 'done' || status === 'flagged' ? new Date().toISOString() : null,
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
