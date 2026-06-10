'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Code2, X, Loader2 } from 'lucide-react'

type Role = 'owner' | 'manager' | 'head_chef' | 'chef' | 'foh'

const ROLES: { value: Role; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'head_chef', label: 'Head Chef' },
  { value: 'chef', label: 'Kitchen Team' },
  { value: 'foh', label: 'Front of House' },
]

type Restaurant = { id: string; name: string; slug: string }

export function DevPanel({
  currentRole,
  currentRestaurantId,
}: {
  currentRole: Role
  currentRestaurantId: string | null
}) {
  const [open, setOpen] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || restaurants.length || loadingRestaurants) return
    setLoadingRestaurants(true)
    fetch('/api/dev/restaurants')
      .then(res => res.json())
      .then(json => setRestaurants(json.restaurants ?? []))
      .finally(() => setLoadingRestaurants(false))
  }, [open, restaurants.length, loadingRestaurants])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function setView(body: { role?: Role; restaurantId?: string }) {
    setBusy(true)
    await fetch('/api/dev/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-sans bg-purple-600 text-white hover:bg-purple-700 transition-colors"
      >
        <Code2 className="h-3 w-3" />
        Dev
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-black/10 rounded-lg shadow-lg z-50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-hospopilot-ink">Developer view</p>
            <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-gray-400" /></button>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">View as role</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  disabled={busy}
                  onClick={() => setView({ role: r.value })}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                    currentRole === r.value
                      ? 'bg-hospopilot-ink text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">View restaurant</p>
            {loadingRestaurants ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
              </div>
            ) : (
              <select
                value={currentRestaurantId ?? ''}
                disabled={busy}
                onChange={e => setView({ restaurantId: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 disabled:opacity-50"
              >
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            )}
          </div>

          <p className="text-[11px] text-gray-400 leading-snug">
            Switching role or restaurant enters read-only impersonation mode and is logged for audit.
          </p>
        </div>
      )}
    </div>
  )
}
