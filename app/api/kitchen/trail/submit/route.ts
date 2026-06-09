import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { restaurantId, submittedBy, notes } = await req.json()
  if (!restaurantId) return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]

  const { data: tasks } = await supabase
    .from('ops_task_logs')
    .select('status')
    .eq('restaurant_id', restaurantId)
    .eq('scheduled_date', today)

  const total = tasks?.length ?? 0
  const completed = tasks?.filter(t => t.status === 'done').length ?? 0
  const flagged = tasks?.filter(t => t.status === 'flagged').length ?? 0

  const { error } = await supabase
    .from('ops_trail_summaries')
    .upsert({
      restaurant_id: restaurantId,
      trail_date: today,
      submitted_by: submittedBy,
      total_tasks: total,
      completed_tasks: completed,
      flagged_tasks: flagged,
      notes: notes ?? null,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'restaurant_id,trail_date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, total, completed, flagged })
}
