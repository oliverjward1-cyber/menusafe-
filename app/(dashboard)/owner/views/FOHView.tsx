import Link from 'next/link'
import { Search, BookOpen, Scale, MessageCircle, ArrowRight } from 'lucide-react'
import { ALLERGENS } from '@/lib/constants/allergens'
import { AllergenBadge } from '@/components/allergen/AllergenBadge'

export default function FOHView({ data }: { data: any }) {
  const { recipes, menus } = data

  const publishedMenuRecipes = menus
    .filter((m: any) => m.is_published)
    .flatMap((m: any) => m.recipes ?? [])

  const approvedRecipes = recipes
    .filter((r: any) => r.status === 'approved')

  const displayDishes = publishedMenuRecipes.length > 0 ? publishedMenuRecipes : approvedRecipes

  function getDishAllergens(recipe: any): string[] {
    if (recipe.declared_allergens?.length > 0 && !recipe.recipe_ingredients?.length) {
      return recipe.declared_allergens
    }
    return ALLERGENS
      .filter(a => recipe.recipe_ingredients?.some((ri: any) => ri.ingredients?.[a.key]))
      .map(a => a.key)
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-xs text-green-800 font-medium">
        🛎️ Front of House view — allergen lookup & customer communication
      </div>

      {/* Owen's Law notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-1">
          <Scale className="h-4 w-4" /> Owen's Law — coming soon
        </p>
        <p className="text-xs text-blue-700 leading-relaxed">
          Proposed legislation will require written allergen information on every menu item. This restaurant's allergen matrix and QR menu already put you ahead of the law. All FOH staff should complete the law modules in the learning hub.
        </p>
        <Link href="/owner/learn/owens-law" className="text-xs text-blue-600 font-semibold mt-2 inline-flex items-center gap-1 hover:underline">
          Learn about Owen's Law <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Allergen lookup by dish */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
        <p className="text-sm font-semibold text-mise-ink mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-mise-mid" /> Allergen lookup — {displayDishes.length} dishes
        </p>
        {displayDishes.length === 0 ? (
          <p className="text-xs text-mise-ink/40">No published dishes yet — approve recipes and publish a menu first.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {displayDishes.slice(0, 20).map((dish: any) => {
              const allergens = getDishAllergens(dish)
              return (
                <div key={dish.id} className="border-b border-black/[0.04] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-mise-ink">{dish.name}</p>
                    {dish.sell_price && (
                      <p className="text-xs text-mise-ink/40 flex-shrink-0">£{(dish.sell_price / 100).toFixed(2)}</p>
                    )}
                  </div>
                  {allergens.length === 0 ? (
                    <p className="text-xs text-green-600 mt-1 font-medium">✓ No declared allergens</p>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {allergens.map(key => (
                        <AllergenBadge key={key} allergenKey={key as any} size="sm" />
                      ))}
                    </div>
                  )}
                  {dish.may_contain_allergens?.length > 0 && (
                    <p className="text-xs text-amber-600 mt-1">May contain: {dish.may_contain_allergens.join(', ')}</p>
                  )}
                </div>
              )
            })}
            {displayDishes.length > 20 && (
              <p className="text-xs text-mise-ink/30 pt-1">Showing 20 of {displayDishes.length} dishes</p>
            )}
          </div>
        )}
      </div>

      {/* FOH communication card */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
        <p className="text-sm font-semibold text-mise-ink mb-3 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-mise-mid" /> When a customer declares an allergy
        </p>
        <ol className="space-y-2">
          {[
            { step: '1', text: 'Stop and listen — take every allergy seriously, no matter how minor it seems' },
            { step: '2', text: 'Check the allergen matrix for the dish they want — don\'t rely on memory' },
            { step: '3', text: 'Go to the kitchen and speak directly to the chef — don\'t relay complex info through others' },
            { step: '4', text: 'Flag the allergy in writing on the order ticket' },
            { step: '5', text: 'Return to the table and confirm what steps were taken before serving' },
            { step: '⚠️', text: 'If in doubt, suggest a safe alternative — never say "it should be fine"' },
          ].map(({ step, text }) => (
            <li key={step} className="flex items-start gap-3 text-xs text-mise-ink/70">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-mise-mid/10 text-mise-mid font-bold flex items-center justify-center text-xs">{step}</span>
              {text}
            </li>
          ))}
        </ol>
      </div>

      {/* Law modules */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
        <p className="text-sm font-semibold text-mise-ink mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-mise-mid" /> FOH learning modules
        </p>
        <div className="space-y-2">
          {[
            { slug: 'natashas-law', emoji: '🏷️', name: "Natasha's Law", desc: 'Labelling requirements for prepacked food' },
            { slug: 'owens-law', emoji: '📋', name: "Owen's Law", desc: 'Written allergen info on restaurant menus' },
            { slug: 'customer-communication', emoji: '💬', name: 'Customer communication', desc: 'What to say and when to escalate' },
          ].map(mod => (
            <Link key={mod.slug} href={`/owner/learn/${mod.slug}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-mise-mid/5 hover:border-mise-mid/20 border border-transparent transition-all">
              <span className="text-xl">{mod.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-mise-ink">{mod.name}</p>
                <p className="text-xs text-mise-ink/40 truncate">{mod.desc}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-mise-ink/20 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
