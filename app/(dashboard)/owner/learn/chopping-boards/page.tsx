import Link from 'next/link'
import { ChevronLeft, Scissors, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const BOARDS = [
  { colour: 'bg-red-500', label: 'Red', uses: 'Raw meat (beef, pork, lamb)', avoid: 'Never use for poultry, fish, or any ready-to-eat food' },
  { colour: 'bg-yellow-400', label: 'Yellow', uses: 'Raw poultry (chicken, turkey, duck)', avoid: 'Never use for other meats or ready-to-eat food' },
  { colour: 'bg-blue-500', label: 'Blue', uses: 'Raw fish and seafood', avoid: 'Never use for meat or ready-to-eat food' },
  { colour: 'bg-green-500', label: 'Green', uses: 'Salad, fruit, and raw vegetables', avoid: 'Never use after raw proteins without full wash and sanitise' },
  { colour: 'bg-white border border-gray-300', label: 'White', uses: 'Dairy, bread, and bakery products', avoid: 'Never use for raw proteins' },
  { colour: 'bg-amber-800', label: 'Brown', uses: 'Root vegetables and unwashed produce', avoid: 'Never use for ready-to-eat food' },
]

export default function ChoppingBoardsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/learn" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Learning Hub
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
          <Scissors className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kitchen Team</p>
          <h1 className="text-2xl font-display font-semibold text-mise-ink">Chopping Board Colour Codes</h1>
          <p className="text-sm text-gray-500 mt-1">The UK standard colour system for preventing cross contamination between food types.</p>
        </div>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-mise-ink mb-3">Why colour-coded boards?</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Using dedicated colour-coded boards for different food types is a key control measure under HACCP. It prevents harmful bacteria (such as Salmonella from raw chicken or E. coli from raw beef) transferring to ready-to-eat food. It is a legal requirement to have controls in place to prevent cross contamination in a commercial kitchen.
        </p>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-mise-ink mb-4">The 6-colour system</h2>
        <div className="space-y-3">
          {BOARDS.map(({ colour, label, uses, avoid }) => (
            <div key={label} className="flex gap-4 items-start p-3 rounded-xl bg-gray-50">
              <div className={`w-10 h-10 rounded-lg flex-shrink-0 ${colour}`} />
              <div>
                <p className="font-semibold text-mise-ink text-sm">{label} board</p>
                <p className="text-sm text-gray-600 mt-0.5">✓ {uses}</p>
                <p className="text-xs text-red-500 mt-0.5">✗ {avoid}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-mise-ink mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" /> Maintenance rules
        </h2>
        <ul className="space-y-3">
          {[
            'Wash boards with hot soapy water and sanitise with food-safe sanitiser after every use.',
            'Replace boards that have deep score marks — bacteria can harbour in cuts and cannot be removed by cleaning.',
            'Never soak wooden boards — use plastic boards in a commercial kitchen as they are easier to sanitise.',
            'Store boards upright so they can dry completely — flat stacking encourages moisture and bacterial growth.',
            'Label boards clearly if the colour is faded — replace them.',
            'Knives should also follow the same colour-coding system as boards.',
          ].map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-end">
        <Link href="/owner/learn" className="text-sm text-mise-mid font-medium hover:underline flex items-center gap-1">
          Back to Learning Hub <ChevronLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </div>
  )
}
