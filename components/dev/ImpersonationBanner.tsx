'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Loader2 } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  head_chef: 'Head Chef',
  chef: 'Kitchen Team',
  foh: 'Front of House',
}

export function ImpersonationBanner({ role, restaurantName }: { role: string; restaurantName: string }) {
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function exit() {
    setBusy(true)
    await fetch('/api/dev/impersonate', { method: 'DELETE' })
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium shrink-0">
      <span className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        Viewing as: {ROLE_LABELS[role] ?? role} @ {restaurantName} (read-only)
      </span>
      <button
        onClick={exit}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/15 hover:bg-white/25 transition-colors disabled:opacity-50 text-xs font-semibold"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        Exit
      </button>
    </div>
  )
}
