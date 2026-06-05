import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

  const { title, lastReviewedDate, reviewedBy, documentUrl, notes } = await request.json()
  if (!title || !lastReviewedDate || !reviewedBy) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabase.from('haccp_plans').insert({
    restaurant_id: profile.restaurant_id,
    title,
    last_reviewed_date: lastReviewedDate,
    reviewed_by: reviewedBy,
    document_url: documentUrl || null,
    notes: notes || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
