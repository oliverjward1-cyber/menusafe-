'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  Users2,
  QrCode,
  LogOut,
  Package,
  BookOpen,
  MenuSquare,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Thermometer,
  Sparkles,
  Truck,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react'
import { MiseLogo } from '@/components/MiseLogo'

const navItems = [
  { href: '/owner', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/chef/ingredients', label: 'Ingredients', icon: Package },
  { href: '/chef/recipes', label: 'Recipes', icon: BookOpen },
  { href: '/chef/menus', label: 'Menus', icon: MenuSquare },
  { href: '/chef/audit', label: 'Kitchen Audit', icon: ClipboardCheck },
  { href: '/owner/staff-quiz', label: 'Staff Quiz', icon: Users },
  { href: '/owner/qr-menu', label: 'QR Menu', icon: QrCode },
  { href: '/owner/audit-questions', label: 'Audit Questions', icon: ClipboardList },
  { href: '/owner/quiz-questions', label: 'Quiz Questions', icon: GraduationCap },
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
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <Link href="/owner"><MiseLogo className="mb-2" /></Link>
        <p className="text-xs text-gray-400 truncate">{restaurantName}</p>
        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs bg-mise-gold/20 text-mise-gold">
          Owner
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-4">
        {/* Dashboard */}
        <div>
          {[{ href: '/owner', label: 'Dashboard', icon: LayoutDashboard, exact: true }].map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', active ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            )
          })}
        </div>

        {/* People */}
        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">People</p>
          {[
            { href: '/owner/team', label: 'Team', icon: Users2 },
          ].map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', active ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            )
          })}
        </div>

        {/* Food */}
        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">Food</p>
          {[
            { href: '/chef/ingredients', label: 'Ingredients', icon: Package },
            { href: '/chef/recipes', label: 'Recipes', icon: BookOpen },
            { href: '/chef/menus', label: 'Menus', icon: MenuSquare },
            { href: '/owner/qr-menu', label: 'QR Menu', icon: QrCode },
            { href: '/chef/audit', label: 'Kitchen Audit', icon: ClipboardCheck },
            { href: '/owner/audit-questions', label: 'Audit Questions', icon: ClipboardList },
          ].map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', active ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            )
          })}
        </div>

        {/* Allergens */}
        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">Allergens</p>
          {[
            { href: '/owner/staff-quiz', label: 'Staff Quiz', icon: Users },
            { href: '/owner/quiz-questions', label: 'Quiz Questions', icon: GraduationCap },
          ].map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', active ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            )
          })}
        </div>

        {/* Compliance */}
        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">Compliance</p>
          {[
            { href: '/owner/temperature-logs', label: 'Temp Logs', icon: Thermometer },
            { href: '/owner/cleaning', label: 'Cleaning', icon: Sparkles },
            { href: '/owner/deliveries', label: 'Deliveries', icon: Truck },
            { href: '/owner/incidents', label: 'Incidents', icon: AlertOctagon },
            { href: '/owner/eho', label: 'EHO Mode', icon: ShieldCheck },
          ].map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', active ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            )
          })}
        </div>
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
