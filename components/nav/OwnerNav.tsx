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
  Tablet,
  FlaskConical,
  Grid3x3,
} from 'lucide-react'
import { MiseLogo } from '@/components/MiseLogo'

function NavSection({ label, items, pathname }: { label: string; items: { href: string; label: string; icon: any }[]; pathname: string }) {
  return (
    <div>
      <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', active ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
            <Icon className="h-4 w-4" />{label}
          </Link>
        )
      })}
    </div>
  )
}

export function OwnerNav({ restaurantName, restaurantSlug }: { restaurantName: string; restaurantSlug: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const dashboardActive = pathname === '/owner'

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <Link href="/owner"><MiseLogo className="mb-2" /></Link>
        <p className="text-xs text-gray-400 truncate">{restaurantName}</p>
        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs bg-mise-gold/20 text-mise-gold">
          Owner
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Dashboard */}
        <div>
          <Link href="/owner" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', dashboardActive ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
        </div>

        <NavSection label="People" pathname={pathname} items={[
          { href: '/owner/team', label: 'Team', icon: Users2 },
          { href: '/owner/kitchen-settings', label: 'Kitchen Portal', icon: Tablet },
          { href: '/owner/staff-quiz', label: 'Staff Quiz', icon: Users },
        ]} />

        <NavSection label="Menu" pathname={pathname} items={[
          { href: '/chef/ingredients', label: 'Ingredients', icon: Package },
          { href: '/chef/recipes', label: 'Recipes', icon: BookOpen },
          { href: '/chef/menus', label: 'Menus', icon: MenuSquare },
          { href: '/owner/qr-menu', label: 'QR Menu', icon: QrCode },
          { href: '/owner/allergen-matrix', label: 'Allergen Matrix', icon: Grid3x3 },
        ]} />

        <NavSection label="Training" pathname={pathname} items={[
          { href: '/owner/learn', label: 'Learning Hub', icon: BookOpen },
          { href: '/owner/quiz-questions', label: 'Quiz Questions', icon: GraduationCap },
        ]} />

        <NavSection label="Daily Ops" pathname={pathname} items={[
          { href: '/owner/temperature-logs', label: 'Temp Logs', icon: Thermometer },
          { href: '/owner/cleaning', label: 'Cleaning', icon: Sparkles },
          { href: '/owner/deliveries', label: 'Deliveries', icon: Truck },
        ]} />

        <NavSection label="Incidents & Audit" pathname={pathname} items={[
          { href: '/owner/incidents', label: 'Incidents', icon: AlertOctagon },
          { href: '/chef/audit', label: 'Kitchen Audit', icon: ClipboardCheck },
          { href: '/owner/haccp', label: 'HACCP & Calibration', icon: FlaskConical },
          { href: '/owner/audit-questions', label: 'Audit Questions', icon: ClipboardList },
        ]} />

        {/* EHO Mode — standalone prominent link */}
        <div>
          <Link href="/owner/eho" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-green-900/50 border border-green-700/30', pathname.startsWith('/owner/eho') ? 'text-white' : 'text-green-300 hover:bg-green-900/70 hover:text-white')}>
            <ShieldCheck className="h-4 w-4" /> EHO Mode
          </Link>
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
