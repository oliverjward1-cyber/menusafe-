import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { QRDisplay } from './QRDisplay'

export default async function QRPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    : { data: null }
  const rid = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value

  const { data: restaurant } = rid
    ? await supabase.from('restaurants').select('name, slug').eq('id', rid).single()
    : { data: null }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yourdomain.com'
  const menuUrl = restaurant?.slug ? `${siteUrl}/menu/${restaurant.slug}` : null

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/chef/menus" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">QR code for tables</h1>
        </div>
        {menuUrl && (
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-hospopilot-mid text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-hospopilot-deep transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Preview live menu
          </a>
        )}
      </div>

      <QRDisplay
        menuUrl={menuUrl}
        restaurantName={restaurant?.name ?? 'Your Restaurant'}
      />
    </div>
  )
}
