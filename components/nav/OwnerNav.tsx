'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
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
  ListChecks,
  BookMarked,
  GraduationCap,
  Thermometer,
  Sparkles,
  Truck,
  ShieldCheck,
  AlertOctagon,
  Tablet,
  FlaskConical,
  CreditCard,
  History,
  ChevronDown,
  ChevronRight,
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

function CollapsibleNavSection({ label, icon: SectionIcon, items, pathname }: {
  label: string
  icon: any
  items: { href: string; label: string; icon: any }[]
  pathname: string
}) {
  const isAnyActive = items.some(i => pathname.startsWith(i.href))
  const [open, setOpen] = useState(isAnyActive)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isAnyActive ? 'text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        )}
      >
        <SectionIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="ml-4 mt-0.5 pl-3 border-l border-gray-700 space-y-0.5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-mise-mid text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </Link>
            )
          })}
        </div>
      )}
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
          { href: '/owner/billing', label: 'Billing', icon: CreditCard },
        ]} />

        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">Kitchens</p>
          <CollapsibleNavSection
            label="Menus"
            icon={MenuSquare}
            pathname={pathname}
            items={[
              { href: '/chef/menus', label: 'Build Menu', icon: MenuSquare },
              { href: '/chef/recipes', label: 'Recipes', icon: BookOpen },
              { href: '/chef/ingredients', label: 'Ingredients', icon: Package },
              { href: '/owner/qr-menu', label: 'QR Menu', icon: QrCode },
            ]}
          />
          <CollapsibleNavSection
            label="Kitchen Audit"
            icon={ClipboardCheck}
            pathname={pathname}
            items={[
              { href: '/chef/audit', label: 'Run Audit', icon: ClipboardCheck },
              { href: '/owner/audit-questions', label: 'Audit Questions', icon: ClipboardList },
            ]}
          />
          <Link href="/owner/trail" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname === '/owner/trail' ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><ListChecks className="h-4 w-4" /> Daily Trail</Link>
          <Link href="/owner/trail-history" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/owner/trail-history') ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><BookMarked className="h-4 w-4" /> Trail History</Link>
          <Link href="/owner/trail-settings" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/owner/trail-settings') ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><ClipboardList className="h-4 w-4" /> Trail Settings</Link>
          <Link href="/owner/deliveries" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/owner/deliveries') ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><Truck className="h-4 w-4" /> Deliveries</Link>
          <Link href="/owner/cleaning" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/owner/cleaning') ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><Sparkles className="h-4 w-4" /> Cleaning</Link>
          <Link href="/owner/temperature-logs" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/owner/temperature-logs') ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><Thermometer className="h-4 w-4" /> Temp Logs</Link>
          <Link href="/owner/incidents" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/owner/incidents') ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><AlertOctagon className="h-4 w-4" /> Incidents</Link>
          <Link href="/owner/haccp" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/owner/haccp') ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><FlaskConical className="h-4 w-4" /> HACCP & Calibration</Link>
          <Link href="/owner/eho" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/owner/eho') ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><ShieldCheck className="h-4 w-4" /> EHO Mode</Link>
          <Link href="/owner/kitchen-settings" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/owner/kitchen-settings') ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><Tablet className="h-4 w-4" /> Kitchen Portal</Link>
          <Link href="/owner/history" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/owner/history') ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}><History className="h-4 w-4" /> History</Link>
        </div>

        <NavSection label="Learning Hub" pathname={pathname} items={[
          { href: '/owner/learn', label: 'Learning Modules', icon: BookOpen },
          { href: '/owner/learn/foh', label: 'FOH Training', icon: Users },
          { href: '/owner/staff-quiz?type=front_of_house', label: 'FOH Quiz', icon: Users },
          { href: '/owner/staff-quiz?type=kitchen', label: 'BOH Quiz', icon: Users2 },
          { href: '/owner/quiz-questions', label: 'Quiz Questions', icon: GraduationCap },
        ]} />
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
