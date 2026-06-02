'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export function SeedButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSeed() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/seed', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to load sample data')
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <div className="text-center">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Sparkles className="h-4 w-4" />
        {loading ? 'Loading sample data…' : 'Load sample menu data'}
      </button>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <p className="text-xs text-gray-400 mt-1.5">
        Loads 9 sample dishes (3 starters, 3 mains, 3 desserts) with ingredients and pricing
      </p>
    </div>
  )
}
