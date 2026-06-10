import Link from 'next/link'
import { ChevronLeft, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default function KitchenPracticesPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/learn" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Learning Hub
        </Link>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kitchen Team</p>
          <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">General Kitchen Practices</h1>
          <p className="text-sm text-gray-500 mt-1">The everyday habits that keep your kitchen safe, legal, and running well.</p>
        </div>
      </div>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" /> Personal hygiene
        </h2>
        <ul className="space-y-3">
          {[
            'Wash hands thoroughly for at least 20 seconds: before handling food, after handling raw meat, after using the toilet, after touching your face or hair, and after handling waste.',
            'Wear clean uniform or chef whites at the start of every shift.',
            'Tie long hair back and wear a hair net when required.',
            'Remove jewellery including rings, watches, and earrings before handling food.',
            'Cover all cuts and wounds with a brightly coloured (blue) waterproof plaster.',
            'Do not handle food if you have symptoms of illness (vomiting, diarrhoea) — report to your supervisor immediately.',
            'Do not eat, drink (except water), chew gum, or smoke in food preparation areas.',
          ].map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4">FIFO — Stock rotation</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">FIFO stands for <strong>First In, First Out</strong>. It means the oldest stock is always used first.</p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-hospopilot-mid font-bold">→</span> When new deliveries arrive, move older stock to the front.</li>
          <li className="flex gap-2"><span className="text-hospopilot-mid font-bold">→</span> Label all food with the delivery date and use-by date.</li>
          <li className="flex gap-2"><span className="text-hospopilot-mid font-bold">→</span> Check use-by dates daily and remove anything expired immediately.</li>
          <li className="flex gap-2"><span className="text-hospopilot-mid font-bold">→</span> Never mix old and new stock in the same container without labelling.</li>
        </ul>
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4">Cleaning schedule</h2>
        <div className="space-y-2 text-sm">
          {[
            ['As you go', 'Wipe down surfaces, clean spills immediately, sanitise boards between tasks'],
            ['After each service', 'Deep clean all surfaces, equipment, and floors; empty and clean bins'],
            ['Daily', 'Clean and sanitise fridges, ovens, fryers, and grills; degrease hob and extraction'],
            ['Weekly', 'Deep clean fridge interiors, shelves, and seals; descale equipment'],
            ['Monthly', 'Clean behind and under all equipment; check for pest activity'],
          ].map(([when, what]) => (
            <div key={when as string} className="flex gap-3 p-3 rounded-lg bg-gray-50">
              <span className="font-semibold text-hospopilot-ink w-28 shrink-0">{when}</span>
              <span className="text-gray-600">{what}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4">Waste management</h2>
        <ul className="space-y-3">
          {[
            'Empty food waste bins regularly — never let them overflow.',
            'Keep bin lids closed at all times to deter pests.',
            'Use separate bins for food waste, recyclables, and general waste.',
            'Clean and sanitise bins regularly including the exterior.',
            'Never store waste bins near food preparation areas.',
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
