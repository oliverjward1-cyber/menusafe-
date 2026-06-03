import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
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
