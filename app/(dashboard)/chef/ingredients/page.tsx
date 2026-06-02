import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { AllergenBadge } from '@/components/allergen/AllergenBadge'
import { ALLERGENS } from '@/lib/constants/allergens'
import { formatCurrency } from '@/lib/utils'
import { Plus, Package, Upload, Pencil } from 'lucide-react'

export default async function IngredientsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')
    .eq('restaurant_id', profile?.restaurant_id ?? '')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingredients</h1>
          <p className="text-gray-500 mt-1">
            {ingredients?.length ?? 0} ingredient{ingredients?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/chef/ingredients/upload"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload costing sheet
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
          <p className="text-sm text-gray-500 mb-6">
            Add your first ingredient to start building recipes.
          </p>
          <Link
            href="/chef/ingredients/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add ingredient
          </Link>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cost / unit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Allergens</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ingredients.map((ing) => {
                  const presentAllergens = ALLERGENS.filter((a) => ing[a.key])
                  return (
                    <tr key={ing.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{ing.name}</td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(ing.cost_per_unit)}</td>
                      <td className="px-4 py-3 text-gray-600">{ing.unit_type}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {presentAllergens.length > 0 ? (
                            presentAllergens.map((a) => (
                              <AllergenBadge key={a.key} allergenKey={a.key} size="sm" />
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/chef/ingredients/${ing.id}/edit`}
                          className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label={`Edit ${ing.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
