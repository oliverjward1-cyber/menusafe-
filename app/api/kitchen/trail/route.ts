import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const restaurantId = searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 })
  const team = searchParams.get('team') ?? 'kitchen' // 'kitchen' | 'foh'

  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const todayDow = new Date().getDay() // 0=Sun

  // Always fetch templates so we can enrich logs with checklist_items
  const templatesQuery = supabase
    .from('ops_task_templates')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('sort_order')

  // Filter templates by team: foh sees foh+all, kitchen sees kitchen+all
  const { data: templates } = team === 'foh'
    ? await templatesQuery.in('target_team', ['foh', 'all'])
    : await templatesQuery.in('target_team', ['kitchen', 'all'])

  // Check if today's logs already exist for this team
  const existingQuery = supabase
    .from('ops_task_logs')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('scheduled_date', today)
    .order('sort_order')

  const { data: existing } = team === 'foh'
    ? await existingQuery.in('target_team', ['foh', 'all'])
    : await existingQuery.in('target_team', ['kitchen', 'all'])

  if (existing && existing.length > 0) {
    const enriched = existing.map(log => {
      const tmpl = (templates ?? []).find(t => t.id === log.template_id)
      return { ...log, checklist_items: tmpl?.checklist_items ?? null, description: tmpl?.description ?? null }
    })
    return NextResponse.json({ tasks: enriched })
  }

  if (!templates || templates.length === 0) {
    // For FOH team, auto-seed default templates if none exist
    if (team === 'foh') {
      const defaultFohTemplates = [
        {
          restaurant_id: restaurantId,
          title: 'Allergen menu check',
          task_type: 'checklist',
          schedule_type: 'daily',
          sort_order: 1,
          is_active: true,
          target_team: 'foh',
          checklist_items: [
            { id: 'a1', label: 'Printed allergen menus are up to date', required: true },
            { id: 'a2', label: 'Digital allergen information matches printed menu', required: true },
            { id: 'a3', label: 'Any specials have allergen info noted', required: true },
          ],
          description: 'Verify all allergen information is current and accurate before service.',
        },
        {
          restaurant_id: restaurantId,
          title: 'FOH allergen team briefing',
          task_type: 'checklist',
          schedule_type: 'daily',
          sort_order: 2,
          is_active: true,
          target_team: 'foh',
          checklist_items: [
            { id: 'b1', label: 'Staff briefed on today\'s specials and allergens', required: true },
            { id: 'b2', label: 'Any new allergen risks communicated to team', required: false },
          ],
          description: 'Brief all FOH staff on allergen information before service begins.',
        },
        {
          restaurant_id: restaurantId,
          title: 'Customer allergen info boards check',
          task_type: 'checklist',
          schedule_type: 'daily',
          sort_order: 3,
          is_active: true,
          target_team: 'foh',
          checklist_items: [
            { id: 'c1', label: 'Allergen information boards are visible and legible', required: true },
            { id: 'c2', label: '"Ask about allergens" signage in place', required: true },
          ],
        },
        {
          restaurant_id: restaurantId,
          title: 'Menu accuracy check',
          task_type: 'checklist',
          schedule_type: 'daily',
          sort_order: 4,
          is_active: true,
          target_team: 'foh',
          checklist_items: [
            { id: 'd1', label: 'All menu items available', required: false },
            { id: 'd2', label: '86 list communicated to team', required: false },
            { id: 'd3', label: 'Prices and descriptions accurate', required: false },
          ],
          description: 'Check menus are accurate and any unavailable items are communicated.',
        },
      ]
      const { data: seeded } = await supabase
        .from('ops_task_templates')
        .insert(defaultFohTemplates)
        .select()
      if (!seeded || seeded.length === 0) return NextResponse.json({ tasks: [] })
      // Now insert today's logs from the seeded templates
      const toInsertSeeded = seeded.map(t => ({
        restaurant_id: restaurantId,
        template_id: t.id,
        title: t.title,
        task_type: t.task_type,
        scheduled_date: today,
        sort_order: t.sort_order,
        status: 'pending',
        target_team: 'foh',
        checklist_items: t.checklist_items,
      }))
      const { data: insertedSeeded } = await supabase
        .from('ops_task_logs')
        .insert(toInsertSeeded)
        .select()
      const enrichedSeeded = (insertedSeeded ?? []).map(log => {
        const tmpl = seeded.find(t => t.id === log.template_id)
        return { ...log, checklist_items: tmpl?.checklist_items ?? null, description: tmpl?.description ?? null }
      })
      return NextResponse.json({ tasks: enrichedSeeded })
    }
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
      target_team: t.target_team ?? 'kitchen',
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
