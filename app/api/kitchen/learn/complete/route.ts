import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { blockIfImpersonating } from '@/lib/dev/guard'

export async function POST(request: Request) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const body = await request.json()
  const { restaurantId, moduleSlug, score, staffName } = body
  if (!restaurantId || !moduleSlug || score === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify restaurant exists
  const { data: restaurant } = await supabase.from('restaurants').select('id').eq('id', restaurantId).single()
  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase.from('staff_module_completions').upsert({
    restaurant_id: restaurantId,
    staff_name: staffName ?? 'Unknown',
    module_slug: moduleSlug,
    score,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'restaurant_id,staff_name,module_slug', ignoreDuplicates: false })

  return NextResponse.json({ ok: true })
}
