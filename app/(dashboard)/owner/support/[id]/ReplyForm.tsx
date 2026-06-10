'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'

export function ReplyForm({ threadId, to, subject }: { threadId: string; to: string; subject: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSend() {
    if (!body.trim()) return
    setSending(true)
    setError('')

    const res = await fetch('/api/support/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, to, subject, body }),
    })

    setSending(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to send reply')
      return
    }

    setBody('')
    setSent(true)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 space-y-3">
      <p className="text-sm font-semibold text-hospopilot-ink">Reply to {to}</p>
      <textarea
        value={body}
        onChange={e => { setBody(e.target.value); setSent(false) }}
        placeholder="Type your reply…"
        rows={5}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hospopilot-gold focus:border-transparent resize-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {sent && <p className="text-sm text-green-600">Reply sent.</p>}
      <button
        onClick={handleSend}
        disabled={sending || !body.trim()}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-hospopilot-gold hover:bg-yellow-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors"
      >
        {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send reply</>}
      </button>
    </div>
  )
}
