import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_developer').eq('id', user.id).single()
  if (!profile?.is_developer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: restaurants, error } = await supabase
    .from('restaurants').select('id, name, slug').order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ restaurants: restaurants ?? [] })
}
