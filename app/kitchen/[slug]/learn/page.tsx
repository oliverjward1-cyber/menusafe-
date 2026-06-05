'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight } from 'lucide-react'
import { ALLERGEN_MODULES } from '@/lib/constants/allergen-learning'

export default function StaffLearn() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [staffName, setStaffName] = useState('')
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    const rid = sessionStorage.getItem('staff_restaurant_id')
    const name = sessionStorage.getItem('staff_name')
    if (!rid) { router.replace(`/kitchen/${slug}`); return }
    setStaffName(name ?? '')
    const done = sessionStorage.getItem('staff_learn_done')
    if (done) setCompleted(new Set(JSON.parse(done)))
  }, [slug, router])

  const completedCount = completed.size

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-mise-ink px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <p className="text-white font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4" /> Allergen learning</p>
          <p className="text-white/40 text-xs">{completedCount} of 14 completed · {staffName}</p>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-3">
        {/* Progress */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <div className="flex justify-between text-xs text-mise-ink/50 mb-2">
            <span>Your progress</span>
            <span className="font-semibold text-mise-ink">{completedCount}/14 modules</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-mise-deep h-2 rounded-full transition-all" style={{ width: `${(completedCount / 14) * 100}%` }} />
          </div>
          {completedCount === 14 && (
            <p className="text-green-600 text-xs font-semibold mt-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> All modules complete!</p>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">14 UK allergens · ~5 min each</p>

        {ALLERGEN_MODULES.map(mod => (
          <button key={mod.slug} onClick={() => router.push(`/kitchen/${slug}/learn/${mod.slug}`)}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-black/[0.06] shadow-sm active:scale-[0.98] transition-transform text-left">
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${mod.colour} flex items-center justify-center text-2xl`}>
              {mod.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-mise-ink text-sm">{mod.name}</p>
              <p className="text-xs text-mise-ink/40 mt-0.5 truncate">{mod.tagline}</p>
            </div>
            {completed.has(mod.slug)
              ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              : <ChevronRight className="h-4 w-4 text-mise-ink/20 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  )
}
