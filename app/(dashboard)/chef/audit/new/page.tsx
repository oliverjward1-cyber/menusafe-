import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ClipboardCheck } from 'lucide-react'
import { AuditForm } from './AuditForm'
import { AUDIT_QUESTION_SETS, AUDIT_TYPE_LABELS, AUDIT_TYPE_DESCRIPTIONS, type AuditType } from '@/lib/constants/auditQuestions'

export default async function NewAuditPage({ searchParams }: { searchParams: { type?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    : { data: null }
  const restaurantId = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value
  if (!restaurantId) redirect('/onboarding')

  const auditType: AuditType = (searchParams.type && searchParams.type in AUDIT_QUESTION_SETS)
    ? searchParams.type as AuditType
    : 'general'

  let questions = AUDIT_QUESTION_SETS[auditType]

  if (auditType === 'general') {
    const { data: dbQuestions } = await supabase
      .from('audit_questions')
      .select('key, label, category, requires_photo_on_fail')
      .eq('restaurant_id', restaurantId)
      .order('position')

    if (dbQuestions && dbQuestions.length > 0) {
      questions = dbQuestions.map(q => ({ key: q.key, label: q.label, category: q.category, requiresPhotoOnFail: q.requires_photo_on_fail }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/chef/audit" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-700" />
            <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">{AUDIT_TYPE_LABELS[auditType]}</h1>
          </div>
          <p className="text-sm text-hospopilot-ink/50 mt-0.5">{AUDIT_TYPE_DESCRIPTIONS[auditType]}</p>
        </div>
      </div>

      <AuditForm restaurantId={restaurantId} questions={questions} auditType={auditType} />
    </div>
  )
}
