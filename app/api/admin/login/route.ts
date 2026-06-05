import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function adminToken(password: string): string {
  return createHmac('sha256', 'mise-admin-v1').update(password).digest('hex')
}

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const correct = process.env.ADMIN_PASSWORD
  if (!correct || password !== correct) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_auth', adminToken(correct), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
  return res
}
