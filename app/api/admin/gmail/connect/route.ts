import { NextRequest, NextResponse } from 'next/server'
import { GMAIL_SCOPES } from '@/lib/gmail'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('admin_auth')?.value
  const correct = process.env.ADMIN_PASSWORD
  if (!correct || cookie !== correct) {
    return NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/gmail/callback`

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`)
}
