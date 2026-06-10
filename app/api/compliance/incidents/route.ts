import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { blockIfImpersonating } from '@/lib/dev/guard'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function POST(request: Request) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const body = await request.json()
  const { restaurantId, type, severity, title, description, affectedPerson, actionTaken, reportedBy, source, photoUrl } = body

  const adminSupabase = createAdminClient()

  // Staff portal requests have source: 'staff' — verify restaurantId exists instead of user auth
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

  const { data: incident, error } = await adminSupabase.from('incidents').insert({
    restaurant_id: restaurantId,
    type, severity, title, description,
    affected_person: affectedPerson || null,
    action_taken: actionTaken || null,
    reported_by: reportedBy,
    photo_url: photoUrl || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create corrective action for medium/high/critical incidents
  if (severity !== 'low') {
    try {
      const dueDays = severity === 'critical' ? 1 : severity === 'high' ? 3 : 7
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + dueDays)

      await adminSupabase.from('corrective_actions').insert({
        restaurant_id: restaurantId,
        title: `Investigate & resolve: ${title}`,
        description: `Auto-created from ${severity} incident. ${description ?? ''}`.trim(),
        due_date: dueDate.toISOString().split('T')[0],
        source_type: 'incident',
        source_id: incident.id,
        status: 'open',
      })
    } catch {
      // Non-blocking
    }
  }

  // Notify owner by email for medium/high/critical incidents
  if (severity !== 'low') {
    try {
      // Get restaurant name
      const { data: restaurant } = await adminSupabase
        .from('restaurants').select('name').eq('id', restaurantId).single()

      // Get owner email
      const { data: ownerProfile } = await adminSupabase
        .from('profiles').select('id').eq('restaurant_id', restaurantId).eq('role', 'owner').limit(1).maybeSingle()

      if (ownerProfile) {
        const { data: ownerAuth } = await adminSupabase.auth.admin.getUserById(ownerProfile.id)
        const ownerEmail = ownerAuth?.user?.email

        if (ownerEmail) {
          const severityEmoji = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : '🔔'
          const typeLabels: Record<string, string> = {
            allergen_reaction: 'Allergen reaction', injury: 'Injury', near_miss: 'Near miss',
            contamination: 'Contamination', pest: 'Pest sighting', equipment: 'Equipment failure', other: 'Incident',
          }

          await getResend().emails.send({
            from: 'mise <alerts@mise.kitchen>',
            to: ownerEmail,
            subject: `${severityEmoji} Incident reported at ${restaurant?.name ?? 'your restaurant'}`,
            html: `
              <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #991b1b; margin-bottom: 4px;">${severityEmoji} ${typeLabels[type] ?? 'Incident'} reported</h2>
                <p style="color: #555; font-size: 13px; margin-bottom: 16px;">${restaurant?.name ?? ''}</p>

                <div style="background: #fff7f7; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                  <p style="margin: 0 0 8px; font-weight: 600; color: #1a1a1a;">${title}</p>
                  <p style="margin: 0 0 8px; color: #555; font-size: 13px;">${description}</p>
                  ${affectedPerson ? `<p style="margin: 0 0 4px; font-size: 12px; color: #777;">Person affected: ${affectedPerson}</p>` : ''}
                  ${actionTaken ? `<p style="margin: 0; font-size: 12px; color: #166534;">Action taken: ${actionTaken}</p>` : ''}
                </div>

                <p style="color: #555; font-size: 13px; margin-bottom: 20px;">
                  Reported by <strong>${reportedBy}</strong> at ${new Date().toLocaleString('en-GB')}.
                  ${severity === 'critical' ? '<br/><strong style="color:#991b1b">This is a critical incident — please respond immediately.</strong>' : ''}
                </p>

                <a href="https://mise.kitchen/owner/incidents"
                   style="display: inline-block; background: #991b1b; color: white; padding: 12px 24px;
                          border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  View incident log →
                </a>
              </div>
            `,
          })

          // Mark as notified
          await adminSupabase.from('incidents').update({ notified_owner: true }).eq('id', incident.id)
        }
      }
    } catch {
      // Email failure is non-blocking
    }
  }

  return NextResponse.json({ ok: true, incident })
}
