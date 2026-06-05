import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 })

  const supabase = createAdminClient()
  const todayStr = new Date().toISOString().split('T')[0]
  const now = new Date()

  const [tasksRes, logsRes] = await Promise.all([
    supabase.from('cleaning_tasks').select('*').eq('restaurant_id', restaurantId).eq('is_active', true).order('frequency').order('name'),
    supabase.from('cleaning_logs').select('task_id, completed_at').eq('restaurant_id', restaurantId).order('completed_at', { ascending: false }).limit(100),
  ])

  const tasks = tasksRes.data ?? []
  const logs = logsRes.data ?? []

  const lastSignOff: Record<string, string> = {}
  for (const log of logs) {
    if (log.task_id && !lastSignOff[log.task_id]) lastSignOff[log.task_id] = log.completed_at
  }

  const result = tasks.map(t => {
    const last = lastSignOff[t.id]
    let done = false
    if (last) {
      const lastDate = new Date(last)
      if (t.frequency === 'daily') done = lastDate.toISOString().split('T')[0] === todayStr
      else if (t.frequency === 'weekly') done = (now.getTime() - lastDate.getTime()) <= 7 * 24 * 60 * 60 * 1000
      else if (t.frequency === 'monthly') done = (now.getTime() - lastDate.getTime()) <= 30 * 24 * 60 * 60 * 1000
    }
    return { id: t.id, name: t.name, frequency: t.frequency, area: t.area, done }
  })

  return NextResponse.json({ tasks: result })
}
