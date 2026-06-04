import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { restaurantId, supplier, items, temperature, tempAcceptable, condition, batchCodes, receivedBy, notes } = body

  const { error } = await supabase.from('delivery_records').insert({
    restaurant_id: restaurantId,
    supplier,
    items,
    temperature: temperature ?? null,
    temp_acceptable: tempAcceptable ?? null,
    condition,
    batch_codes: batchCodes ?? null,
    received_by: receivedBy,
    notes: notes ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
