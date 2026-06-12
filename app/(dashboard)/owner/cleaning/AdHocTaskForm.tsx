'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdHocTaskForm({ restaurantId, staffName }: { restaurantId: string; staffName: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/compliance/cleaning/sign-off', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, taskId: null, taskName: name, signedBy: staffName, source: 'owner' }),
    })
    setSaving(false)
    setName('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-48">
        <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">What did you do?</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Mopped up spillage near walk-in"
          required
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="bg-hospopilot-deep text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-hospopilot-deep/90 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Logging…' : 'Log it'}
      </button>
    </form>
  )
}
