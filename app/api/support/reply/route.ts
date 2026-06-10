import { NextRequest, NextResponse } from 'next/server'
import { getDevContext } from '@/lib/dev/context'
import { sendReply } from '@/lib/gmail'

export async function POST(req: NextRequest) {
  const devCtx = await getDevContext()
  if (!devCtx?.isDeveloper) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
