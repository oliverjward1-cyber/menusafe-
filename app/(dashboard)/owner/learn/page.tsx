import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ALLERGEN_MODULES } from '@/lib/constants/allergen-learning'
import { BookOpen, CheckCircle2, Clock, AlertTriangle, UtensilsCrossed, Scissors, Thermometer, ShieldCheck, ChevronRight } from 'lucide-react'

const KITCHEN_PRACTICE_MODULES = [
  {
    href: '/owner/learn/cross-contamination',
    icon: UtensilsCrossed,
    colour: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    title: 'Cross Contamination',
    description: 'Preventing cross-contamination from raw ingredients, surfaces, equipment, and hands.',
    duration: '10 min',
  },
  {
    href: '/owner/learn/chopping-boards',
    icon: Scissors,
    colour: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    title: 'Chopping Board Colour Codes',
    description: 'The UK colour-coded chopping board system and why it matters for food safety.',
    duration: '5 min',
  },
  {
    href: '/owner/learn/cooking-temps',
    icon: Thermometer,
    colour: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    title: 'Cooking Temperatures',
    description: 'Safe minimum core temperatures for meat, poultry, fish, and reheated food.',
    duration: '8 min',
  },
  {
    href: '/owner/learn/fridge-temps',
    icon: Thermometer,
    colour: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    title: 'Fridge & Storage Temperatures',
    description: 'Correct chiller, freezer, and ambient storage temperatures to prevent bacterial growth.',
    duration: '8 min',
  },
  {
    href: '/owner/learn/kitchen-practices',
    icon: ShieldCheck,
    colour: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    title: 'General Kitchen Practices',
    description: 'Personal hygiene, waste management, pest control, and FIFO stock rotation.',
    duration: '10 min',
  },
]

export default async function LearnHubPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: completions } = await supabase
    .from('allergen_module_completions')
    .select('module_slug, score')
    .eq('user_id', user.id)

  const completed = new Map((completions ?? []).map(c => [c.module_slug, c]))
  const completedCount = completed.size

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-semibold text-mise-ink">Learning Hub</h1>
        <p className="text-mise-ink/50 mt-1">Food safety and allergen training modules for your whole team.</p>
      </div>

      {/* FOH Section */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-mise-ink">Front of House</h2>
            <p className="text-xs text-gray-500">Customer-facing staff</p>
          </div>
        </div>

        {/* FOH allergen progress */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden mb-3">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-mise-ink text-sm">Allergen Awareness — 14 Modules</p>
              <p className="text-xs text-gray-500 mt-0.5">The 14 major allergens, customer communication, and Natasha's Law</p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{completedCount}/14 done</span>
          </div>
          <div className="px-5 py-3">
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
              <div
                className="bg-mise-mid h-1.5 rounded-full transition-all"
                style={{ width: `${(completedCount / 14) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {ALLERGEN_MODULES.map(module => {
                const done = completed.get(module.slug)
                return (
                  <Link
                    key={module.slug}
                    href={`/owner/learn/${module.slug}`}
                    className={`group relative rounded-xl border p-3 text-center transition-all hover:shadow-sm ${
                      done ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 hover:border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <div className="text-xl mb-1">{module.emoji}</div>
                    <p className="text-xs font-medium text-mise-ink leading-tight">{module.name}</p>
                    {done && (
                      <CheckCircle2 className="h-3 w-3 text-green-600 absolute top-1.5 right-1.5" />
                    )}
                  </Link>
                )
              })}
            </div>
            <Link href="/owner/learn/celery" className="inline-flex items-center gap-1 text-xs text-mise-mid font-medium mt-3 hover:underline">
              Browse all allergen modules <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Kitchen Section */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-mise-ink">Kitchen Team</h2>
            <p className="text-xs text-gray-500">Back of house staff</p>
          </div>
        </div>

        {/* Kitchen allergen module */}
        <Link href="/owner/learn/kitchen-allergens" className="block group mb-3">
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-5 py-4 flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-mise-ink text-sm group-hover:text-mise-mid transition-colors">Kitchen Allergen Management</p>
                <p className="text-xs text-gray-500 mt-0.5">Handling allergen ingredients safely, labelling dishes, and communicating with FOH</p>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1"><Clock className="h-3 w-3" /> 12 min</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
            </div>
          </div>
        </Link>

        {/* Practice modules */}
        <div className="space-y-3">
          {KITCHEN_PRACTICE_MODULES.map(({ href, icon: Icon, colour, bg, border, title, description, duration }) => (
            <Link key={href} href={href} className="block group">
              <div className={`bg-white rounded-2xl border ${border} shadow-sm overflow-hidden hover:shadow-md transition-shadow`}>
                <div className="px-5 py-4 flex gap-4 items-center">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${colour}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-mise-ink text-sm group-hover:text-mise-mid transition-colors">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1"><Clock className="h-3 w-3" /> {duration}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
