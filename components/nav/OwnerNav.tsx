'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  UtensilsCrossed,
  LayoutDashboard,
  ShieldCheck,
  Users,
  QrCode,
  LogOut,
  Package,
  BookOpen,
} from 'lucide-react'

const navItems = [
  { href: '/owner', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/chef/ingredients', label: 'Ingredients', icon: Package },
  { href: '/chef/recipes', label: 'Recipes', icon: BookOpen },
  { href: '/owner/allergen-matrix', label: 'Allergen Matrix', icon: ShieldCheck },
  { href: '/owner/staff-quiz', label: 'Staff Quiz', icon: Users },
  { href: '/owner/qr-menu', label: 'QR Menu', icon: QrCode },
]

export function OwnerNav({ restaurantName, restaurantSlug }: { restaurantName: string; restaurantSlug: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-full md:w-64 md:min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <UtensilsCrossed className="h-5 w-5 text-brand-400" />
          <span className="font-bold text-lg">MenuSafe</span>
        </div>
        <p className="text-xs text-gray-400 truncate">{restaurantName}</p>
        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs bg-blue-800 text-blue-200">
          Owner
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
