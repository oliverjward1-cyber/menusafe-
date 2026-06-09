'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Sparkles } from 'lucide-react'

export default function SeedDemoDataButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSeed() {
    if (!confirm('This will create 15 demo staff accounts and ~3 weeks of demo audits, temp checks, deliveries, cleaning logs and incidents for this restaurant. Continue?')) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/seed-demo-data', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setResult(data.error ?? 'Failed to seed demo data')
      } else {
        let msg = `Done — created ${data.staffCreated} staff, ${data.tempLogs} temp checks, ${data.cleaningLogs} cleaning logs, ${data.deliveries} deliveries, ${data.incidents} incidents and ${data.audits} audits.`
        if (data.staffErrors?.length) msg += ` Staff errors: ${data.staffErrors.join('; ')}`
        setResult(msg)
      }
    } catch {
      setResult('Failed to seed demo data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-mise-gold" />
        <p className="font-semibold text-mise-ink">Fill with demo data</p>
      </div>
      <p className="text-sm text-gray-500">
        Populate this restaurant with 15 demo staff members and three weeks of audits, temperature checks,
        cleaning logs, deliveries and incidents — useful for exploring or demoing the app.
      </p>
      <Button onClick={handleSeed} loading={loading} variant="outline" size="sm">
        Seed demo data
      </Button>
      {result && <p className="text-sm text-mise-mid">{result}</p>}
    </div>
  )
}
