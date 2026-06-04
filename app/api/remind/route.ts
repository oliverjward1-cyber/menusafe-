import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const { staffName, staffEmail, restaurantName, quizUrl } = await req.json()

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'owner')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!staffEmail || !staffName)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'mise <noreply@mise.app>',
    to: staffEmail,
    subject: `${restaurantName} — Your allergen training is due for renewal`,
    html: buildReminderEmail(staffName, restaurantName, quizUrl),
  })

  return NextResponse.json({ ok: true })
}

function buildReminderEmail(
  staffName: string,
  restaurantName: string,
  quizUrl: string
): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,sans-serif;">
  <table width="100%" style="padding:40px 0;background:#f4f4f4;"><tr><td align="center">
  <table width="600" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <tr><td style="background:#1a3d2b;padding:32px 40px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">mise</h1></td></tr>
    <tr><td style="padding:40px 40px 32px;">
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;">Hi ${staffName},</h2>
      <p style="margin:0 0 16px;color:#444;font-size:16px;line-height:1.6;">Your allergen training certificate at <strong>${restaurantName}</strong> is due for renewal. UK food safety regulations require staff allergen training to be kept up to date.</p>
      <p style="margin:0 0 32px;color:#444;font-size:16px;line-height:1.6;">Please complete the short quiz below to renew your certificate. It takes about 5 minutes.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="border-radius:6px;background:#1a3d2b;">
        <a href="${quizUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:16px;font-weight:600;text-decoration:none;">Retake the quiz</a>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:24px 40px;border-top:1px solid #eee;background:#fafafa;">
      <p style="margin:0;color:#999;font-size:13px;text-align:center;">This reminder was sent by your employer via mise. If you have questions, speak to your manager.</p>
    </td></tr>
  </table></td></tr></table></body></html>`
}
