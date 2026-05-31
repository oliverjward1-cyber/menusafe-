'use client'

import { ALLERGENS, type AllergenKey } from '@/lib/constants/allergens'
import { cn } from '@/lib/utils'

interface AllergenSelectorProps {
  selected: Record<AllergenKey, boolean>
  onChange: (key: AllergenKey, value: boolean) => void
  disabled?: boolean
}

export function AllergenSelector({ selected, onChange, disabled }: AllergenSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">
        Allergens <span className="text-gray-500 font-normal">(UK FIR 2014 — 14 regulated allergens)</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALLERGENS.map((allergen) => (
          <label
            key={allergen.key}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
              selected[allergen.key]
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-200 bg-white hover:border-gray-300',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            <input
              type="checkbox"
              disabled={disabled}
              checked={selected[allergen.key] ?? false}
              onChange={(e) => onChange(allergen.key, e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{allergen.label}</p>
              <p className="text-xs text-gray-500">{allergen.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
