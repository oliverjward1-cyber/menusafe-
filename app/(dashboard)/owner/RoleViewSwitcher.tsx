'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const ROLES = [
  { key: 'owner', label: 'Owner', emoji: '👑' },
  { key: 'manager', label: 'Manager', emoji: '📋' },
  { key: 'head-chef', label: 'Head Chef', emoji: '👨‍🍳' },
  { key: 'foh', label: 'Front of House', emoji: '🛎️' },
  { key: 'kitchen', label: 'Kitchen Staff', emoji: '🍳' },
]

export default function RoleViewSwitcher({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl p-1.5 shadow-sm">
      <p className="text-xs text-mise-ink/40 font-semibold uppercase tracking-widest px-3 pt-1 pb-2">View as</p>
      <div className="flex flex-wrap gap-1.5">
        {ROLES.map(role => (
          <button
            key={role.key}
            onClick={() => router.push(role.key === 'owner' ? pathname : `${pathname}?view=${role.key}`)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              current === role.key
                ? 'bg-mise-deep text-white shadow-sm'
                : 'text-mise-ink/60 hover:bg-gray-100 hover:text-mise-ink'
            }`}
          >
            <span>{role.emoji}</span> {role.label}
          </button>
        ))}
      </div>
    </div>
  )
}
