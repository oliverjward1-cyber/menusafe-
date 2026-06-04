import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await authClient.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { updates } = await req.json()
  // updates: Array<{ recipeId: string, allergens: string[] }>

  if (!updates?.length) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createAdminClient()

  const results = await Promise.all(
    updates.map(({ recipeId, allergens }: { recipeId: string; allergens: string[] }) =>
      supabase
        .from('recipes')
        .update({ declared_allergens: allergens })
        .eq('id', recipeId)
    )
  )

  const failed = results.filter(r => r.error)
  if (failed.length > 0) {
    return NextResponse.json({ error: 'Some updates failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updated: updates.length })
}
