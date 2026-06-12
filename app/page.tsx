import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import HospoPilotLanding from '@/components/HospoPilotLanding'

export default async function Home() {
  // Check for bypass-mode restaurant cookie first
  const rid = cookies().get('msafe_rid')?.value

  if (rid) {
    redirect('/chef')
  }

  // Auth mode: check logged-in user
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    redirect(profile?.role === 'owner' ? '/owner' : '/chef')
  }

  // No cookie, no user — show the marketing landing page
  return <HospoPilotLanding />
}
