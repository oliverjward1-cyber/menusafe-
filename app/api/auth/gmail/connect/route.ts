import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDevContext } from '@/lib/dev/context'
import { GMAIL_SCOPES } from '@/lib/gmail'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL))

  const devCtx = await getDevContext()
  if (!devCtx?.isDeveloper) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/gmail/callback`

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
