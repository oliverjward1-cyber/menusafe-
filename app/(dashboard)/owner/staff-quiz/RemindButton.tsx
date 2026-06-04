'use client'
import { useState } from 'react'
import { Mail, CheckCircle2, Loader2 } from 'lucide-react'

interface Props {
  staffName: string
  restaurantName: string
  quizUrl: string
}

export function RemindButton({ staffName, restaurantName, quizUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!email) return
    setLoading(true)
    const res = await fetch('/api/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffName, staffEmail: email, restaurantName, quizUrl }),
    })
    if (res.ok) {
      setSent(true)
    } else {
      setError('Failed to send')
    }
    setLoading(false)
  }

  if (sent)
    return (
      <span className="text-xs text-green-600 flex items-center gap-1">
        <CheckCircle2 className="h-3.5 w-3.5" /> Sent
      </span>
    )

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-mise-mid hover:text-mise-deep font-medium"
      >
        <Mail className="h-3.5 w-3.5" /> Send reminder
      </button>
    )

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="staff@email.com"
        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-mise-gold w-44"
      />
      <button
        onClick={handleSend}
        disabled={loading || !email}
        className="inline-flex items-center gap-1 text-xs bg-mise-mid text-white px-2.5 py-1.5 rounded-lg disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send'}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-gray-400">
        Cancel
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
