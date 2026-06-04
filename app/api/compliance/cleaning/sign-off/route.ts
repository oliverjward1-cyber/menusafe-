import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { restaurantId, taskId, taskName, signedBy } = await request.json()

  const { error } = await supabase.from('cleaning_logs').insert({
    restaurant_id: restaurantId,
    task_id: taskId,
    task_name: taskName,
    signed_by: signedBy,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
