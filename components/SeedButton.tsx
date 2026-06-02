'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export function SeedButton({ hasData = false }: { hasData?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSeed(force = false) {
    if (force && !window.confirm('This will delete all your current ingredients and recipes and replace them with sample data. Continue?')) return
    setLoading(true)
    setError('')
    const url = force ? '/api/seed?force=true' : '/api/seed'
    const res = await fetch(url, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to load sample data')
      setLoading(false)
      return
    }
    router.refresh()
  }

  if (hasData) {
    return (
      <div className="text-center">
        <button
          onClick={() => handleSeed(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? 'Loading…' : 'Reset with sample data'}
        </button>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <p className="text-xs text-gray-400 mt-1.5">Replaces all current data with 9 sample dishes</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <button
        onClick={() => handleSeed(false)}
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
