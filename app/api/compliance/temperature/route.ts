import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { blockIfImpersonating } from '@/lib/dev/guard'

function isTemperatureBreach(location: string, temp: number): boolean {
  const loc = location.toLowerCase()
  if (loc.includes('freezer')) return temp > -15
  if (loc.includes('hot') || loc.includes('hold')) return temp < 60
  // Default fridge/chilled
  return temp > 8
}

export async function POST(request: Request) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const body = await request.json()
  const { restaurantId, location, temperature, checkType, recordedBy, notes, correctiveAction, source } = body

  const adminSupabase = createAdminClient()

  if (source === 'staff') {
    const { data: restaurant } = await adminSupabase.from('restaurants').select('id').eq('id', restaurantId).single()
    if (!restaurant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
  const isBreach = isTemperatureBreach(location, temperature)
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
