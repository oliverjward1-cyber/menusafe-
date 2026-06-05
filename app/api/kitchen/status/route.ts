import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 })

  const supabase = createAdminClient()
  const todayStr = new Date().toISOString().split('T')[0]

  const [tempRes, cleaningTasksRes, cleaningLogsRes, incidentsRes] = await Promise.all([
    supabase.from('temperature_logs').select('check_type').eq('restaurant_id', restaurantId).gte('logged_at', `${todayStr}T00:00:00Z`),
    supabase.from('cleaning_tasks').select('id, frequency').eq('restaurant_id', restaurantId).eq('is_active', true),
    supabase.from('cleaning_logs').select('task_id, completed_at').eq('restaurant_id', restaurantId).order('completed_at', { ascending: false }).limit(100),
    supabase.from('incidents').select('id').eq('restaurant_id', restaurantId).eq('resolved', false),
  ])

  const todayLogs = tempRes.data ?? []
  const amDone = todayLogs.some(l => l.check_type === 'am')
  const pmDone = todayLogs.some(l => l.check_type === 'pm')

  // Count cleaning tasks that are due
  const tasks = cleaningTasksRes.data ?? []
  const logs = cleaningLogsRes.data ?? []
  const now = new Date()
  const lastSignOff: Record<string, string> = {}
  for (const log of logs) {
    if (log.task_id && !lastSignOff[log.task_id]) lastSignOff[log.task_id] = log.completed_at
  }
  const cleaningDue = tasks.filter(t => {
    const last = lastSignOff[t.id]
    if (!last) return true
    const lastDate = new Date(last)
    if (t.frequency === 'daily') return lastDate.toISOString().split('T')[0] < todayStr
    if (t.frequency === 'weekly') return (now.getTime() - lastDate.getTime()) > 7 * 24 * 60 * 60 * 1000
    if (t.frequency === 'monthly') return (now.getTime() - lastDate.getTime()) > 30 * 24 * 60 * 60 * 1000
    return false
  }).length

  return NextResponse.json({
    amDone,
    pmDone,
    cleaningDue,
    openIncidents: (incidentsRes.data ?? []).length,
  })
}
