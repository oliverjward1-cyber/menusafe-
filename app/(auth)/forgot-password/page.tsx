'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HospoPilotLogo } from '@/components/HospoPilotLogo'

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
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-[#3A474E] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <HospoPilotLogo className="scale-110" />
        </div>
        <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-8">
          {sent ? (
            <div className="text-center">
              <p className="text-2xl mb-3">📧</p>
              <h2 className="text-xl font-bold text-[#1B4332] mb-2">Check your email</h2>
              <p className="text-[#677077] text-sm">
                We&apos;ve sent a password reset link to {email}.
              </p>
              <Link
                href="/login"
                className="mt-6 block text-sm text-[#2D6A4F] hover:text-[#1B4332] font-semibold"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#1B4332] mb-1">Reset your password</h1>
              <p className="text-[#677077] text-sm mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3A474E] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@restaurant.com"
                    className="w-full rounded-lg border-[1.5px] border-[#C7D0D5] bg-white text-[#141A1E] placeholder:text-[#97A1A7] px-4 py-2.5 text-sm focus:border-[#2D6A4F] focus:outline-none focus:shadow-[0_0_0_3px_rgba(45,106,79,0.14)] transition"
                  />
                </div>
                {error && <p className="text-sm text-[#97271D] font-semibold">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-hospopilot-mid hover:bg-hospopilot-deep text-white font-semibold rounded-lg disabled:opacity-40 transition-colors"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <Link
                href="/login"
                className="mt-4 block text-center text-sm text-[#677077] hover:text-[#1B4332]"
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
