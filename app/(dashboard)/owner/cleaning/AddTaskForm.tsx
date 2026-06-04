'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddTaskForm({ restaurantId }: { restaurantId: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [area, setArea] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/compliance/cleaning/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, name, frequency, area }),
    })
    setSaving(false)
    setName('')
    setArea('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-48">
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Task name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Deep clean fryers"
          required
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Frequency</label>
        <select
          value={frequency}
          onChange={e => setFrequency(e.target.value)}
          className="border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Area (optional)</label>
        <input
          value={area}
          onChange={e => setArea(e.target.value)}
          placeholder="e.g. Fryer station"
          className="border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="bg-mise-deep text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-mise-deep/90 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Adding…' : 'Add task'}
      </button>
    </form>
  )
}
