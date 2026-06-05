import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleSlug, score } = await request.json()
  if (!moduleSlug || score === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Upsert — keep best score
  const { data: existing } = await supabase
    .from('allergen_module_completions')
    .select('score')
    .eq('user_id', user.id)
    .eq('module_slug', moduleSlug)
    .maybeSingle()

  if (existing && existing.score >= score) {
    return NextResponse.json({ ok: true, score: existing.score })
  }

  const { error } = await supabase.from('allergen_module_completions').upsert({
    user_id: user.id,
    module_slug: moduleSlug,
    score,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,module_slug' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, score })
}
