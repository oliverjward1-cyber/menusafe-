'use client'

import { useState } from 'react'
import { UserPlus, CheckCircle2, Loader2 } from 'lucide-react'
import { STAFF_ROLES } from '@/types/database'

export function InviteChef() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('chef')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to send invite')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex items-center gap-3 py-2">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <p className="text-sm text-hospopilot-ink">Invite sent to <strong>{email}</strong>. They&apos;ll receive an email with a link to set up their account.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleInvite} className="flex items-end gap-3 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-hospopilot-ink/60 mb-1">Staff email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="chef@restaurant.com"
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-hospopilot-gold focus:ring-1 focus:ring-hospopilot-gold"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-hospopilot-ink/60 mb-1">Role</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-hospopilot-gold focus:ring-1 focus:ring-hospopilot-gold bg-white"
        >
          {STAFF_ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 bg-hospopilot-mid hover:bg-hospopilot-deep text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Send invite
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  )
}
