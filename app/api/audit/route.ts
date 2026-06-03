import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { restaurantId, completedBy, score, total, status, notes, answers } = await req.json()

  if (!restaurantId || !completedBy) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: audit, error: auditErr } = await supabase
    .from('kitchen_audits')
    .insert({ restaurant_id: restaurantId, completed_by: completedBy, score, total, status, notes: notes || null })
    .select('id').single()

  if (auditErr || !audit) {
    return NextResponse.json({ error: auditErr?.message ?? 'Failed to create audit' }, { status: 500 })
  }

  if (answers?.length > 0) {
    const { error: answersErr } = await supabase
      .from('kitchen_audit_answers')
      .insert(answers.map((a: any) => ({ ...a, audit_id: audit.id })))

    if (answersErr) {
      return NextResponse.json({ error: answersErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({ id: audit.id })
}
