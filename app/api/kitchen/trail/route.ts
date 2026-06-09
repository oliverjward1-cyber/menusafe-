import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const restaurantId = searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 })

  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const todayDow = new Date().getDay() // 0=Sun

  // Check if today's logs already exist
  const { data: existing } = await supabase
    .from('ops_task_logs')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('scheduled_date', today)
    .order('sort_order')

  if (existing && existing.length > 0) {
    return NextResponse.json({ tasks: existing })
  }

  // Generate today's task instances from active templates
  const { data: templates } = await supabase
    .from('ops_task_templates')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('sort_order')

  if (!templates || templates.length === 0) {
    return NextResponse.json({ tasks: [] })
  }

  const toInsert = templates
    .filter(t => {
      if (t.schedule_type === 'daily') return true
      if (t.schedule_type === 'weekly') return t.schedule_days?.includes(todayDow)
      return false
    })
    .map(t => ({
      restaurant_id: restaurantId,
      template_id: t.id,
      title: t.title,
      task_type: t.task_type,
      scheduled_date: today,
      scheduled_time: t.scheduled_time,
      sort_order: t.sort_order,
      status: 'pending',
    }))

  if (toInsert.length === 0) return NextResponse.json({ tasks: [] })

  const { data: inserted, error } = await supabase
    .from('ops_task_logs')
    .insert(toInsert)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach checklist_items from templates
  const enriched = (inserted ?? []).map(log => {
    const tmpl = templates.find(t => t.id === log.template_id)
    return { ...log, checklist_items: tmpl?.checklist_items ?? null, description: tmpl?.description ?? null }
  })

  return NextResponse.json({ tasks: enriched })
}
