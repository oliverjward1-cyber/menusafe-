'use client'

import { useState } from 'react'
import { DishCard } from './DishCard'
import type { ALLERGENS } from '@/lib/constants/allergens'

type AllergenKey = (typeof ALLERGENS)[number]['key']

interface Dish {
  id: string
  name: string
  description?: string | null
  sellPrice?: number | null
  dishAllergens: AllergenKey[]
  ingredients: { name: string; allergens: AllergenKey[]; kcal?: number | null }[]
  kcalPerPortion?: number | null
  mayContain?: AllergenKey[]
}

interface Category {
  name: string
  dishes: Dish[]
}

interface Menu {
  id: string
  name: string
  description: string | null
  daypart: string
  categories: Category[]
}

const DAYPART_LABELS: Record<string, string> = {
  'all-day': 'All day',
  lunch: 'Lunch',
  dinner: 'Dinner',
  brunch: 'Brunch',
  specials: 'Specials',
}

export function MenuTabs({ menus }: { menus: Menu[] }) {
  const [activeId, setActiveId] = useState(menus[0]?.id ?? '')
  const active = menus.find(m => m.id === activeId) ?? menus[0]

  if (!active) return null

  return (
    <div>
      {/* Tab bar — only show if more than one menu */}
      {menus.length > 1 && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
              {menus.map(m => (
                <button
                  key={m.id}
                  onClick={() => setActiveId(m.id)}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    m.id === activeId
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {m.name}
                  {m.daypart !== 'all-day' && (
                    <span className={`ml-1.5 text-xs ${m.id === activeId ? 'text-gray-300' : 'text-gray-400'}`}>
                      {DAYPART_LABELS[m.daypart] ?? m.daypart}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {active.description && (
          <p className="text-gray-500 text-sm italic">{active.description}</p>
        )}

        {active.categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No dishes on this menu yet.</p>
          </div>
        ) : (
          active.categories.map(cat => (
            <section key={cat.name}>
              <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-200 mb-4">
                {cat.name}
              </h2>
              <div className="space-y-4">
                {cat.dishes.map(dish => (
                  <DishCard
                    key={dish.id}
                    id={dish.id}
                    name={dish.name}
                    description={dish.description}
                    sellPrice={dish.sellPrice}
                    dishAllergens={dish.dishAllergens}
                    ingredients={dish.ingredients}
                    kcalPerPortion={dish.kcalPerPortion}
                    mayContain={dish.mayContain}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
