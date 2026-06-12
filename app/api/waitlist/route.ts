import { NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let body: { email?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''

  // Basic server-side validation — never trust the client.
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 })
  }

  // TODO: wire up the email provider / storage here.
  // e.g. add to a waitlist table, or send to Resend / Mailchimp / a sheet via Zapier.
  // For now this is a stub that simply acknowledges the submission.
  console.log('[waitlist] new signup:', email)

  return NextResponse.json({ ok: true })
}
