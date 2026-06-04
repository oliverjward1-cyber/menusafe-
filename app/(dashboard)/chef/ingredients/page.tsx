import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { AllergenBadge } from '@/components/allergen/AllergenBadge'
import { ALLERGENS } from '@/lib/constants/allergens'
import { formatCurrency } from '@/lib/utils'
import { Plus, Package, Upload, Pencil, Camera, Thermometer, Box, Snowflake } from 'lucide-react'
import { CategoriseButton } from './CategoriseButton'

const STORAGE_GROUPS = [
  { key: 'chilled', label: 'Chilled', icon: Thermometer, colour: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { key: 'ambient', label: 'Ambient', icon: Box, colour: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  { key: 'frozen', label: 'Frozen', icon: Snowflake, colour: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
] as const

export default async function IngredientsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  const { data: ingredients } = await supabase
    .from('ingredients').select('*')
    .eq('restaurant_id', profile?.restaurant_id ?? '')
    .order('name')

  const grouped = Object.fromEntries(
    STORAGE_GROUPS.map(g => [g.key, (ingredients ?? []).filter(i => (i.storage_type ?? 'ambient') === g.key)])
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-mise-ink">Ingredients</h1>
          <p className="text-mise-ink/50 mt-1">
            {ingredients?.length ?? 0} ingredient{ingredients?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(ingredients?.length ?? 0) > 0 && <CategoriseButton />}
          <Link
            href="/chef/ingredients/scan"
            className="inline-flex items-center gap-2 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
          >
            <Camera className="h-4 w-4" />
            Scan invoice
          </Link>
          <Link
            href="/chef/ingredients/upload"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload sheet
          </Link>
          <Link
            href="/chef/ingredients/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add ingredient
          </Link>
        </div>
      </div>

      {!ingredients || ingredients.length === 0 ? (
        <Card className="text-center py-16">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-2">No ingredients yet</h3>
          <p className="text-sm text-gray-500 mb-6">Add your first ingredient to start building recipes.</p>
          <Link href="/chef/ingredients/new" className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
            <Plus className="h-4 w-4" /> Add ingredient
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {STORAGE_GROUPS.map(({ key, label, icon: Icon, colour, bg, border }) => {
            const items = grouped[key]
            return (
              <div key={key} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                <div className={`px-5 py-3 border-b ${border} ${bg} flex items-center gap-2`}>
                  <Icon className={`h-4 w-4 ${colour}`} />
                  <h2 className={`text-sm font-semibold ${colour}`}>{label}</h2>
                  <span className="ml-auto text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>
                {items.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-mise-ink/30 italic">No {label.toLowerCase()} ingredients</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Name</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Cost / unit</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Unit</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Allergens</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {items.map(ing => {
                          const presentAllergens = ALLERGENS.filter(a => ing[a.key])
                          return (
                            <tr key={ing.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 font-medium text-gray-900">{ing.name}</td>
                              <td className="px-4 py-3 text-gray-600">{formatCurrency(ing.cost_per_unit)}</td>
                              <td className="px-4 py-3 text-gray-600">{ing.unit_type}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {presentAllergens.length > 0
                                    ? presentAllergens.map(a => <AllergenBadge key={a.key} allergenKey={a.key} size="sm" />)
                                    : <span className="text-gray-400 text-xs">None</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Link href={`/chef/ingredients/${ing.id}/edit`} className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" aria-label={`Edit ${ing.name}`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
