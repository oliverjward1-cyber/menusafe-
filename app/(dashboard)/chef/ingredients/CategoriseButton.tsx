'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'

export function CategoriseButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleCategorise() {
    setLoading(true)
    const res = await fetch('/api/ingredients/categorise', { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleCategorise}
      disabled={loading || done}
      className="inline-flex items-center gap-2 border border-mise-mid text-mise-mid px-4 py-2 rounded-lg text-sm font-medium hover:bg-mise-mid/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {done ? 'Categorised!' : loading ? 'Categorising…' : 'AI sort by storage'}
    </button>
  )
}
