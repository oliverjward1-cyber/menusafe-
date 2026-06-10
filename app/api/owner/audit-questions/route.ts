import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AUDIT_QUESTIONS } from '@/lib/constants/auditQuestions'
import { blockIfImpersonating } from '@/lib/dev/guard'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60)
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('audit_questions')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questions: data })
}

export async function POST(req: NextRequest) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createAdminClient()
  const body = await req.json()
  const { action, question, id } = body

  if (action === 'seed') {
    const { data: existing } = await adminClient
      .from('audit_questions')
      .select('id')
      .eq('restaurant_id', profile.restaurant_id)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Already seeded' })
    }

    const rows = AUDIT_QUESTIONS.map((q, i) => ({
      restaurant_id: profile.restaurant_id,
      key: q.key,
      label: q.label,
      category: q.category,
      requires_photo_on_fail: q.requiresPhotoOnFail ?? false,
      position: i,
    }))

    const { error } = await adminClient.from('audit_questions').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Seeded' })
  }

  if (action === 'add') {
    const { label, category, requiresPhotoOnFail } = question ?? {}
    if (!label || !category) {
      return NextResponse.json({ error: 'label and category required' }, { status: 400 })
    }

    const { data: last } = await adminClient
      .from('audit_questions')
      .select('position')
      .eq('restaurant_id', profile.restaurant_id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const position = last ? last.position + 1 : 0

    const { data, error } = await adminClient
      .from('audit_questions')
      .insert({
        restaurant_id: profile.restaurant_id,
        key: slugify(label) + '_' + Date.now(),
        label,
        category,
        requires_photo_on_fail: requiresPhotoOnFail ?? false,
        position,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ question: data })
  }

  if (action === 'edit') {
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { label, category, requiresPhotoOnFail, position } = question ?? {}

    const updates: Record<string, unknown> = {}
    if (label !== undefined) updates.label = label
    if (category !== undefined) updates.category = category
    if (requiresPhotoOnFail !== undefined) updates.requires_photo_on_fail = requiresPhotoOnFail
    if (position !== undefined) updates.position = position

    const { data, error } = await adminClient
      .from('audit_questions')
      .update(updates)
      .eq('id', id)
      .eq('restaurant_id', profile.restaurant_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ question: data })
  }

  if (action === 'delete') {
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await adminClient
      .from('audit_questions')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', profile.restaurant_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Deleted' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
