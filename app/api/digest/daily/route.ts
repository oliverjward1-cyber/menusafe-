import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Vercel Cron — runs at 7:00 AM UTC daily
// Sends each owner a summary of yesterday's compliance activity

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

function scoreColor(pct: number) {
  if (pct >= 90) return '#16a34a'
  if (pct >= 70) return '#d97706'
  return '#dc2626'
}

function scoreEmoji(pct: number) {
  if (pct >= 90) return '✅'
  if (pct >= 70) return '⚠️'
  return '🚨'
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  // Yesterday in UTC
  const yesterday = new Date(now)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const dayLabel = yesterday.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, slug')

  if (!restaurants?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const restaurant of restaurants) {
    const rid = restaurant.id

    // Owner email
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('restaurant_id', rid)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle()

    if (!ownerProfile) continue

    const { data: ownerAuth } = await supabase.auth.admin.getUserById(ownerProfile.id)
    const ownerEmail = ownerAuth?.user?.email
    if (!ownerEmail) continue

    // Temperature logs yesterday
    const { data: tempLogs } = await supabase
      .from('temperature_logs')
      .select('check_type')
      .eq('restaurant_id', rid)
      .gte('logged_at', `${yesterdayStr}T00:00:00Z`)
      .lt('logged_at', `${yesterdayStr}T23:59:59Z`)

    const amDone = tempLogs?.some(l => l.check_type === 'am') ?? false
    const pmDone = tempLogs?.some(l => l.check_type === 'pm') ?? false

    // Cleaning sign-offs yesterday
    const { data: cleaningLogs } = await supabase
      .from('cleaning_logs')
      .select('id')
      .eq('restaurant_id', rid)
      .gte('completed_at', `${yesterdayStr}T00:00:00Z`)
      .lt('completed_at', `${yesterdayStr}T23:59:59Z`)

    const cleaningCount = cleaningLogs?.length ?? 0

    // Active daily cleaning tasks (to know how many were expected)
    const { data: dailyTasks } = await supabase
      .from('cleaning_tasks')
      .select('id')
      .eq('restaurant_id', rid)
      .eq('frequency', 'daily')
      .eq('is_active', true)

    const dailyTaskCount = dailyTasks?.length ?? 0

    // Incidents yesterday (unresolved or logged yesterday)
    const { data: incidents } = await supabase
      .from('incidents')
      .select('title, severity, resolved')
      .eq('restaurant_id', rid)
      .gte('occurred_at', `${yesterdayStr}T00:00:00Z`)
      .lt('occurred_at', `${yesterdayStr}T23:59:59Z`)

    const openIncidents = incidents?.filter(i => !i.resolved) ?? []
    const resolvedIncidents = incidents?.filter(i => i.resolved) ?? []

    // Deliveries yesterday
    const { data: deliveries } = await supabase
      .from('delivery_records')
      .select('condition, supplier')
      .eq('restaurant_id', rid)
      .gte('delivered_at', `${yesterdayStr}T00:00:00Z`)
      .lt('delivered_at', `${yesterdayStr}T23:59:59Z`)

    const rejectedDeliveries = deliveries?.filter(d => d.condition === 'rejected') ?? []

    // Compliance score (simple weighted calc)
    let score = 0
    let maxScore = 0

    maxScore += 2
    if (amDone) score += 1
    if (pmDone) score += 1

    if (dailyTaskCount > 0) {
      maxScore += 1
      if (cleaningCount >= dailyTaskCount) score += 1
    }

    if (openIncidents.length === 0) {
      maxScore += 1
      score += 1
    } else {
      maxScore += 1
    }

    const scorePct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100
    const color = scoreColor(scorePct)
    const emoji = scoreEmoji(scorePct)

    // Build issues list
    const issues: string[] = []
    if (!amDone) issues.push('AM temperature check not logged')
    if (!pmDone) issues.push('PM temperature check not logged')
    if (dailyTaskCount > 0 && cleaningCount < dailyTaskCount)
      issues.push(`${dailyTaskCount - cleaningCount} daily cleaning task${dailyTaskCount - cleaningCount > 1 ? 's' : ''} not signed off`)
    if (openIncidents.length > 0)
      issues.push(`${openIncidents.length} unresolved incident${openIncidents.length > 1 ? 's' : ''}`)
    if (rejectedDeliveries.length > 0)
      issues.push(`${rejectedDeliveries.length} delivery rejection${rejectedDeliveries.length > 1 ? 's' : ''}`)

    const issuesHtml = issues.length > 0
      ? `<ul style="margin: 0; padding-left: 20px; color: #dc2626;">
          ${issues.map(i => `<li style="margin-bottom: 6px;">${i}</li>`).join('')}
         </ul>`
      : `<p style="color: #16a34a; margin: 0;">All compliance tasks completed — great work.</p>`

    // What's due today
    const dueTodayItems: string[] = []
    if (!amDone) dueTodayItems.push('AM temperature check (by 10am)')
    dueTodayItems.push('PM temperature check (by 6pm)')
    if (dailyTaskCount > 0) dueTodayItems.push(`${dailyTaskCount} daily cleaning task${dailyTaskCount > 1 ? 's' : ''}`)

    const dueTodayHtml = dueTodayItems
      .map(d => `<li style="margin-bottom: 6px; color: #374151;">${d}</li>`)
      .join('')

    const incidentsHtml = openIncidents.length > 0
      ? `<div style="margin-top: 16px; padding: 12px 16px; background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 4px;">
          <strong style="color: #dc2626;">Open incidents</strong>
          <ul style="margin: 8px 0 0; padding-left: 16px;">
            ${openIncidents.map(i => `<li style="color: #374151; font-size: 14px;">${i.title} <span style="color: #9ca3af;">(${i.severity})</span></li>`).join('')}
          </ul>
         </div>`
      : ''

    await getResend().emails.send({
      from: 'mise <digest@mise.kitchen>',
      to: ownerEmail,
      subject: `${emoji} ${restaurant.name} — ${dayLabel} compliance digest`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a1a;">

          <div style="display: flex; align-items: center; margin-bottom: 24px;">
            <span style="font-size: 22px; font-weight: 700; color: #1a1a1a;">mise</span>
            <span style="margin-left: 8px; font-size: 14px; color: #6b7280;">daily digest</span>
          </div>

          <h2 style="margin: 0 0 4px; font-size: 18px;">${restaurant.name}</h2>
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">${dayLabel}</p>

          <!-- Score -->
          <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <div style="font-size: 48px; font-weight: 800; color: ${color};">${scorePct}%</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">compliance score</div>
          </div>

          <!-- Yesterday summary -->
          <h3 style="font-size: 15px; margin: 0 0 10px; color: #374151;">Yesterday</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px;">🌡️ AM temp check</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-size: 14px; font-weight: 600; color: ${amDone ? '#16a34a' : '#dc2626'};">${amDone ? 'Done' : 'Missed'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px;">🌡️ PM temp check</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-size: 14px; font-weight: 600; color: ${pmDone ? '#16a34a' : '#dc2626'};">${pmDone ? 'Done' : 'Missed'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px;">🧹 Cleaning tasks</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-size: 14px; font-weight: 600; color: ${cleaningCount >= dailyTaskCount && dailyTaskCount > 0 ? '#16a34a' : '#d97706'};">${cleaningCount}${dailyTaskCount > 0 ? ` / ${dailyTaskCount}` : ''} done</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px;">🚚 Deliveries</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-size: 14px; font-weight: 600; color: ${rejectedDeliveries.length > 0 ? '#dc2626' : '#16a34a'};">${deliveries?.length ?? 0} received${rejectedDeliveries.length > 0 ? `, ${rejectedDeliveries.length} rejected` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #374151; font-size: 14px;">⚠️ Incidents</td>
              <td style="padding: 8px 0; text-align: right; font-size: 14px; font-weight: 600; color: ${openIncidents.length > 0 ? '#dc2626' : '#16a34a'};">${openIncidents.length} open${resolvedIncidents.length > 0 ? `, ${resolvedIncidents.length} resolved` : ''}</td>
            </tr>
          </table>

          ${incidentsHtml}

          <!-- Issues -->
          ${issues.length > 0 ? `
          <div style="margin: 20px 0; padding: 14px 16px; background: #fef9c3; border-left: 3px solid #d97706; border-radius: 4px;">
            <strong style="font-size: 14px; color: #92400e; display: block; margin-bottom: 8px;">Action needed</strong>
            ${issuesHtml}
          </div>` : `
          <div style="margin: 20px 0; padding: 14px 16px; background: #f0fdf4; border-left: 3px solid #16a34a; border-radius: 4px;">
            ${issuesHtml}
          </div>`}

          <!-- Due today -->
          <h3 style="font-size: 15px; margin: 20px 0 10px; color: #374151;">Due today</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${dueTodayHtml}
          </ul>

          <!-- CTA -->
          <div style="margin-top: 28px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mise.kitchen'}/owner"
               style="display: inline-block; background: #2D6A4F; color: white; padding: 12px 28px;
                      border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Open mise dashboard →
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 12px; margin-top: 28px; text-align: center;">
            mise food safety · Daily digest · <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mise.kitchen'}/owner/settings" style="color: #9ca3af;">Manage notifications</a>
          </p>
        </div>
      `,
    })

    sent++
  }

  return NextResponse.json({ sent, date: yesterdayStr })
}
