import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Called by Vercel Cron — checks all restaurants for missing temp logs and emails owners
// Cron schedule: "0 10 * * *" (10am) and "0 18 * * *" (6pm)

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const hour = now.getUTCHours() + 1 // BST offset (approximate)
  const checkType = hour >= 14 ? 'pm' : 'am' // PM check if running at 6pm cron
  const todayStr = now.toISOString().split('T')[0]

  // Get all restaurants with their owner email
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, slug')

  if (!restaurants?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const restaurant of restaurants) {
    // Check if this restaurant has a temp log for today of this check type
    const { data: todayLog } = await supabase
      .from('temperature_logs')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('check_type', checkType)
      .gte('logged_at', `${todayStr}T00:00:00Z`)
      .limit(1)
      .maybeSingle()

    if (todayLog) continue // Already done

    // Find owner email
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle()

    if (!ownerProfile) continue

    const { data: ownerAuth } = await supabase.auth.admin.getUserById(ownerProfile.id)
    const ownerEmail = ownerAuth?.user?.email
    if (!ownerEmail) continue

    const checkLabel = checkType === 'am' ? 'morning (AM)' : 'afternoon (PM)'
    const checkDeadline = checkType === 'am' ? '10:00 AM' : '6:00 PM'

    await getResend().emails.send({
      from: 'HospoPilot <support@hospopilot.co.uk>',
      to: ownerEmail,
      subject: `⚠️ ${restaurant.name} — temperature check overdue`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Temperature check overdue</h2>
          <p style="color: #555; margin-bottom: 16px;">
            Your <strong>${checkLabel} temperature check</strong> for <strong>${restaurant.name}</strong>
            hasn't been logged yet today (deadline: ${checkDeadline}).
          </p>
          <p style="color: #555; margin-bottom: 24px;">
            Regular temperature monitoring is required for food safety compliance. Please log your
            fridge, freezer, and hot-hold readings as soon as possible.
          </p>
          <a href="https://www.hospopilot.co.uk/owner/temperature-logs"
             style="display: inline-block; background: #2D6A4F; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Log temperature now →
          </a>
          <p style="color: #aaa; font-size: 12px; margin-top: 24px;">
            HospoPilot food safety · You're receiving this because you're an owner on HospoPilot.
          </p>
        </div>
      `,
    })

    sent++
  }

  return NextResponse.json({ sent, checkType, date: todayStr })
}
