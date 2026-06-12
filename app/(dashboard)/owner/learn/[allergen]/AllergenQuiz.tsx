'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react'

type Question = { q: string; options: string[]; answer: number }

export default function AllergenQuiz({
  moduleSlug,
  quiz,
  userId,
  previousScore,
  nextSlug,
}: {
  moduleSlug: string
  quiz: Question[]
  userId: string
  previousScore: number | null
  nextSlug: string | null
}) {
  const router = useRouter()
  const [answers, setAnswers] = useState<(number | null)[]>(Array(quiz.length).fill(null))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const allAnswered = answers.every(a => a !== null)
  const correctCount = answers.filter((a, i) => a === quiz[i].answer).length
  const score = Math.round((correctCount / quiz.length) * 100)
  const passed = score >= 67

  async function submit() {
    if (!allAnswered) return
    setSaving(true)
    setSubmitted(true)
    await fetch('/api/compliance/allergen-module', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleSlug, score }),
    })
    setSaving(false)
  }

  function reset() {
    setAnswers(Array(quiz.length).fill(null))
    setSubmitted(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.04] flex items-center justify-between">
        <h2 className="text-base font-semibold text-hospopilot-ink">Knowledge check</h2>
        {previousScore !== null && !submitted && (
          <span className="text-xs text-hospopilot-ink/40">Previous best: {previousScore}%</span>
        )}
      </div>

      <div className="p-5 space-y-6">
        {quiz.map((q, qi) => (
          <div key={qi}>
            <p className="text-sm font-medium text-hospopilot-ink mb-3">
              {qi + 1}. {q.q}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isSelected = answers[qi] === oi
                const isCorrect = submitted && oi === q.answer
                const isWrong = submitted && isSelected && oi !== q.answer

                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => {
                      if (submitted) return
                      const next = [...answers]
                      next[qi] = oi
                      setAnswers(next)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                      isCorrect
                        ? 'bg-green-50 border-green-400 text-green-800 font-medium'
                        : isWrong
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : isSelected
                        ? 'bg-hospopilot-mid/10 border-hospopilot-mid text-hospopilot-ink font-medium'
                        : 'bg-hospopilot-cream/40 border-black/[0.06] text-hospopilot-ink/70 hover:bg-hospopilot-cream hover:border-hospopilot-mid/30'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                      {submitted && isWrong && <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                      {opt}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-black/[0.04]">
        {!submitted ? (
          <button
            onClick={submit}
            disabled={!allAnswered || saving}
            className="w-full bg-hospopilot-deep text-white rounded-xl py-3 text-sm font-semibold hover:bg-hospopilot-deep/90 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Submit answers'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className={`rounded-xl p-4 text-center ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-2xl font-bold ${passed ? 'text-green-700' : 'text-red-600'}`}>{score}%</p>
              <p className={`text-sm font-medium mt-1 ${passed ? 'text-green-700' : 'text-red-600'}`}>
                {passed ? '✓ Module passed!' : '✗ Not quite — review the content and try again'}
              </p>
              <p className="text-xs text-hospopilot-ink/40 mt-1">{correctCount} of {quiz.length} correct</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-1.5 flex-1 justify-center border border-black/[0.08] text-hospopilot-ink/70 rounded-xl py-2.5 text-sm font-medium hover:bg-hospopilot-cream transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Retake
              </button>
              {nextSlug && (
                <button
                  onClick={() => router.push(`/owner/learn/${nextSlug}`)}
                  className="flex items-center gap-1.5 flex-1 justify-center bg-hospopilot-deep text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-hospopilot-deep/90 transition-colors"
                >
                  Next module <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
              {!nextSlug && passed && (
                <button
                  onClick={() => router.push('/owner/learn')}
                  className="flex items-center gap-1.5 flex-1 justify-center bg-hospopilot-deep text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-hospopilot-deep/90 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> All done!
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
