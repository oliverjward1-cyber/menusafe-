import { NextRequest, NextResponse } from 'next/server'
import { sendReply } from '@/lib/gmail'

function checkAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_auth')?.value
  const correct = process.env.ADMIN_PASSWORD
  return !!correct && cookie === correct
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { threadId, to, subject, body } = await req.json()
  if (!threadId || !to || !body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    await sendReply(threadId, to, subject ?? '', body)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to send reply' }, { status: 500 })
  }
}
