'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ChefHat, Users } from 'lucide-react'

export function ViewSwitcher({ menuUrl }: { menuUrl: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const isManager = pathname.startsWith('/owner') || (!pathname.startsWith('/chef'))
  const isChef = pathname.startsWith('/chef')

  const tabs = [
    { label: 'Manager', icon: LayoutDashboard, href: '/owner', active: isManager },
    { label: 'Chef', icon: ChefHat, href: '/chef', active: isChef },
  ]

  return (
    <div className="bg-white border-b border-black/[0.06] px-4 flex items-center gap-1 h-10 shrink-0">
      {tabs.map(({ label, icon: Icon, href, active }) => (
        <button
          key={href}
          onClick={() => router.push(href)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-sans transition-colors ${
            active
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
