import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { menuId } = await req.json()
  if (!menuId) return NextResponse.json({ error: 'menuId required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    : { data: null }
  const rid = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value
  if (!rid) return NextResponse.json({ error: 'No restaurant found' }, { status: 400 })

  const { data: menu } = await supabase
    .from('menus')
    .select('*, menu_recipes(recipe_id)')
    .eq('id', menuId)
    .single()

  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  const { data: newMenu, error } = await supabase
    .from('menus')
    .insert({
      restaurant_id: rid,
      name: `${menu.name} (copy)`,
      description: menu.description,
      daypart: menu.daypart,
      is_published: false,
    })
    .select('id')
    .single()

  if (error || !newMenu) return NextResponse.json({ error: error?.message ?? 'Failed to duplicate' }, { status: 500 })

  if (menu.menu_recipes?.length > 0) {
    await supabase.from('menu_recipes').insert(
      menu.menu_recipes.map((mr: any) => ({
        menu_id: newMenu.id,
        recipe_id: mr.recipe_id,
      }))
    )
  }

  return NextResponse.json({ id: newMenu.id })
}
