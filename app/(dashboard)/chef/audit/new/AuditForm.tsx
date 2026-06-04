'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, AlertTriangle, MessageSquare } from 'lucide-react'

type Answer = 'pass' | 'fail' | 'na' | null
interface AnswerState {
  answer: Answer
  notes: string | null
  photoFile: File | null
  photoPreview: string | null
  uploading: boolean
}

const DEFAULT_STATE: AnswerState = { answer: null, notes: null, photoFile: null, photoPreview: null, uploading: false }

export function AuditForm({ restaurantId, questions }: { restaurantId: string; questions: { key: string; label: string; category: string; requiresPhotoOnFail?: boolean }[] }) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const categories = Array.from(new Set(questions.map(q => q.category)))

  const [staffName, setStaffName] = useState('')
  const [overallNotes, setOverallNotes] = useState('')
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(
    Object.fromEntries(questions.map(q => [q.key, { ...DEFAULT_STATE }]))
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function setAnswer(key: string, field: keyof AnswerState, value: unknown) {
    setAnswers(prev => {
      const current = prev[key]
      const updated = { ...current, [field]: value }
      // Auto-open notes when fail is selected
      if (field === 'answer' && value === 'fail' && current.notes === null) {
        updated.notes = ''
      }
      return { ...prev, [key]: updated }
    })
  }

  function handlePhoto(key: string, file: File | null) {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setAnswers(prev => ({ ...prev, [key]: { ...prev[key], photoFile: file, photoPreview: preview } }))
  }

  const answered = questions.filter(q => answers[q.key].answer !== null).length
  const total = questions.length
  const fails = questions.filter(q => answers[q.key].answer === 'fail').length

  async function handleSubmit() {
    if (!staffName.trim()) { setError('Please enter your name before submitting'); return }
    const unanswered = questions.filter(q => answers[q.key].answer === null)
    if (unanswered.length > 0) { setError(`${unanswered.length} question${unanswered.length !== 1 ? 's' : ''} not answered yet`); return }

    setSubmitting(true)
    setError('')

    // Calculate score
    const applicable = questions.filter(q => answers[q.key].answer !== 'na')
    const passed = applicable.filter(q => answers[q.key].answer === 'pass').length
    const scoreTotal = applicable.length
    const pct = scoreTotal > 0 ? (passed / scoreTotal) * 100 : 100
    const status = pct >= 90 ? 'green' : pct >= 70 ? 'amber' : 'red'

    // Upload photos first
    const photoUrls: Record<string, string> = {}
    for (const q of questions) {
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

    const answerRows = questions.map(q => ({
      question_key: q.key,
      answer: answers[q.key].answer,
      notes: answers[q.key].notes?.trim() || null,
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
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Your name</label>
        <input
          value={staffName}
          onChange={e => setStaffName(e.target.value)}
          placeholder="e.g. James Smith"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent"
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-mise-ink/50">{answered} of {total} answered</span>
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
      {categories.map(cat => {
        const catQuestions = questions.filter(q => q.category === cat)
        const catAnswered = catQuestions.filter(q => answers[q.key]?.answer !== null).length
        const catFails = catQuestions.filter(q => answers[q.key]?.answer === 'fail').length
        return (
          <div key={cat} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-mise-ink">{cat}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {catAnswered} of {catQuestions.length} answered
                {catFails > 0 && <span className="text-red-500 ml-2">· {catFails} fail{catFails !== 1 ? 's' : ''}</span>}
              </p>
            </div>
            <div className="px-5">
              {catQuestions.map(q => {
                const a = answers[q.key] ?? DEFAULT_STATE
                return (
                  <div key={q.key} className="border-b border-gray-100 last:border-0 py-4">
                    {/* Question text */}
                    <p className="text-sm font-medium text-mise-ink mb-3 leading-snug">{q.label}</p>

                    {/* Full-width stacked answer buttons */}
                    <div className="space-y-2 mb-3">
                      {(['pass', 'fail', 'na'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => setAnswer(q.key, 'answer', opt)}
                          className={`w-full py-3 px-4 rounded-xl border text-sm font-medium transition-colors text-left ${
                            a.answer === opt
                              ? opt === 'pass' ? 'bg-green-600 border-green-600 text-white'
                                : opt === 'fail' ? 'bg-red-600 border-red-600 text-white'
                                : 'bg-gray-500 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-mise-gold hover:bg-mise-gold/5'
                          }`}
                        >
                          {opt === 'pass' ? 'Yes' : opt === 'fail' ? 'No' : 'N/A'}
                        </button>
                      ))}
                    </div>

                    {/* Media & Comment row - show only when answered */}
                    {a.answer !== null && (
                      <div className="flex items-center gap-3 mt-2">
                        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          <Camera className="h-4 w-4" />
                          {a.photoPreview ? 'Change photo' : 'Media & Files'}
                          <input type="file" accept="image/*" capture="environment" className="hidden"
                            onChange={e => handlePhoto(q.key, e.target.files?.[0] ?? null)} />
                        </label>
                        <button
                          onClick={() => setAnswer(q.key, 'notes', a.notes === null ? '' : null)}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <MessageSquare className="h-4 w-4" /> Comment
                        </button>
                        {a.photoPreview && (
                          <img src={a.photoPreview} alt="evidence" className="h-8 w-8 rounded-lg object-cover border border-gray-200 ml-auto" />
                        )}
                      </div>
                    )}

                    {/* Notes input - show when comment is open (notes !== null) or on fail */}
                    {(a.answer === 'fail' || (a.notes !== null && a.answer !== null)) && (
                      <textarea
                        value={a.notes ?? ''}
                        onChange={e => setAnswer(q.key, 'notes', e.target.value)}
                        placeholder={a.answer === 'fail' ? 'Describe the issue…' : 'Add a comment…'}
                        rows={2}
                        className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent resize-none"
                      />
                    )}

                    {/* Photo hint for fails with requiresPhotoOnFail */}
                    {a.answer === 'fail' && q.requiresPhotoOnFail && !a.photoPreview && (
                      <p className="mt-1.5 text-xs text-red-400">Photo recommended for fails</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Overall notes */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Overall notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          value={overallNotes}
          onChange={e => setOverallNotes(e.target.value)}
          placeholder="Any additional observations or actions required…"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent resize-none"
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
        className="w-full py-3 bg-mise-gold hover:bg-yellow-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting audit…</> : 'Submit audit'}
      </button>
    </div>
  )
}
