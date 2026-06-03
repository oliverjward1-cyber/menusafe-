'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AUDIT_QUESTIONS, AUDIT_CATEGORIES } from '@/lib/constants/auditQuestions'
import { CheckCircle2, XCircle, MinusCircle, Camera, Loader2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

type Answer = 'pass' | 'fail' | 'na' | null
interface AnswerState {
  answer: Answer
  notes: string
  photoFile: File | null
  photoPreview: string | null
  uploading: boolean
}

const DEFAULT_STATE: AnswerState = { answer: null, notes: '', photoFile: null, photoPreview: null, uploading: false }

export function AuditForm({ restaurantId }: { restaurantId: string }) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [staffName, setStaffName] = useState('')
  const [overallNotes, setOverallNotes] = useState('')
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(
    Object.fromEntries(AUDIT_QUESTIONS.map(q => [q.key, { ...DEFAULT_STATE }]))
  )
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function setAnswer(key: string, field: keyof AnswerState, value: unknown) {
    setAnswers(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  function toggleCategory(cat: string) {
    setCollapsed(prev => {
      const n = new Set(prev)
      n.has(cat) ? n.delete(cat) : n.add(cat)
      return n
    })
  }

  function handlePhoto(key: string, file: File | null) {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setAnswers(prev => ({ ...prev, [key]: { ...prev[key], photoFile: file, photoPreview: preview } }))
  }

  const answered = AUDIT_QUESTIONS.filter(q => answers[q.key].answer !== null).length
  const total = AUDIT_QUESTIONS.length
  const fails = AUDIT_QUESTIONS.filter(q => answers[q.key].answer === 'fail').length

  async function handleSubmit() {
    if (!staffName.trim()) { setError('Please enter your name before submitting'); return }
    const unanswered = AUDIT_QUESTIONS.filter(q => answers[q.key].answer === null)
    if (unanswered.length > 0) { setError(`${unanswered.length} question${unanswered.length !== 1 ? 's' : ''} not answered yet`); return }

    setSubmitting(true)
    setError('')

    // Calculate score
    const applicable = AUDIT_QUESTIONS.filter(q => answers[q.key].answer !== 'na')
    const passed = applicable.filter(q => answers[q.key].answer === 'pass').length
    const scoreTotal = applicable.length
    const pct = scoreTotal > 0 ? (passed / scoreTotal) * 100 : 100
    const status = pct >= 90 ? 'green' : pct >= 70 ? 'amber' : 'red'

    // Upload photos first
    const photoUrls: Record<string, string> = {}
    for (const q of AUDIT_QUESTIONS) {
      const a = answers[q.key]
      if (a.photoFile) {
        const ext = a.photoFile.name.split('.').pop() ?? 'jpg'
        const path = `${restaurantId}/${Date.now()}/${q.key}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('audit-photos')
          .upload(path, a.photoFile, { upsert: true })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('audit-photos').getPublicUrl(path)
          photoUrls[q.key] = urlData.publicUrl
        }
      }
    }

    const answerRows = AUDIT_QUESTIONS.map(q => ({
      question_key: q.key,
      answer: answers[q.key].answer,
      notes: answers[q.key].notes.trim() || null,
      photo_url: photoUrls[q.key] ?? null,
    }))

    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        completedBy: staffName.trim(),
        score: passed,
        total: scoreTotal,
        status,
        notes: overallNotes.trim() || null,
        answers: answerRows,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to save audit. Please try again.'); setSubmitting(false); return }

    router.push(`/chef/audit/${data.id}`)
  }

  return (
    <div className="space-y-5">
      {/* Staff name */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Your name</label>
        <input
          value={staffName}
          onChange={e => setStaffName(e.target.value)}
          placeholder="e.g. James Smith"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">{answered} of {total} answered</span>
          {fails > 0 && (
            <span className="text-xs font-medium text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> {fails} fail{fails !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all bg-green-600"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions by category */}
      {AUDIT_CATEGORIES.map(cat => {
        const questions = AUDIT_QUESTIONS.filter(q => q.category === cat)
        const catAnswered = questions.filter(q => answers[q.key].answer !== null).length
        const catFails = questions.filter(q => answers[q.key].answer === 'fail').length
        const isCollapsed = collapsed.has(cat)

        return (
          <div key={cat} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-900">{cat}</h2>
                {catFails > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">{catFails} fail{catFails !== 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{catAnswered}/{questions.length}</span>
                {isCollapsed ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronUp className="h-4 w-4 text-gray-400" />}
              </div>
            </button>

            {!isCollapsed && (
              <div className="divide-y divide-gray-50 border-t border-gray-100">
                {questions.map(q => {
                  const a = answers[q.key]
                  return (
                    <div key={q.key} className={`px-5 py-4 transition-colors ${a.answer === 'fail' ? 'bg-red-50/40' : a.answer === 'pass' ? 'bg-green-50/20' : ''}`}>
                      <p className="text-sm font-medium text-gray-900 mb-3">{q.label}</p>

                      {/* Answer buttons */}
                      <div className="flex gap-2 mb-3">
                        {(['pass', 'fail', 'na'] as const).map(opt => (
                          <button
                            key={opt}
                            onClick={() => setAnswer(q.key, 'answer', opt)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              a.answer === opt
                                ? opt === 'pass' ? 'bg-green-600 border-green-600 text-white'
                                  : opt === 'fail' ? 'bg-red-600 border-red-600 text-white'
                                  : 'bg-gray-500 border-gray-500 text-white'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                            }`}
                          >
                            {opt === 'pass' ? <CheckCircle2 className="h-3.5 w-3.5" /> : opt === 'fail' ? <XCircle className="h-3.5 w-3.5" /> : <MinusCircle className="h-3.5 w-3.5" />}
                            {opt === 'na' ? 'N/A' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Notes + photo on fail, optional on pass */}
                      {a.answer !== null && a.answer !== 'na' && (
                        <div className="space-y-2">
                          {a.answer === 'fail' && (
                            <input
                              value={a.notes}
                              onChange={e => setAnswer(q.key, 'notes', e.target.value)}
                              placeholder="Describe the issue…"
                              className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white"
                            />
                          )}
                          <div className="flex items-center gap-3">
                            <label className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer px-3 py-1.5 rounded-lg border transition-colors ${
                              a.answer === 'fail'
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}>
                              <Camera className="h-3.5 w-3.5" />
                              {a.photoPreview ? 'Change photo' : a.answer === 'fail' ? 'Attach photo (recommended)' : 'Add photo'}
                              <input type="file" accept="image/*" capture="environment" className="hidden"
                                onChange={e => handlePhoto(q.key, e.target.files?.[0] ?? null)} />
                            </label>
                            {a.photoPreview && (
                              <img src={a.photoPreview} alt="evidence" className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Overall notes */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Overall notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          value={overallNotes}
          onChange={e => setOverallNotes(e.target.value)}
          placeholder="Any additional observations or actions required…"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 bg-green-700 hover:bg-green-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting audit…</> : 'Submit audit'}
      </button>
    </div>
  )
}
