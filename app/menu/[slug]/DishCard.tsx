'use client'

import { useState } from 'react'
import { X, Leaf, Flame } from 'lucide-react'
import { ALLERGENS } from '@/lib/constants/allergens'
import { formatCurrency } from '@/lib/utils'

type AllergenKey = (typeof ALLERGENS)[number]['key']

interface Ingredient {
  name: string
  allergens: AllergenKey[]
  kcal?: number | null
}

interface Props {
  id: string
  name: string
  description?: string | null
  sellPrice?: number | null
  dishAllergens: AllergenKey[]
  ingredients: Ingredient[]
  kcalPerPortion?: number | null
  mayContain?: AllergenKey[]
}

export function DishCard({ name, description, sellPrice, dishAllergens, ingredients, kcalPerPortion, mayContain = [] }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-sm transition-all active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            {sellPrice != null && (
              <p className="font-semibold text-gray-900">{formatCurrency(sellPrice)}</p>
            )}
            {kcalPerPortion != null && (
              <p className="text-xs text-gray-400 flex items-center justify-end gap-0.5 mt-0.5">
                <Flame className="h-3 w-3" />{kcalPerPortion} kcal
              </p>
            )}
          </div>
        </div>

        {dishAllergens.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1.5">Contains:</p>
            <div className="flex flex-wrap gap-1.5">
              {dishAllergens.map((key) => {
                const a = ALLERGENS.find((x) => x.key === key)!
                return (
                  <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
                    {a.shortLabel}
                  </span>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
            <Leaf className="h-3 w-3" /> No regulated allergens
          </p>
        )}

        {mayContain.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">May contain:</p>
            <div className="flex flex-wrap gap-1.5">
              {mayContain.map((key) => {
                const a = ALLERGENS.find((x) => x.key === key)!
                return (
                  <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs border border-orange-200">
                    {a.shortLabel}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">Tap to see full ingredients →</p>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex-1 pr-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{name}</h2>
                  {kcalPerPortion != null && (
                    <span className="shrink-0 flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <Flame className="h-4 w-4 text-orange-400" />{kcalPerPortion} kcal
                    </span>
                  )}
                </div>
                {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
              </div>
              <button onClick={() => setOpen(false)} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ingredients</h3>
                <div className="space-y-1">
                  {ingredients.length === 0 ? (
                    <p className="text-sm text-gray-400">No ingredient details available.</p>
                  ) : (
                    ingredients.map((ing) => (
                      <div key={ing.name} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-900">{ing.name}</span>
                        <div className="flex items-center gap-2">
                          {ing.allergens.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {ing.allergens.map((key) => {
                                const a = ALLERGENS.find((x) => x.key === key)!
                                return (
                                  <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
                                    {a.shortLabel}
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">This dish contains</h3>
                {dishAllergens.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {dishAllergens.map((key) => {
                      const a = ALLERGENS.find((x) => x.key === key)!
                      return (
                        <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium border border-amber-200" title={a.description}>
                          {a.label}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-green-700 flex items-center gap-1.5">
                    <Leaf className="h-4 w-4" /> No regulated allergens declared
                  </p>
                )}
              </div>

              {mayContain.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">May contain</h3>
                  <p className="text-xs text-gray-500 mb-2">Made in a kitchen where the following allergens are present:</p>
                  <div className="flex flex-wrap gap-2">
                    {mayContain.map((key) => {
                      const a = ALLERGENS.find((x) => x.key === key)!
                      return (
                        <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-800 text-sm font-medium border border-orange-200">
                          {a.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-400 leading-relaxed">
                Always inform staff of any allergies before ordering. Dishes may be prepared in an environment where allergens are present.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
