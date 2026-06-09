import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ALLERGEN_MODULES } from '@/lib/constants/allergen-learning'
import { BookOpen, CheckCircle2, Clock } from 'lucide-react'

export default async function AllergenLearnPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const rid = profile?.restaurant_id ?? ''

  // Fetch completed modules for this user
  const { data: completions } = await supabase
    .from('allergen_module_completions')
    .select('module_slug, score, completed_at')
    .eq('user_id', user.id)

  const completed = new Map((completions ?? []).map(c => [c.module_slug, c]))
  const completedCount = completed.size

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-hospopilot-ink flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-hospopilot-mid" />
          Allergen Learning Hub
        </h1>
        <p className="text-sm text-hospopilot-ink/50 mt-1">
          14 modules covering every major allergen · Complete all 14 to earn your certification
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-hospopilot-ink">{completedCount} of 14 modules completed</p>
          {completedCount === 14 && (
            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" /> Certified
            </span>
          )}
        </div>
        <div className="w-full bg-black/[0.06] rounded-full h-2.5">
          <div
            className="bg-hospopilot-mid h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 14) * 100}%` }}
          />
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALLERGEN_MODULES.map(module => {
          const done = completed.get(module.slug)
          return (
            <Link
              key={module.slug}
              href={`/owner/learn/${module.slug}`}
              className="group bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:shadow-md hover:border-hospopilot-mid/30 transition-all overflow-hidden"
            >
              <div className={`${module.colour} px-5 py-4`}>
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{module.emoji}</span>
                  {done ? (
                    <span className="inline-flex items-center gap-1 bg-white/80 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> {done.score}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-white/60 text-hospopilot-ink/50 text-xs px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" /> ~5 min
                    </span>
                  )}
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="font-semibold text-hospopilot-ink text-sm">{module.name}</p>
                <p className="text-xs text-hospopilot-ink/50 mt-0.5">{module.tagline}</p>
                <p className="text-xs text-hospopilot-mid font-medium mt-3 group-hover:underline">
                  {done ? 'Review module →' : 'Start module →'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
