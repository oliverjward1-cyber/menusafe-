import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { blockIfImpersonating } from '@/lib/dev/guard'

export async function POST(req: NextRequest) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const { restaurantId, completedBy, score, total, status, notes, answers, auditType } = await req.json()

  if (!restaurantId || !completedBy) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.restaurant_id !== restaurantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminSupabase = createAdminClient()

  const { data: audit, error: auditErr } = await adminSupabase
    .from('kitchen_audits')
    .insert({ restaurant_id: restaurantId, completed_by: completedBy, score, total, status, notes: notes || null, audit_type: auditType || 'general' })
    .select('id').single()

  if (auditErr || !audit) {
    return NextResponse.json({ error: auditErr?.message ?? 'Failed to create audit' }, { status: 500 })
  }

  if (answers?.length > 0) {
    const { error: answersErr } = await adminSupabase
      .from('kitchen_audit_answers')
      .insert(answers.map((a: any) => ({
        audit_id: audit.id,
        question_id: a.question_id,
        question_text: a.question_text,
        answer: a.answer,
        notes: a.notes ?? null,
      })))

    if (answersErr) {
      return NextResponse.json({ error: answersErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({ id: audit.id })
}
