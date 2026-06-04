import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuizQuestionsManager from './QuizQuestionsManager'

export default async function QuizQuestionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') redirect('/login')

  return <QuizQuestionsManager restaurantId={profile.restaurant_id} />
}
