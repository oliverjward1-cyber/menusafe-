import Link from 'next/link'
import { ChevronLeft, Thermometer, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default function FridgeTempsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/learn" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Learning Hub
        </Link>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Thermometer className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kitchen Team</p>
          <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Fridge & Storage Temperatures</h1>
          <p className="text-sm text-gray-500 mt-1">Keeping food at the right temperature to slow bacterial growth and maintain safety.</p>
        </div>
      </div>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4">Temperature targets</h2>
        <div className="space-y-3">
          {[
            { label: 'Chiller / fridge', temp: '1°C – 4°C', colour: 'bg-blue-50 border-blue-200 text-blue-800', note: 'Ideally 1–4°C. UK law requires chilled food to be kept at or below 8°C, but best practice is under 5°C.' },
            { label: 'Freezer', temp: '-18°C or below', colour: 'bg-cyan-50 border-cyan-200 text-cyan-800', note: 'Freezing stops bacterial growth. Never refreeze thawed food unless it has been cooked first.' },
            { label: 'Ambient / dry store', temp: '10°C – 15°C', colour: 'bg-amber-50 border-amber-200 text-amber-800', note: 'Cool, dark, and dry. Away from direct sunlight, pipes, and heat sources.' },
            { label: 'Hot holding', temp: '63°C or above', colour: 'bg-orange-50 border-orange-200 text-orange-800', note: 'Food kept hot for service must stay at or above 63°C at all times. Check and log every 2 hours.' },
          ].map(({ label, temp, colour, note }) => (
            <div key={label} className={`rounded-xl border p-4 ${colour}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{label}</p>
                <span className="text-lg font-bold">{temp}</span>
              </div>
              <p className="text-xs opacity-75">{note}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4">Fridge storage order</h2>
        <p className="text-sm text-gray-500 mb-3">Always store food in this order from top to bottom:</p>
        <div className="space-y-2">
          {[
            ['Top shelf', 'Ready-to-eat food, dairy, cooked food, desserts'],
            ['Middle shelf', 'Whole cuts of raw beef and lamb (can be consumed with less cooking)'],
            ['Bottom shelf', 'Raw poultry, raw minced meat, raw fish and seafood (highest risk — always covered)'],
          ].map(([shelf, items]) => (
            <div key={shelf as string} className="flex gap-3 p-3 rounded-lg bg-gray-50 text-sm">
              <span className="font-semibold text-hospopilot-ink w-28 shrink-0">{shelf}</span>
              <span className="text-gray-600">{items}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" /> Good storage habits
        </h2>
        <ul className="space-y-3">
          {[
            'Check and log fridge temperatures at the start of every service.',
            'Never overfill a fridge — air must circulate to maintain temperature.',
            'Cover all food in the fridge with lids or cling film.',
            'Label everything with the date opened and use-by date.',
            'Follow FIFO (First In, First Out) — always use older stock first.',
            'Never put hot food directly into the fridge — cool it first (within 90 minutes).',
            'Keep fridge doors closed as much as possible.',
            'Clean and sanitise fridge shelves and door seals weekly.',
          ].map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              {tip}
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
