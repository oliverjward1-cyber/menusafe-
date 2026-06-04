'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export default function ResolveButton({ incidentId }: { incidentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function resolve() {
    setLoading(true)
    await fetch(`/api/compliance/incidents/${incidentId}/resolve`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={resolve} disabled={loading}
      className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-green-700 border border-green-300 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-2 transition-colors disabled:opacity-50">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {loading ? '…' : 'Resolve'}
    </button>
  )
}
