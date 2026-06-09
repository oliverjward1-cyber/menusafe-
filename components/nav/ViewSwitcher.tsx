'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutDashboard, ChefHat, Users, UtensilsCrossed, UserCheck } from 'lucide-react'
import { Suspense } from 'react'

const ROLE_TABS = [
  { label: 'Manager', value: 'manager', icon: LayoutDashboard },
  { label: 'Head Chef', value: 'head_chef', icon: ChefHat },
  { label: 'Kitchen Team', value: 'chef', icon: UtensilsCrossed },
  { label: 'FOH', value: 'foh', icon: UserCheck },
]

function ViewSwitcherInner({ menuUrl }: { menuUrl: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') ?? 'manager'

  function switchView(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="bg-white border-b border-black/[0.06] px-4 flex items-center gap-1 h-10 shrink-0">
      {ROLE_TABS.map(({ label, value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => switchView(value)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-sans transition-colors ${
            currentView === value
              ? 'bg-mise-ink text-white'
              : 'text-mise-ink/50 hover:text-mise-ink hover:bg-black/5'
          }`}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
      <a
        href={menuUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-sans text-mise-ink/50 hover:text-mise-ink hover:bg-black/5 transition-colors ml-1"
      >
        <Users className="h-3 w-3" />
        Customer view
        <span className="text-xs text-mise-gold">↗</span>
      </a>
    </div>
  )
}

export function ViewSwitcher({ menuUrl }: { menuUrl: string }) {
  return (
    <Suspense fallback={<div className="h-10 shrink-0 bg-white border-b border-black/[0.06]" />}>
      <ViewSwitcherInner menuUrl={menuUrl} />
    </Suspense>
  )
}
