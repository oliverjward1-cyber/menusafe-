import { NextRequest, NextResponse } from 'next/server'
import { saveGmailTokens } from '@/lib/gmail'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('admin_auth')?.value
  const correct = process.env.ADMIN_PASSWORD
  if (!correct || cookie !== correct) {
    return NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL))
  }

  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  const redirectUrl = new URL('/admin', process.env.NEXT_PUBLIC_SITE_URL)

  if (error || !code) {
    redirectUrl.searchParams.set('error', error ?? 'missing_code')
    return NextResponse.redirect(redirectUrl)
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/gmail/callback`

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenRes.ok) {
    redirectUrl.searchParams.set('error', 'token_exchange_failed')
    return NextResponse.redirect(redirectUrl)
  }

  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    // Google only returns refresh_token on first consent — if missing, ask user to revoke and retry
    redirectUrl.searchParams.set('error', 'no_refresh_token')
    return NextResponse.redirect(redirectUrl)
  }

  // Get the connected email address
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const userInfo = userInfoRes.ok ? await userInfoRes.json() : {}

  await saveGmailTokens({
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    email: userInfo.email,
  })

  redirectUrl.searchParams.set('connected', '1')
  return NextResponse.redirect(redirectUrl)
}
