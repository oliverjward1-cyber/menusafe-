import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ALLERGEN_MODULES, LAW_MODULES } from '@/lib/constants/allergen-learning'
import { BookOpen, CheckCircle2, Clock, Scale } from 'lucide-react'

export default async function AllergenLearnPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  const { data: completions } = await supabase
    .from('allergen_module_completions')
    .select('module_slug, score, completed_at')
    .eq('user_id', user.id)

  const completed = new Map((completions ?? []).map(c => [c.module_slug, c]))
  const allergenDoneCount = ALLERGEN_MODULES.filter(m => completed.has(m.slug)).length
  const lawDoneCount = LAW_MODULES.filter(m => completed.has(m.slug)).length
  const totalModules = ALLERGEN_MODULES.length + LAW_MODULES.length
  const totalDone = allergenDoneCount + lawDoneCount

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-semibold text-mise-ink flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-mise-mid" />
          Allergen Learning Hub
        </h1>
        <p className="text-sm text-mise-ink/50 mt-1">
          {totalModules} modules · allergen knowledge + UK food law
        </p>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-mise-ink">{totalDone} of {totalModules} modules completed</p>
          {totalDone === totalModules && (
            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" /> Fully certified
            </span>
          )}
        </div>
        <div className="w-full bg-black/[0.06] rounded-full h-2.5">
          <div
            className="bg-mise-mid h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${(totalDone / totalModules) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Allergen modules ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-mise-ink">The 14 UK allergens</h2>
            <p className="text-xs text-mise-ink/40 mt-0.5">{allergenDoneCount} of {ALLERGEN_MODULES.length} completed</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALLERGEN_MODULES.map(module => {
            const done = completed.get(module.slug)
            return (
              <Link
                key={module.slug}
                href={`/owner/learn/${module.slug}`}
                className="group bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:shadow-md hover:border-mise-mid/30 transition-all overflow-hidden"
              >
                <div className={`${module.colour} px-5 py-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{module.emoji}</span>
                    {done ? (
                      <span className="inline-flex items-center gap-1 bg-white/80 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> {done.score}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-white/60 text-mise-ink/50 text-xs px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3" /> ~5 min
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="font-semibold text-mise-ink text-sm">{module.name}</p>
                  <p className="text-xs text-mise-ink/50 mt-0.5">{module.tagline}</p>
                  <p className="text-xs text-mise-mid font-medium mt-3 group-hover:underline">
                    {done ? 'Review module →' : 'Start module →'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Food Law modules ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-mise-ink flex items-center gap-2">
              <Scale className="h-4 w-4 text-mise-mid" /> UK Food Law & Customer Rights
            </h2>
            <p className="text-xs text-mise-ink/40 mt-0.5">{lawDoneCount} of {LAW_MODULES.length} completed · Natasha's Law · Owen's Law · Customer communication</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LAW_MODULES.map(module => {
            const done = completed.get(module.slug)
            return (
              <Link
                key={module.slug}
                href={`/owner/learn/${module.slug}`}
                className="group bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:shadow-md hover:border-mise-mid/30 transition-all overflow-hidden"
              >
                <div className={`${module.colour} px-5 py-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{module.emoji}</span>
                    {done ? (
                      <span className="inline-flex items-center gap-1 bg-white/80 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> {done.score}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-white/60 text-mise-ink/50 text-xs px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3" /> ~8 min
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="font-semibold text-mise-ink text-sm">{module.name}</p>
                  <p className="text-xs text-mise-ink/50 mt-0.5">{module.tagline}</p>
                  <p className="text-xs text-mise-mid font-medium mt-3 group-hover:underline">
                    {done ? 'Review module →' : 'Start module →'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
