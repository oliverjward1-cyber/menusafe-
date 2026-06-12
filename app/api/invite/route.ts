import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const allowedRoles = ['manager', 'head_chef', 'chef', 'foh']
    const inviteRole = allowedRoles.includes(role) ? role : 'chef'

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, restaurant_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: only owners can send invites' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: restaurant } = await adminClient
      .from('restaurants')
      .select('name')
      .eq('id', profile.restaurant_id)
      .single()

    const restaurantName = restaurant?.name ?? 'HospoPilot'

    const { data: invite, error: insertError } = await adminClient
      .from('invites')
      .insert({ restaurant_id: profile.restaurant_id, email, role: inviteRole })
      .select('token')
      .single()

    if (insertError || !invite) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    const { token } = invite
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${token}`

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error: emailError } = await resend.emails.send({
      from: `${restaurantName} <support@hospopilot.co.uk>`,
      to: email,
      subject: `You've been invited to join ${restaurantName}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to join ${restaurantName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a3d2b;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">${restaurantName}</h1>
              <p style="margin:8px 0 0;color:#a7c4b5;font-size:13px;">Powered by HospoPilot</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;font-weight:600;">You've been invited to join the team</h2>
              <p style="margin:0 0 16px;color:#444444;font-size:16px;line-height:1.6;">
                <strong>${restaurantName}</strong> has invited you to join their team on HospoPilot — the platform that keeps kitchen teams aligned on compliance, allergen safety and menu knowledge.
              </p>
              <p style="margin:0 0 32px;color:#444444;font-size:16px;line-height:1.6;">
                Click the button below to set up your account and get started. This invite link expires in 7 days.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:6px;background-color:#1a3d2b;">
                    <a href="${inviteUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:6px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #eeeeee;background-color:#fafafa;">
              <p style="margin:0;color:#999999;font-size:13px;line-height:1.5;text-align:center;">
                If you weren't expecting this invite, you can safely ignore this email.<br />
                This link will expire in 7 days.
              </p>
              <p style="margin:12px 0 0;color:#bbbbbb;font-size:12px;text-align:center;">
                Having trouble with the button? <a href="${inviteUrl}" style="color:#1a3d2b;text-decoration:underline;">Copy this link</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })

    if (emailError) {
      console.error('Email error:', emailError)
      return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Invite route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
