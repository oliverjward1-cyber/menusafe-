import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, CheckCircle2, BookOpen, Scale } from 'lucide-react'
import { ALLERGEN_MODULE_MAP, LAW_MODULE_MAP, ALLERGEN_MODULES, LAW_MODULES } from '@/lib/constants/allergen-learning'
import AllergenQuiz from './AllergenQuiz'

export default async function AllergenModulePage({ params }: { params: { allergen: string } }) {
  const allergenMod = ALLERGEN_MODULE_MAP[params.allergen]
  const lawMod = LAW_MODULE_MAP[params.allergen]
  if (!allergenMod && !lawMod) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('allergen_module_completions')
    .select('score, completed_at')
    .eq('user_id', user.id)
    .eq('module_slug', params.allergen)
    .maybeSingle()

  // Navigation — allergen modules first, then law modules
  const allSlugs = [...ALLERGEN_MODULES.map(m => m.slug), ...LAW_MODULES.map(m => m.slug)]
  const currentIndex = allSlugs.indexOf(params.allergen)
  const nextSlug = allSlugs[currentIndex + 1] ?? null
  const isLaw = !!lawMod
  const mod = allergenMod ?? lawMod!

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/learn" className="text-mise-ink/40 hover:text-mise-ink transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs text-mise-ink/40 uppercase tracking-widest font-semibold">
            {isLaw ? 'Food Law' : 'Allergen Learning'} · Module {currentIndex + 1} of {allSlugs.length}
          </p>
          <h1 className="text-xl font-display font-semibold text-mise-ink flex items-center gap-2 mt-0.5">
            <span className="text-2xl">{mod.emoji}</span> {mod.name}
          </h1>
        </div>
      </div>

      {existing && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          You completed this module with <strong>{existing.score}%</strong> on {new Date(existing.completed_at).toLocaleDateString('en-GB')}. Review anytime.
        </div>
      )}

      {/* Cover */}
      <div className={`${mod.colour} rounded-2xl p-6`}>
        <p className="text-lg font-semibold text-mise-ink">{mod.tagline}</p>
        <p className="text-sm text-mise-ink/70 mt-2 leading-relaxed">{isLaw ? lawMod!.summary : allergenMod!.whatIsIt}</p>
      </div>

      {isLaw ? (
        // ── Law module layout ──
        <>
          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
            <h2 className="text-base font-semibold text-mise-ink mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-500" /> Key points
            </h2>
            <ul className="space-y-2">
              {lawMod!.keyPoints.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-mise-ink/80">
                  <span className="text-blue-400 mt-0.5 flex-shrink-0">▸</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
            <h2 className="text-base font-semibold text-mise-ink mb-3 flex items-center gap-2">
              <span className="text-mise-mid text-lg">🍳</span> What this means for your restaurant
            </h2>
            <ul className="space-y-2">
              {lawMod!.whatItMeansForYou.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-mise-ink/80">
                  <span className="text-mise-mid mt-0.5 flex-shrink-0">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Real-world scenario
            </h2>
            <p className="text-sm text-amber-900 leading-relaxed">{lawMod!.scenario}</p>
          </div>
        </>
      ) : (
        // ── Allergen module layout ──
        <>
          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
            <h2 className="text-base font-semibold text-mise-ink mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Where it hides
            </h2>
            <ul className="space-y-1.5">
              {allergenMod!.hiddenIn.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-mise-ink/80">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">▸</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
            <h2 className="text-base font-semibold text-mise-ink mb-3 flex items-center gap-2">
              <span className="text-red-500 text-lg">🩺</span> Reaction symptoms
            </h2>
            <ul className="space-y-1.5">
              {allergenMod!.symptoms.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-mise-ink/80">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">▸</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
            <h2 className="text-base font-semibold text-mise-ink mb-3 flex items-center gap-2">
              <span className="text-mise-mid text-lg">🍳</span> Kitchen best practice
            </h2>
            <ul className="space-y-1.5">
              {allergenMod!.kitchenTips.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-mise-ink/80">
                  <span className="text-mise-mid mt-0.5 flex-shrink-0">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* UK Law */}
      <div className="bg-mise-deep/5 border border-mise-deep/20 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-mise-deep mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> UK Law
        </h2>
        <p className="text-sm text-mise-ink/80 leading-relaxed">{mod.ukLaw}</p>
      </div>

      <AllergenQuiz
        moduleSlug={mod.slug}
        quiz={mod.quiz}
        userId={user.id}
        previousScore={existing?.score ?? null}
        nextSlug={nextSlug}
      />
    </div>
  )
}
