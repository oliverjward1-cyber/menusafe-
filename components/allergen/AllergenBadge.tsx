import { cn } from '@/lib/utils'
import { ALLERGENS, type AllergenKey } from '@/lib/constants/allergens'

const ALLERGEN_ICONS: Record<AllergenKey, string> = {
  allergen_celery: 'C',
  allergen_cereals_gluten: 'G',
  allergen_crustaceans: 'Cr',
  allergen_eggs: 'E',
  allergen_fish: 'F',
  allergen_lupin: 'L',
  allergen_milk: 'M',
  allergen_molluscs: 'Mo',
  allergen_mustard: 'Mu',
  allergen_nuts: 'N',
  allergen_peanuts: 'P',
  allergen_sesame: 'Se',
  allergen_soya: 'So',
  allergen_sulphites: 'Su',
}

interface AllergenBadgeProps {
  allergenKey: AllergenKey
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export function AllergenBadge({
  allergenKey,
  size = 'md',
  showLabel = false,
}: AllergenBadgeProps) {
  const allergen = ALLERGENS.find((a) => a.key === allergenKey)
  if (!allergen) return null

  return (
    <span
      title={allergen.label}
      className={cn(
        'inline-flex items-center justify-center rounded font-semibold bg-amber-100 text-amber-800 border border-amber-300',
        size === 'sm' && 'h-5 min-w-[20px] px-1 text-[10px]',
        size === 'md' && 'h-6 min-w-[24px] px-1.5 text-xs'
      )}
    >
      {ALLERGEN_ICONS[allergenKey]}
      {showLabel && <span className="ml-1">{allergen.shortLabel}</span>}
    </span>
  )
}
