'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, ChevronRight } from 'lucide-react'
import { ALLERGEN_MODULES, ALLERGEN_MODULE_MAP } from '@/lib/constants/allergen-learning'

export default function StaffLearnModule() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const allergen = params.allergen as string

  const mod = ALLERGEN_MODULE_MAP[allergen]
  const modIndex = ALLERGEN_MODULES.findIndex(m => m.slug === allergen)
  const nextMod = modIndex < ALLERGEN_MODULES.length - 1 ? ALLERGEN_MODULES[modIndex + 1] : null

  const [staffName, setStaffName] = useState('')
  const [restaurantId, setRestaurantId] = useState('')
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)

  useEffect(() => {
    const rid = sessionStorage.getItem('staff_restaurant_id')
    const name = sessionStorage.getItem('staff_name')
    if (!rid) { router.replace(`/kitchen/${slug}`); return }
    setRestaurantId(rid)
    setStaffName(name ?? '')
    if (mod) setAnswers(new Array(mod.quiz.length).fill(null))
    const done = sessionStorage.getItem('staff_learn_done')
    if (done) {
      const set = new Set(JSON.parse(done))
      if (set.has(allergen)) setAlreadyDone(true)
    }
  }, [slug, allergen, mod, router])

  if (!mod) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-mise-ink/40">Module not found</p>
    </div>
  )

  const correctCount = submitted ? answers.filter((a, i) => a === mod.quiz[i].answer).length : 0
  const score = submitted ? Math.round((correctCount / mod.quiz.length) * 100) : 0
  const passed = score >= 67

  function selectAnswer(qi: number, ai: number) {
    if (submitted) return
    setAnswers(prev => prev.map((a, i) => i === qi ? ai : a))
  }

  async function submitQuiz() {
    if (answers.some(a => a === null)) return
    setSubmitted(true)
    const finalScore = Math.round((answers.filter((a, i) => a === mod.quiz[i].answer).length / mod.quiz.length) * 100)
    if (finalScore >= 67) {
      // Save to sessionStorage
      const done = sessionStorage.getItem('staff_learn_done')
      const set: string[] = done ? JSON.parse(done) : []
      if (!set.includes(allergen)) set.push(allergen)
      sessionStorage.setItem('staff_learn_done', JSON.stringify(set))
      // Also save to server (best-effort, staff portal uses restaurantId)
      fetch('/api/kitchen/learn/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, moduleSlug: allergen, score: finalScore, staffName }),
      }).catch(() => {})
    }
  }

  function retake() {
    setAnswers(new Array(mod.quiz.length).fill(null))
    setSubmitted(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${mod.colour} px-5 py-4 flex items-center gap-3`}>
        <button onClick={() => router.back()} className="text-mise-ink/30 hover:text-mise-ink"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{mod.emoji}</span>
          <div>
            <p className="font-bold text-mise-ink">{mod.name}</p>
            <p className="text-mise-ink/50 text-xs">{mod.tagline}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {alreadyDone && !submitted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm font-medium">You've already completed this module — feel free to review!</p>
          </div>
        )}

        {/* What is it */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <h3 className="font-semibold text-mise-ink mb-2">What is it?</h3>
          <p className="text-sm text-mise-ink/70 leading-relaxed">{mod.whatIsIt}</p>
        </div>

        {/* Hidden in */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <h3 className="font-semibold text-mise-ink mb-2">Where it hides</h3>
          <ul className="space-y-1">
            {mod.hiddenIn.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-mise-ink/70">
                <span className="text-mise-mid mt-0.5 flex-shrink-0">•</span>{h}
              </li>
            ))}
          </ul>
        </div>

        {/* Symptoms */}
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
          <h3 className="font-semibold text-red-800 mb-2">Reaction symptoms</h3>
          <ul className="space-y-1">
            {mod.symptoms.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-0.5 flex-shrink-0">⚠️</span>{s}
              </li>
            ))}
          </ul>
        </div>

        {/* Kitchen tips */}
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Kitchen tips</h3>
          <ul className="space-y-1">
            {mod.kitchenTips.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                <span className="mt-0.5 flex-shrink-0">✓</span>{t}
              </li>
            ))}
          </ul>
        </div>

        {/* UK Law */}
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
          <h3 className="font-semibold text-amber-800 mb-1">UK law</h3>
          <p className="text-sm text-amber-700 leading-relaxed">{mod.ukLaw}</p>
        </div>

        {/* Quiz */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm space-y-5">
          <h3 className="font-bold text-mise-ink">Quick quiz</h3>
          {mod.quiz.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-semibold text-mise-ink mb-2">{qi + 1}. {q.q}</p>
              <div className="space-y-2">
                {q.options.map((opt, ai) => {
                  const selected = answers[qi] === ai
                  let cls = 'border border-black/[0.08] bg-gray-50 text-mise-ink/70'
                  if (submitted) {
                    if (ai === q.answer) cls = 'border-green-400 bg-green-50 text-green-800 font-medium'
                    else if (selected && ai !== q.answer) cls = 'border-red-300 bg-red-50 text-red-700 line-through'
                  } else if (selected) {
                    cls = 'border-mise-mid bg-mise-mid/10 text-mise-ink font-medium'
                  }
                  return (
                    <button key={ai} onClick={() => selectAnswer(qi, ai)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${cls}`}>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {submitted && (
                answers[qi] === q.answer
                  ? <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Correct!</p>
                  : <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><XCircle className="h-3 w-3" /> Incorrect</p>
              )}
            </div>
          ))}

          {!submitted && (
            <button onClick={submitQuiz} disabled={answers.some(a => a === null)}
              className="w-full bg-mise-deep text-white rounded-xl py-3 font-bold text-sm disabled:opacity-40">
              Submit answers
            </button>
          )}

          {submitted && (
            <div className={`rounded-xl p-4 text-center ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-2xl font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>{score}%</p>
              <p className={`text-sm font-semibold mt-0.5 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? '✓ Passed!' : 'Not quite — try again'}
              </p>
              <p className="text-xs text-mise-ink/40 mt-1">{correctCount}/{mod.quiz.length} correct · Pass mark 67%</p>
              <div className="flex gap-2 mt-3">
                {!passed && (
                  <button onClick={retake}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-red-200 text-red-600 rounded-xl py-2.5 text-sm font-semibold">
                    <RotateCcw className="h-4 w-4" /> Retake
                  </button>
                )}
                {nextMod && (
                  <button onClick={() => router.push(`/kitchen/${slug}/learn/${nextMod.slug}`)}
                    className={`flex-1 flex items-center justify-center gap-1.5 bg-mise-deep text-white rounded-xl py-2.5 text-sm font-semibold`}>
                    Next: {nextMod.name} <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                {!nextMod && passed && (
                  <button onClick={() => router.push(`/kitchen/${slug}/learn`)}
                    className="flex-1 bg-mise-deep text-white rounded-xl py-2.5 text-sm font-semibold">
                    Back to modules
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
