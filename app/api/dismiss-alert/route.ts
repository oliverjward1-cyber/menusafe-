import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { alertId } = await req.json()
  const supabase = createClient()
  await supabase.from('allergen_alerts').update({ dismissed: true }).eq('id', alertId)
  return NextResponse.json({ ok: true })
}
