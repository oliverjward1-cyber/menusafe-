import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, QrCode, TableProperties, Eye } from 'lucide-react'
import { MenuEditor } from './MenuEditor'

interface Props { params: { id: string } }

export default async function MenuEditPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    : { data: null }
  const rid = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value

  const { data: menu } = await supabase
    .from('menus')
    .select('id, name, description, daypart, is_published')
    .eq('id', params.id)
    .single()

  if (!menu) notFound()

  // All recipes for this restaurant
  const { data: allRecipes } = await supabase
    .from('recipes')
    .select(`
      id, name, category, sell_price, status, is_active,
      recipe_ingredients (
        quantity, unit_type,
        ingredients ( cost_per_unit, unit_type )
      )
    `)
    .eq('restaurant_id', rid ?? '')
    .eq('status', 'approved')
    .order('category')

  // Recipes already in this menu
  const { data: menuRecipes } = await supabase
    .from('menu_recipes')
    .select('recipe_id')
    .eq('menu_id', params.id)

  const { data: restaurant } = rid
    ? await supabase.from('restaurants').select('slug').eq('id', rid).single()
    : { data: null }

  const menuUrl = restaurant?.slug
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/menu/${restaurant.slug}`
    : null

  const selectedIds = new Set((menuRecipes ?? []).map(r => r.recipe_id))

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/chef/menus" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{menu.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/chef/menus/${params.id}/preview`}
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-4 w-4" /> Preview
          </Link>
          <Link
            href={`/chef/menus/${params.id}/allergens`}
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <TableProperties className="h-4 w-4" /> Allergen matrix
          </Link>
          <Link
            href="/chef/menus/qr"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <QrCode className="h-4 w-4" /> QR code
          </Link>
        </div>
      </div>

      <MenuEditor
        menuId={params.id}
        menuName={menu.name}
        menuDescription={menu.description}
        menuDaypart={menu.daypart}
        isPublished={menu.is_published}
        allRecipes={(allRecipes ?? []) as any}
        initialSelectedIds={Array.from(selectedIds)}
        menuUrl={menuUrl}
      />
    </div>
  )
}
