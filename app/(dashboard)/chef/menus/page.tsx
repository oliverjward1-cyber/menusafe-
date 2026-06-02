import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Plus, BookOpen, Globe, GlobeLock, Pencil, QrCode, Eye } from 'lucide-react'
import { PublishToggle } from './PublishToggle'
import { DuplicateMenuButton } from './DuplicateMenuButton'

const DAYPART_LABELS: Record<string, string> = {
  'all-day': 'All day',
  lunch: 'Lunch',
  dinner: 'Dinner',
  brunch: 'Brunch',
  specials: 'Specials',
}

export default async function MenusPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    : { data: null }

  const rid = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value

  const { data: restaurant } = rid
    ? await supabase.from('restaurants').select('slug').eq('id', rid).single()
    : { data: null }

  const { data: menus } = rid
    ? await supabase
        .from('menus')
        .select('id, name, description, daypart, is_published, created_at, menu_recipes(count)')
        .eq('restaurant_id', rid)
        .order('created_at', { ascending: false })
    : { data: [] }

  const menuUrl = restaurant?.slug ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/menu/${restaurant.slug}` : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
          <p className="text-gray-500 mt-1">{menus?.length ?? 0} menu{menus?.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/chef/menus/new"
          className="inline-flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Create menu
        </Link>
      </div>

      {menuUrl && (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your customer menu URL</p>
              <p className="text-sm font-mono text-green-800 break-all">{menuUrl}</p>
              <p className="text-xs text-gray-400 mt-1">Share this link or display the QR code on your tables. Customers see all published menus.</p>
            </div>
            <Link
              href={`/chef/menus/qr`}
              className="shrink-0 inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <QrCode className="h-4 w-4" /> QR code
            </Link>
          </div>
        </Card>
      )}

      {!menus || menus.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-200" />
            <h2 className="text-base font-semibold text-gray-900 mb-1">No menus yet</h2>
            <p className="text-sm text-gray-500 mb-4">
              Create a menu, add your recipes, then publish it for customers to view.
            </p>
            <Link
              href="/chef/menus/new"
              className="inline-flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create your first menu
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {menus.map((menu) => {
            const count = (menu.menu_recipes as any)?.[0]?.count ?? 0
            return (
              <Card key={menu.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-gray-900">{menu.name}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {DAYPART_LABELS[menu.daypart] ?? menu.daypart}
                      </span>
                      {menu.is_published ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                          <Globe className="h-3 w-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          <GlobeLock className="h-3 w-3" /> Draft
                        </span>
                      )}
                    </div>
                    {menu.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{menu.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{count} dish{count !== 1 ? 'es' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <Link
                      href={`/chef/menus/${menu.id}/preview`}
                      className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </Link>
                    <DuplicateMenuButton menuId={menu.id} />
                    <PublishToggle menuId={menu.id} isPublished={menu.is_published} />
                    <Link
                      href={`/chef/menus/${menu.id}`}
                      className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
