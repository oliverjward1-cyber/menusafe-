import { NextRequest, NextResponse } from 'next/server'
import { getThread } from '@/lib/gmail'

function checkAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_auth')?.value
  const correct = process.env.ADMIN_PASSWORD
  return !!correct && cookie === correct
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const thread = await getThread(params.id)
    return NextResponse.json(thread)
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to load thread' }, { status: 500 })
  }
}
