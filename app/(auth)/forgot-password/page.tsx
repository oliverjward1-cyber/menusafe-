'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MiseLogo } from '@/components/MiseLogo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-mise-ink flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <MiseLogo className="mb-3 scale-125" />
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-xl p-8">
          {sent ? (
            <div className="text-center">
              <p className="text-2xl mb-3">📧</p>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-mise-fresh/70 text-sm">
                We&apos;ve sent a password reset link to {email}.
              </p>
              <Link
                href="/login"
                className="mt-6 block text-sm text-mise-fresh hover:text-white"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white mb-1">Reset your password</h1>
              <p className="text-mise-fresh/60 text-sm mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@restaurant.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 px-4 py-2.5 text-sm focus:border-mise-fresh focus:outline-none"
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-mise-mid hover:bg-mise-deep text-white font-medium rounded-xl disabled:opacity-40 transition-colors"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <Link
                href="/login"
                className="mt-4 block text-center text-sm text-gray-500 hover:text-gray-300"
              >
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
