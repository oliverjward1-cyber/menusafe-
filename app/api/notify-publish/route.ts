import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { menuName, menuId, restaurantName } = await req.json()

  if (!process.env.RESEND_API_KEY) {
    // Silently skip if not configured — email is optional
    return NextResponse.json({ ok: true, skipped: true })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ ok: true, skipped: true })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yoursite.com'

  await resend.emails.send({
    from: 'mise <noreply@getmise.app>',
    to: user.email,
    subject: `Menu published: ${menuName} — ${restaurantName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #166534; margin-bottom: 8px;">Menu published ✓</h2>
        <p style="color: #374151; margin-bottom: 16px;">
          <strong>${menuName}</strong> is now live on your customer menu for ${restaurantName}.
        </p>
        <a href="${siteUrl}/chef/menus/${menuId}"
          style="display: inline-block; background: #166534; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          View menu →
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          If you did not publish this menu, log in and unpublish it immediately.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
