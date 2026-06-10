import Link from 'next/link'
import { ChevronLeft, UtensilsCrossed, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default function CrossContaminationPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/learn" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Learning Hub
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
          <UtensilsCrossed className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kitchen Team</p>
          <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Cross Contamination</h1>
          <p className="text-sm text-gray-500 mt-1">How harmful bacteria and allergens transfer between food, surfaces, and people.</p>
        </div>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-3">What is cross contamination?</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Cross contamination is when harmful bacteria or allergens are transferred — directly or indirectly — to food that should be safe to eat. It is one of the most common causes of food poisoning and allergic reactions in commercial kitchens. It can happen in seconds and is often invisible.
        </p>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" /> The four types
        </h2>
        <div className="space-y-4">
          {[
            { type: 'Food to food', colour: 'bg-red-50 border-red-100 text-red-700', desc: 'Raw meat juices dripping onto ready-to-eat food. Unwashed vegetables touching cooked food. Always store raw meat on the bottom shelf, below ready-to-eat food.' },
            { type: 'Equipment to food', colour: 'bg-orange-50 border-orange-100 text-orange-700', desc: 'Using the same chopping board or knife for raw meat then vegetables without washing. Always wash and sanitise equipment between uses.' },
            { type: 'People to food', colour: 'bg-amber-50 border-amber-100 text-amber-700', desc: 'Unwashed hands transferring bacteria after handling raw chicken, going to the toilet, or touching your face. Wash hands thoroughly for 20 seconds.' },
            { type: 'Surface to food', colour: 'bg-yellow-50 border-yellow-100 text-yellow-700', desc: 'A dirty work surface, cloth, or sponge spreading bacteria to food. Clean and sanitise surfaces regularly, especially between tasks.' },
          ].map(({ type, colour, desc }) => (
            <div key={type} className={`rounded-xl border p-4 ${colour}`}>
              <p className="font-semibold text-sm mb-1">{type}</p>
              <p className="text-sm opacity-80">{desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" /> Prevention rules
        </h2>
        <ul className="space-y-3">
          {[
            'Wash hands before starting work, after handling raw meat/fish/poultry, after touching your face, after using the toilet, and after handling waste.',
            'Use colour-coded chopping boards and knives — never use the same board for raw meat and ready-to-eat food.',
            'Store raw meat, poultry, and fish on the lowest fridge shelf, covered, below all other food.',
            'Clean and sanitise all work surfaces before and after each task — use a food-safe sanitiser spray.',
            'Never use the same cloth to wipe down different surfaces. Use single-use paper towels or colour-coded cloths.',
            'Change gloves between tasks, particularly when moving from raw to cooked or ready-to-eat food.',
            'Keep raw and ready-to-eat food physically separated at all times.',
            'Never wash raw chicken or meat — it spreads bacteria around the sink and nearby surfaces.',
          ].map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4 flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" /> Never do this
        </h2>
        <ul className="space-y-3">
          {[
            'Never place cooked or ready-to-eat food on a surface that has held raw meat without sanitising first.',
            'Never store open raw meat above dairy, cooked food, or vegetables in the fridge.',
            'Never reuse marinades or sauces that have been in contact with raw meat.',
            'Never use the same tongs for raw and cooked food on the grill.',
            'Never wipe your hands on your apron after touching raw food — wash them.',
          ].map((rule, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              {rule}
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-end">
        <Link href="/owner/learn" className="text-sm text-hospopilot-mid font-medium hover:underline flex items-center gap-1">
          Back to Learning Hub <ChevronLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </div>
  )
}
