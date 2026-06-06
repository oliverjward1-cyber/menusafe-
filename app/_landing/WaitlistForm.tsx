'use client'

import { useState } from 'react'

export default function WaitlistForm() {
  const [form, setForm] = useState({ name: '', email: '', restaurant: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-xl font-semibold text-[#1C3A2E]">You&apos;re on the list!</p>
        <p className="text-[#4a6358] mt-2 text-sm">We&apos;ll be in touch with your early-access details.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#1C3A2E] mb-1">Your name</label>
        <input
          type="text"
          placeholder="Alex Morgan"
          required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#1C3A2E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8971A]/40 focus:border-[#C8971A]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1C3A2E] mb-1">Email address</label>
        <input
          type="email"
          placeholder="alex@theharbourkitchen.co.uk"
          required
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#1C3A2E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8971A]/40 focus:border-[#C8971A]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1C3A2E] mb-1">Restaurant name</label>
        <input
          type="text"
          placeholder="The Harbour Kitchen"
          required
          value={form.restaurant}
          onChange={e => setForm(f => ({ ...f, restaurant: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#1C3A2E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8971A]/40 focus:border-[#C8971A]"
        />
      </div>
      {status === 'error' && (
        <p className="text-red-500 text-sm">Something went wrong. Please try again.</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-[#C8971A] hover:bg-[#b5851a] text-white font-semibold py-3.5 rounded-full text-sm transition-colors disabled:opacity-60"
      >
        {status === 'loading' ? 'Saving your spot…' : 'Reserve my spot'}
      </button>
      <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
        <span>🔒</span> No spam, ever. We&apos;ll only email about your early access.
      </p>
    </form>
  )
}
