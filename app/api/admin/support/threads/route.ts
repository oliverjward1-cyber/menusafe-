import { NextRequest, NextResponse } from 'next/server'
import { isGmailConnected, listThreads } from '@/lib/gmail'

function checkAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_auth')?.value
  const correct = process.env.ADMIN_PASSWORD
  return !!correct && cookie === correct
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connected = await isGmailConnected()
  if (!connected) {
    return NextResponse.json({ connected: false, threads: [] })
  }

  const threads = await listThreads(25)
  return NextResponse.json({ connected: true, threads })
}
