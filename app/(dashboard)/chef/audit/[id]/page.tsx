import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CheckCircle2, XCircle, MinusCircle, AlertTriangle, ClipboardCheck } from 'lucide-react'
import { AUDIT_QUESTIONS, AUDIT_CATEGORIES } from '@/lib/constants/auditQuestions'

interface Props { params: { id: string } }

export default async function AuditDetailPage({ params }: Props) {
  const supabase = createClient()

  const { data: audit } = await supabase
    .from('kitchen_audits')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!audit) notFound()

  const { data: answers } = await supabase
    .from('kitchen_audit_answers')
    .select('*')
    .eq('audit_id', params.id)

  const answerMap = new Map((answers ?? []).map(a => [a.question_key, a]))
  const pct = audit.total > 0 ? Math.round((audit.score / audit.total) * 100) : 100
  const fails = (answers ?? []).filter(a => a.answer === 'fail')

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/chef/audit" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> All audits
        </Link>
      </div>

      {/* Summary card */}
      <div className={`rounded-xl p-5 border ${
        audit.status === 'green' ? 'bg-green-50 border-green-200' :
        audit.status === 'amber' ? 'bg-amber-50 border-amber-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className={`h-5 w-5 ${audit.status === 'green' ? 'text-green-700' : audit.status === 'amber' ? 'text-amber-700' : 'text-red-600'}`} />
              <h1 className="text-xl font-bold text-gray-900">Kitchen Audit</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Completed by <strong>{audit.completed_by}</strong> on{' '}
              {new Date(audit.completed_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className={`text-right`}>
            <p className={`text-4xl font-black ${audit.status === 'green' ? 'text-green-700' : audit.status === 'amber' ? 'text-amber-700' : 'text-red-600'}`}>
              {pct}%
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{audit.score}/{audit.total} passed</p>
          </div>
        </div>
        {audit.status !== 'green' && (
          <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${audit.status === 'amber' ? 'text-amber-800' : 'text-red-700'}`}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {audit.status === 'amber' ? 'Advisory — some items need attention' : 'Action required — immediate attention needed'}
          </div>
        )}
        {audit.notes && <p className="mt-3 text-sm text-gray-600 bg-white/60 rounded-lg p-3">{audit.notes}</p>}
      </div>

      {/* Fails summary */}
      {fails.length > 0 && (
        <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-red-50 border-b border-red-100">
            <h2 className="text-sm font-semibold text-red-700">Failed items ({fails.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {fails.map(f => {
              const q = AUDIT_QUESTIONS.find(q => q.key === f.question_key)
              return (
                <div key={f.question_key} className="px-5 py-4">
                  <p className="text-sm font-medium text-gray-900">{q?.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{q?.category}</p>
                  {f.notes && <p className="text-sm text-red-600 mt-2 bg-red-50 rounded-lg px-3 py-2">{f.notes}</p>}
                  {f.photo_url && (
                    <a href={f.photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={f.photo_url} alt="evidence" className="mt-2 h-32 w-auto rounded-lg object-cover border border-gray-200 hover:opacity-90 transition-opacity" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Full answers by category */}
      {AUDIT_CATEGORIES.map(cat => {
        const questions = AUDIT_QUESTIONS.filter(q => q.category === cat)
        return (
          <div key={cat} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">{cat}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {questions.map(q => {
                const a = answerMap.get(q.key)
                return (
                  <div key={q.key} className={`px-5 py-3 flex items-start gap-3 ${a?.answer === 'fail' ? 'bg-red-50/30' : ''}`}>
                    <div className="shrink-0 mt-0.5">
                      {a?.answer === 'pass' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                       a?.answer === 'fail' ? <XCircle className="h-4 w-4 text-red-500" /> :
                       <MinusCircle className="h-4 w-4 text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{q.label}</p>
                      {a?.notes && <p className="text-xs text-gray-500 mt-1">{a.notes}</p>}
                      {a?.photo_url && (
                        <a href={a.photo_url} target="_blank" rel="noopener noreferrer">
                          <img src={a.photo_url} alt="evidence" className="mt-2 h-20 w-auto rounded-lg object-cover border border-gray-200" />
                        </a>
                      )}
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${
                      a?.answer === 'pass' ? 'text-green-600' :
                      a?.answer === 'fail' ? 'text-red-500' : 'text-gray-300'
                    }`}>
                      {a?.answer === 'na' ? 'N/A' : a?.answer ?? '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
