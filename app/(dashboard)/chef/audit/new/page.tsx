import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ClipboardCheck } from 'lucide-react'
import { AuditForm } from './AuditForm'
import { AUDIT_QUESTIONS } from '@/lib/constants/auditQuestions'

export default async function NewAuditPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    : { data: null }
  const restaurantId = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value
  if (!restaurantId) redirect('/onboarding')

  const { data: dbQuestions } = await supabase
    .from('audit_questions')
    .select('key, label, category, requires_photo_on_fail')
    .eq('restaurant_id', restaurantId)
    .order('position')

  const questions = dbQuestions && dbQuestions.length > 0
    ? dbQuestions.map(q => ({ key: q.key, label: q.label, category: q.category, requiresPhotoOnFail: q.requires_photo_on_fail }))
    : AUDIT_QUESTIONS

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/chef/audit" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-700" />
            <h1 className="text-2xl font-display font-semibold text-mise-ink">Weekly Kitchen Audit</h1>
          </div>
          <p className="text-sm text-mise-ink/50 mt-0.5">Complete all sections — add photos where required</p>
        </div>
      </div>

      <AuditForm restaurantId={restaurantId} questions={questions} />
    </div>
  )
}
