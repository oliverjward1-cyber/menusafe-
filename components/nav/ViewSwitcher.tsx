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
    <div className="bg-white border-b border-gray-200 px-4 flex items-center gap-1 h-11 shrink-0">
      {tabs.map(({ label, icon: Icon, href, active }) => (
        <button
          key={href}
          onClick={() => router.push(href)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
      <a
        href={menuUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors ml-1"
      >
        <Users className="h-3.5 w-3.5" />
        Customer View
        <span className="text-xs text-gray-400">↗</span>
      </a>
    </div>
  )
}
