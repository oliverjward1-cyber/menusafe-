import Link from 'next/link'
import { ChevronLeft, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default function KitchenAllergensPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/learn" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Learning Hub
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kitchen Team</p>
          <h1 className="text-2xl font-display font-semibold text-mise-ink">Kitchen Allergen Management</h1>
          <p className="text-sm text-gray-500 mt-1">How to handle allergen ingredients, label dishes, and prevent allergic reactions.</p>
        </div>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-mise-ink mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-red-500" /> Why this matters
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Allergic reactions can be life-threatening. As kitchen staff, you are the last line of defence. 
          A customer with a severe allergy trusts that the dish they ordered is safe. Under UK law 
          (the Food Information Regulations 2014 and Natasha's Law 2021), businesses have a legal duty 
          to provide accurate allergen information. Getting it wrong can kill — and carries criminal liability.
        </p>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-mise-ink mb-4">The 14 Major Allergens</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ['🌾','Cereals containing gluten','Wheat, rye, barley, oats'],
            ['🦐','Crustaceans','Prawns, crab, lobster'],
            ['🥚','Eggs','Whole egg, yolk, white'],
            ['🐟','Fish','All fish species'],
            ['🥜','Peanuts','Ground nuts, monkey nuts'],
            ['🌱','Soybeans','Tofu, soya sauce, miso'],
            ['🥛','Milk','Butter, cream, cheese, yoghurt'],
            ['🌰','Tree Nuts','Almonds, cashews, walnuts etc.'],
            ['🌿','Celery','Stalk, leaves, seeds, celeriac'],
            ['🟡','Mustard','Seeds, powder, condiment'],
            ['🌾','Sesame','Seeds, tahini, oil'],
            ['🍷','Sulphites','Wine, dried fruit, vinegar'],
            ['🌸','Lupin','Flour, seeds — often in gluten-free'],
            ['🦑','Molluscs','Squid, mussels, oysters, snails'],
          ].map(([emoji, name, examples]) => (
            <div key={name} className="flex gap-2 p-2 rounded-lg bg-gray-50">
              <span className="text-lg">{emoji}</span>
              <div>
                <p className="font-medium text-mise-ink text-xs">{name}</p>
                <p className="text-gray-500 text-xs">{examples}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-mise-ink mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" /> Safe preparation rules
        </h2>
        <ul className="space-y-3">
          {[
            'Always check the allergen information for every ingredient, including sauces and condiments.',
            'Use dedicated equipment (pans, utensils, boards) for allergen-free dishes — never reuse without washing.',
            'Wash hands thoroughly before preparing an allergen-free dish.',
            'Change gloves and apron if you have been handling allergen ingredients.',
            'Prepare allergen-free dishes on a clean surface, ideally first thing before the station is used.',
            'Never use the same oil that has been used to cook allergen-containing food.',
            'If in doubt, ask your supervisor before cooking the dish.',
            'Never "pick out" an allergen from a finished dish — the whole dish must be remade.',
          ].map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-mise-ink mb-4 flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" /> Never do this
        </h2>
        <ul className="space-y-3">
          {[
            'Never guess whether a dish contains an allergen — check the recipe.',
            'Never tell FOH "it should be fine" without being certain.',
            'Never modify an allergen-free order without telling the customer.',
            'Never use shared tongs, spoons, or fryer baskets without washing first.',
            'Never prepare an allergen-free dish on an unwashed surface.',
          ].map((rule, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              {rule}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-mise-ink mb-3">Communication with FOH</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-mise-mid font-bold">→</span> When an allergen-free dish leaves the pass, call it out clearly so FOH knows.</li>
          <li className="flex gap-2"><span className="text-mise-mid font-bold">→</span> Use a different coloured plate cover or flag to identify allergen-free dishes.</li>
          <li className="flex gap-2"><span className="text-mise-mid font-bold">→</span> If you cannot safely prepare an allergen-free version, tell FOH immediately so they can inform the customer — never stay silent.</li>
          <li className="flex gap-2"><span className="text-mise-mid font-bold">→</span> Log any allergen-free orders in the kitchen ticket system or order book for traceability.</li>
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
