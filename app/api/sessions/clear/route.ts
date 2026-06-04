import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    await admin.from('user_sessions').delete().eq('user_id', user.id)

    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
  } catch (err) {
    console.error('[sessions/clear]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
