import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, CheckCircle2, BookOpen } from 'lucide-react'
import { ALLERGEN_MODULE_MAP } from '@/lib/constants/allergen-learning'
import AllergenQuiz from './AllergenQuiz'

export default async function AllergenModulePage({
  params,
}: {
  params: { allergen: string }
}) {
  const module = ALLERGEN_MODULE_MAP[params.allergen]
  if (!module) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('allergen_module_completions')
    .select('score, completed_at')
    .eq('user_id', user.id)
    .eq('module_slug', module.slug)
    .maybeSingle()

  const allModuleSlugs = Object.keys(ALLERGEN_MODULE_MAP)
  const currentIndex = allModuleSlugs.indexOf(module.slug)
  const nextSlug = allModuleSlugs[currentIndex + 1] ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/learn" className="text-hospopilot-ink/40 hover:text-hospopilot-ink transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs text-hospopilot-ink/40 uppercase tracking-widest font-semibold">
            Allergen Learning · Module {currentIndex + 1} of {allModuleSlugs.length}
          </p>
          <h1 className="text-xl font-display font-semibold text-hospopilot-ink flex items-center gap-2 mt-0.5">
            <span className="text-2xl">{module.emoji}</span> {module.name}
          </h1>
        </div>
      </div>

      {/* Previous completion badge */}
      {existing && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          You completed this module with a score of <strong>{existing.score}%</strong> on {new Date(existing.completed_at).toLocaleDateString('en-GB')}. Review anytime.
        </div>
      )}

      {/* Cover card */}
      <div className={`${module.colour} rounded-2xl p-6`}>
        <p className="text-lg font-semibold text-hospopilot-ink">{module.tagline}</p>
        <p className="text-sm text-hospopilot-ink/70 mt-2 leading-relaxed">{module.whatIsIt}</p>
      </div>

      {/* Hidden in */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-hospopilot-ink mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" /> Where it hides
        </h2>
        <ul className="space-y-1.5">
          {module.hiddenIn.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-hospopilot-ink/80">
              <span className="text-amber-400 mt-0.5 flex-shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Symptoms */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-hospopilot-ink mb-3 flex items-center gap-2">
          <span className="text-red-500 text-lg">🩺</span> Reaction symptoms
        </h2>
        <ul className="space-y-1.5">
          {module.symptoms.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-hospopilot-ink/80">
              <span className="text-red-400 mt-0.5 flex-shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Kitchen tips */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-hospopilot-ink mb-3 flex items-center gap-2">
          <span className="text-hospopilot-mid text-lg">🍳</span> Kitchen best practice
        </h2>
        <ul className="space-y-1.5">
          {module.kitchenTips.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-hospopilot-ink/80">
              <span className="text-hospopilot-mid mt-0.5 flex-shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* UK Law */}
      <div className="bg-hospopilot-deep/5 border border-hospopilot-deep/20 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-hospopilot-deep mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> UK Law
        </h2>
        <p className="text-sm text-hospopilot-ink/80 leading-relaxed">{module.ukLaw}</p>
      </div>

      {/* Quiz */}
      <AllergenQuiz
        moduleSlug={module.slug}
        quiz={module.quiz}
        userId={user.id}
        previousScore={existing?.score ?? null}
        nextSlug={nextSlug}
      />
    </div>
  )
}
