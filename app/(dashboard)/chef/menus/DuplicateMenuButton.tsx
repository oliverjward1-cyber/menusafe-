'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2 } from 'lucide-react'

export function DuplicateMenuButton({ menuId }: { menuId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function duplicate() {
    setLoading(true)
    const res = await fetch('/api/duplicate-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuId }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.id) router.push(`/chef/menus/${data.id}`)
    else router.refresh()
  }

  return (
    <button
      onClick={duplicate}
      disabled={loading}
      title="Duplicate menu"
      className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
      Duplicate
    </button>
  )
}
