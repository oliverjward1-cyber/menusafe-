import Link from 'next/link'
import { ChevronLeft, Thermometer, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default function CookingTempsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/learn" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Learning Hub
        </Link>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <Thermometer className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kitchen Team</p>
          <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Cooking Temperatures</h1>
          <p className="text-sm text-gray-500 mt-1">Safe minimum core temperatures to destroy harmful bacteria in food.</p>
        </div>
      </div>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-3">Why temperature matters</h2>
        <p className="text-sm text-gray-600 leading-relaxed">Bacteria such as Salmonella, Campylobacter, and E. coli are destroyed when food reaches a high enough core temperature. The core temperature is the temperature at the thickest part of the food — the outside can look cooked while the inside is still dangerous.</p>
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4">Minimum core temperatures (UK)</h2>
        <div className="space-y-2">
          {[
            ['🍗', 'Poultry (chicken, turkey, duck)', '75°C', 'Highest risk — always probe the thickest part, avoid pink juices'],
            ['🥩', 'Whole cuts of beef & lamb', '63°C', 'Steaks can be served pink if surface-seared; mince must reach 75°C'],
            ['🐷', 'Pork & pork products', '75°C', 'Including sausages and burgers — no pink allowed'],
            ['🐟', 'Fish', '63°C', 'Flesh should be opaque and flake easily'],
            ['🦐', 'Shellfish & crustaceans', '75°C', 'Should be piping hot throughout'],
            ['🥚', 'Egg dishes', '75°C', 'Scrambled, omelette, quiche — yolk and white fully set unless sous vide with controls'],
            ['♨️', 'Reheated food', '75°C', 'Must reach 75°C throughout and only be reheated once'],
            ['🍲', 'Soups, sauces, gravies', '75°C', 'Bring to a rolling boil then hold above 63°C'],
          ].map(([emoji, food, temp, note]) => (
            <div key={food as string} className="flex gap-3 p-3 rounded-xl bg-gray-50 items-start">
              <span className="text-xl">{emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-hospopilot-ink text-sm">{food}</p>
                  <span className="text-lg font-bold text-orange-600 whitespace-nowrap">{temp}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" /> Probing rules
        </h2>
        <ul className="space-y-3">
          {[
            'Sanitise the probe before and after every use with a probe wipe or hot soapy water.',
            'Insert the probe into the thickest part of the food, away from bone.',
            'Wait for the reading to stabilise — at least 5 seconds.',
            'Log probe readings for high-risk items in your temperature records.',
            'If the food has not reached the required temperature, return it to the heat immediately.',
            'Calibrate your probe regularly — check it reads 0°C in iced water and 100°C in boiling water.',
          ].map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" /> The danger zone
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">Bacteria multiply rapidly between <strong>8°C and 63°C</strong> — this is known as the danger zone. Food should pass through this range as quickly as possible. Hot food must be held above 63°C and cold food below 8°C (ideally below 5°C).</p>
      </Card>
      <div className="flex justify-end">
        <Link href="/owner/learn" className="text-sm text-hospopilot-mid font-medium hover:underline flex items-center gap-1">
          Back to Learning Hub <ChevronLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </div>
  )
}
