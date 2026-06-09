'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
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
  ChefHat,
  UtensilsCrossed,
} from 'lucide-react'
import { MiseLogo } from '@/components/MiseLogo'

type Role = 'owner' | 'manager' | 'head_chef' | 'chef' | 'foh'

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  manager: 'Manager',
  head_chef: 'Head Chef',
  chef: 'Kitchen Team',
  foh: 'Front of House',
}

const ROLE_BADGE: Record<Role, string> = {
  owner: 'bg-mise-gold/20 text-mise-gold',
  manager: 'bg-purple-500/20 text-purple-300',
  head_chef: 'bg-mise-mid/30 text-mise-fresh',
  chef: 'bg-blue-500/20 text-blue-300',
  foh: 'bg-amber-500/20 text-amber-300',
}

function NavLink({ href, label, icon: Icon, pathname, exact }: {
  href: string; label: string; icon: any; pathname: string; exact?: boolean
}) {
  const active = exact ? pathname === href : pathname.startsWith(href)
  return (
    <Link href={href} className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
      active ? 'bg-mise-mid text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    )}>
      <Icon className="h-4 w-4" />{label}
    </Link>
  )
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
      {children}
    </div>
  )
}

function CollapsibleNavSection({ label, icon: SectionIcon, items, pathname }: {
  label: string; icon: any
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
              <Link key={href} href={href} className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-mise-mid text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}>
                <Icon className="h-3.5 w-3.5" />{label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AppNavInner({ restaurantName, restaurantSlug, role: dbRole }: {
  restaurantName: string
  restaurantSlug: string
  role: Role
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const validRoles: Role[] = ['owner', 'manager', 'head_chef', 'chef', 'foh']
  const viewParam = searchParams.get('view') as Role | null
  // Owners/managers can preview any role; others always see their own role
  const canPreview = dbRole === 'owner' || dbRole === 'manager'
  const role: Role = canPreview && viewParam && validRoles.includes(viewParam) ? viewParam : dbRole
  const isPreviewing = canPreview && viewParam && viewParam !== dbRole

  const isOwner = role === 'owner'
  const isManager = role === 'manager'
  const isOwnerOrManager = isOwner || isManager
  const isHeadChef = role === 'head_chef'
  const isKitchenStaff = isOwner || isManager || isHeadChef || role === 'chef'
  const isFOH = role === 'foh'

  // Dashboard home path
  const homePath = isFOH ? '/owner' : role === 'chef' ? '/owner' : '/owner'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Brand */}
      <div className="p-4 border-b border-gray-700">
        <Link href="/owner"><MiseLogo className="mb-2" /></Link>
        <p className="text-xs text-gray-400 truncate">{restaurantName}</p>
        <span className={cn('inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs', ROLE_BADGE[role])}>
          {isPreviewing ? `Preview: ${ROLE_LABELS[role]}` : ROLE_LABELS[role]}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Dashboard */}
        <NavLink href="/owner" label="Dashboard" icon={LayoutDashboard} pathname={pathname} exact />

        {/* People — owner/manager only */}
        {isOwnerOrManager && (
          <NavSection label="People">
            <NavLink href="/owner/team" label="Team" icon={Users2} pathname={pathname} />
            <NavLink href="/owner/billing" label="Billing" icon={CreditCard} pathname={pathname} />
          </NavSection>
        )}

        {/* Kitchens */}
        <NavSection label="Kitchens">

          {/* Menus — owner, manager, head chef */}
          {(isOwnerOrManager || isHeadChef) && (
            <CollapsibleNavSection
              label="Menus"
              icon={MenuSquare}
              pathname={pathname}
              items={[
                { href: '/chef/menus', label: 'Build Menu', icon: MenuSquare },
                { href: '/chef/recipes', label: 'Recipes', icon: BookOpen },
                { href: '/chef/ingredients', label: 'Ingredients', icon: Package },
                ...(isOwnerOrManager ? [{ href: '/owner/qr-menu', label: 'QR Menu', icon: QrCode }] : []),
              ]}
            />
          )}

          {/* Kitchen Audit — owner, manager, head chef */}
          {(isOwnerOrManager || isHeadChef) && (
            <CollapsibleNavSection
              label="Kitchen Audit"
              icon={ClipboardCheck}
              pathname={pathname}
              items={[
                { href: '/chef/audit', label: 'Run Audit', icon: ClipboardCheck },
                ...(isOwnerOrManager ? [{ href: '/owner/audit-questions', label: 'Audit Questions', icon: ClipboardList }] : []),
              ]}
            />
          )}

          {/* Daily Trail — all roles */}
          <NavLink href="/owner/trail" label="Daily Trail" icon={ListChecks} pathname={pathname} />

          {/* Trail History — owner, manager, head chef */}
          {(isOwnerOrManager || isHeadChef) && (
            <NavLink href="/owner/trail-history" label="Trail History" icon={BookMarked} pathname={pathname} />
          )}

          {/* Trail Settings — owner, manager */}
          {isOwnerOrManager && (
            <NavLink href="/owner/trail-settings" label="Trail Settings" icon={ClipboardList} pathname={pathname} />
          )}

          {/* Operations — owner, manager, head chef, kitchen chef */}
          {isKitchenStaff && (<>
            <NavLink href="/owner/cleaning" label="Cleaning" icon={Sparkles} pathname={pathname} />
            <NavLink href="/owner/temperature-logs" label="Temp Logs" icon={Thermometer} pathname={pathname} />
            <NavLink href="/owner/incidents" label="Incidents" icon={AlertOctagon} pathname={pathname} />
          </>)}

          {/* Management ops — owner, manager, head chef */}
          {(isOwnerOrManager || isHeadChef) && (
            <NavLink href="/owner/haccp" label="HACCP & Calibration" icon={FlaskConical} pathname={pathname} />
          )}
          {isOwnerOrManager && (<>
            <NavLink href="/owner/eho" label="EHO Mode" icon={ShieldCheck} pathname={pathname} />
            <NavLink href="/owner/kitchen-settings" label="Kitchen Portal" icon={Tablet} pathname={pathname} />
            <NavLink href="/owner/history" label="History" icon={History} pathname={pathname} />
          </>)}
        </NavSection>

        {/* Learning Hub — all roles */}
        <NavSection label="Learning Hub">
          <NavLink href="/owner/learn" label="Learning Modules" icon={BookOpen} pathname={pathname} />

          {/* FOH training — owner, manager, head chef, FOH (not pure kitchen chef) */}
          {(isOwnerOrManager || isHeadChef || isFOH) && (
            <NavLink href="/owner/learn/foh" label="FOH Training" icon={Users} pathname={pathname} />
          )}
          {(isOwnerOrManager || isHeadChef || isFOH) && (
            <NavLink href="/owner/staff-quiz?type=front_of_house" label="FOH Quiz" icon={Users} pathname={pathname} />
          )}
          {/* BOH Quiz — all kitchen staff + management, not FOH */}
          {!isFOH && (
            <NavLink href="/owner/staff-quiz?type=kitchen" label="BOH Quiz" icon={UtensilsCrossed} pathname={pathname} />
          )}
          {isOwnerOrManager && (
            <NavLink href="/owner/quiz-questions" label="Quiz Questions" icon={GraduationCap} pathname={pathname} />
          )}
        </NavSection>
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

export function AppNav(props: { restaurantName: string; restaurantSlug: string; role: Role }) {
  return (
    <Suspense fallback={<aside className="w-64 min-h-screen bg-gray-900" />}>
      <AppNavInner {...props} />
    </Suspense>
  )
}
