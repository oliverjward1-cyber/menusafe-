'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MiseLogo } from '@/components/MiseLogo'
import { Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Incorrect password')
    }
  }

  return (
    <div className="min-h-screen bg-mise-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <MiseLogo />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-lg font-semibold text-white mb-1">Admin access</h1>
          <p className="text-sm text-gray-400 mb-6">Enter your admin password to continue.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 px-4 py-2.5 text-sm focus:border-mise-fresh focus:outline-none focus:ring-2 focus:ring-mise-fresh/20"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 bg-mise-mid hover:bg-mise-deep text-white font-medium rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
