import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import LandingPage from './_landing/LandingPage'

export const metadata = {
  title: 'mise — Allergen compliance & kitchen management for independent restaurants',
  description: 'Allergen matrix, recipe costing, staff training and QR menus. Built for UK independent kitchens.',
}

export default async function Home() {
  const rid = cookies().get('msafe_rid')?.value
  if (rid) redirect('/chef')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    redirect(profile?.role === 'owner' ? '/owner' : '/chef')
  }

  return <LandingPage />
}
