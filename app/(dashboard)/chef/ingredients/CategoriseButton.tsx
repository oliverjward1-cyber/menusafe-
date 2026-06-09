'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react'

export function CategoriseButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCategorise() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ingredients/categorise', { method: 'POST' })
      const data = await res.json()
      setLoading(false)
      if (res.ok) {
        setDone(true)
        router.refresh()
      } else {
        setError(data.error ?? 'Something went wrong')
      }
    } catch {
      setLoading(false)
      setError('Network error — please try again')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCategorise}
        disabled={loading || done}
        className="inline-flex items-center gap-2 border border-hospopilot-mid text-hospopilot-mid px-4 py-2 rounded-lg text-sm font-medium hover:bg-hospopilot-mid/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {done ? 'Sorted!' : loading ? 'Sorting…' : 'AI sort by storage'}
      </button>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertTriangle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  )
}
