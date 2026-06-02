'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'

interface Alert {
  id: string
  ingredient_name: string
  changed_allergens: string
  created_at: string
}

export function AllergenAlertBanner({ alerts }: { alerts: Alert[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = alerts.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  async function dismiss(id: string) {
    setDismissed(prev => { const n = new Set(Array.from(prev)); n.add(id); return n })
    await fetch('/api/dismiss-alert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alertId: id }) })
  }

  return (
    <div className="space-y-2">
      {visible.map(alert => (
        <div key={alert.id} className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-900">Allergen change: {alert.ingredient_name}</p>
            <p className="text-xs text-red-700 mt-0.5">{alert.changed_allergens}</p>
            <p className="text-xs text-red-600 mt-1">
              Check any published recipes or menus that use this ingredient.{' '}
              <Link href="/chef/ingredients" className="underline font-medium">Review ingredients →</Link>
            </p>
          </div>
          <button onClick={() => dismiss(alert.id)} className="shrink-0 p-1 rounded hover:bg-red-100 transition-colors">
            <X className="h-4 w-4 text-red-400" />
          </button>
        </div>
      ))}
    </div>
  )
}
