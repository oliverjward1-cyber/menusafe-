import Link from 'next/link'
import { ArrowLeft, ChevronRight, Users, ShieldCheck, AlertTriangle, MessageSquare } from 'lucide-react'

const ALLERGENS = [
  { slug: 'celery', emoji: '🌿', name: 'Celery', colour: 'bg-green-50 border-green-100' },
  { slug: 'crustaceans', emoji: '🦞', name: 'Crustaceans', colour: 'bg-orange-50 border-orange-100' },
  { slug: 'eggs', emoji: '🥚', name: 'Eggs', colour: 'bg-yellow-50 border-yellow-100' },
  { slug: 'fish', emoji: '🐟', name: 'Fish', colour: 'bg-blue-50 border-blue-100' },
  { slug: 'gluten', emoji: '🌾', name: 'Gluten', colour: 'bg-amber-50 border-amber-100' },
  { slug: 'lupin', emoji: '🌸', name: 'Lupin', colour: 'bg-pink-50 border-pink-100' },
  { slug: 'milk', emoji: '🥛', name: 'Milk', colour: 'bg-blue-50 border-blue-100' },
  { slug: 'molluscs', emoji: '🦪', name: 'Molluscs', colour: 'bg-slate-50 border-slate-100' },
  { slug: 'mustard', emoji: '🌭', name: 'Mustard', colour: 'bg-yellow-50 border-yellow-100' },
  { slug: 'peanuts', emoji: '🥜', name: 'Peanuts', colour: 'bg-amber-50 border-amber-100' },
  { slug: 'sesame', emoji: '🫘', name: 'Sesame', colour: 'bg-stone-50 border-stone-100' },
  { slug: 'soybeans', emoji: '🫛', name: 'Soybeans', colour: 'bg-green-50 border-green-100' },
  { slug: 'sulphites', emoji: '🍷', name: 'Sulphites', colour: 'bg-purple-50 border-purple-100' },
  { slug: 'tree-nuts', emoji: '🌰', name: 'Tree Nuts', colour: 'bg-amber-50 border-amber-100' },
]

const FOH_DUTIES = [
  {
    icon: MessageSquare,
    colour: 'bg-blue-100 text-blue-700',
    title: 'Taking allergen requests',
    points: [
      'Always ask — never assume',
      'Repeat the allergen back to the customer to confirm',
      'Never say "I think it\'s fine" — check with the kitchen',
      'Use the allergen folder or digital menu to confirm every time',
    ],
  },
  {
    icon: AlertTriangle,
    colour: 'bg-amber-100 text-amber-700',
    title: 'When a customer mentions an allergy',
    points: [
      'Take it seriously — every allergy request is a potential life or death situation',
      'Inform the kitchen immediately — do not rely on notes alone',
      'Tell your manager if you are unsure about any dish',
      'Never place an order without flagging the allergy to the kitchen verbally',
    ],
  },
  {
    icon: ShieldCheck,
    colour: 'bg-green-100 text-green-700',
    title: 'Serving allergen-safe dishes',
    points: [
      'Collect allergen dishes yourself — do not ask another team member to run them',
      'Check the ticket matches the plate before leaving the pass',
      'Do not place the dish near dishes containing the allergen',
      'Inform the customer what steps have been taken when you serve',
    ],
  },
  {
    icon: Users,
    colour: 'bg-purple-100 text-purple-700',
    title: 'Communicating with your team',
    points: [
      'Verbal communication to the kitchen is required — written notes alone are not enough',
      'If the dish cannot be made safe, offer an alternative or inform the customer honestly',
      'Never feel pressured to skip allergen checks during busy service',
      'All staff must know which dishes contain which allergens',
    ],
  },
]

export default function FOHLearningPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/learn" className="text-hospopilot-ink/40 hover:text-hospopilot-ink transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-hospopilot-ink">FOH Allergen Awareness</h1>
          <p className="text-hospopilot-ink/50 text-sm mt-0.5">Front of House — essential allergen knowledge</p>
        </div>
      </div>

      {/* Why it matters */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
        <h2 className="font-bold text-red-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> Why this matters
        </h2>
        <p className="text-sm text-red-700 leading-relaxed">
          Under the Food Information Regulations 2014 and Natasha&apos;s Law (2021), food businesses are legally
          required to provide accurate allergen information. As a FOH team member you are the critical link between
          the customer and the kitchen. Getting this wrong can cause serious harm or death.
        </p>
      </div>

      {/* FOH duties */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-hospopilot-ink">Your responsibilities</h2>
        {FOH_DUTIES.map(duty => (
          <div key={duty.title} className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${duty.colour}`}>
                <duty.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-hospopilot-ink">{duty.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {duty.points.map(p => (
                <li key={p} className="flex items-start gap-2 text-sm text-hospopilot-ink/70">
                  <span className="text-hospopilot-mid font-bold mt-0.5">·</span> {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 14 allergen modules */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-hospopilot-ink">The 14 major allergens</h2>
          <p className="text-hospopilot-ink/50 text-sm">Learn each allergen in detail — where it hides, symptoms, and how to handle requests.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ALLERGENS.map(a => (
            <Link
              key={a.slug}
              href={`/owner/learn/${a.slug}`}
              className={`flex items-center gap-3 p-3 rounded-2xl border ${a.colour} hover:shadow-sm transition-shadow`}
            >
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-hospopilot-ink text-sm">{a.name}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-hospopilot-ink/20 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Take the quiz */}
      <div className="bg-hospopilot-ink rounded-2xl p-6 text-center text-white">
        <h2 className="text-lg font-bold mb-1">Ready to test your knowledge?</h2>
        <p className="text-white/60 text-sm mb-4">Take the FOH allergen quiz — 80% needed to pass</p>
        <Link href="/owner/staff-quiz"
          className="inline-flex items-center gap-2 bg-hospopilot-mid text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-hospopilot-deep transition-colors">
          Go to FOH Quiz <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
