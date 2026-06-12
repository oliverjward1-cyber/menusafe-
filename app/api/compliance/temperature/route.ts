import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getStaffRestaurantId } from '@/lib/staff-session'
import { blockIfImpersonating } from '@/lib/dev/guard'

function isTemperatureBreach(checkType: string, temp: number): boolean {
  if (checkType === 'hot_holding') return temp < 60
  if (checkType === 'cooking') return temp < 70
  return false
}

export async function POST(request: Request) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const body = await request.json()
  const { restaurantId, location, temperature, checkType, recordedBy, notes, correctiveAction, source } = body

  const adminSupabase = createAdminClient()

  if (source === 'staff') {
    const staffRid = getStaffRestaurantId()
    if (!staffRid || staffRid !== restaurantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    if (profile?.restaurant_id !== restaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await adminSupabase.from('temperature_logs').insert({
    restaurant_id: restaurantId,
    location,
    temperature,
    check_type: checkType,
    recorded_by: recordedBy,
    notes: notes || null,
    corrective_action: correctiveAction || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create corrective action if temperature is out of safe range
  const isBreach = isTemperatureBreach(checkType, temperature)
  if (isBreach) {
    try {
      const due = new Date()
      due.setDate(due.getDate() + 1)
      await adminSupabase.from('corrective_actions').insert({
        restaurant_id: restaurantId,
        title: `Temperature breach — ${location}`,
        description: `${temperature}°C recorded at ${location} by ${recordedBy}. Investigate cause and take corrective action.${correctiveAction ? ` Initial action: ${correctiveAction}` : ''}`,
        due_date: due.toISOString().split('T')[0],
        source_type: 'temperature',
        status: 'open',
      })
    } catch {
      // Non-blocking
    }
  }

  return NextResponse.json({ ok: true })
}
