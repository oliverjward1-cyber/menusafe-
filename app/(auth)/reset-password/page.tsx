'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { HospoPilotLogo } from '@/components/HospoPilotLogo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/chef')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-[#3A474E] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <HospoPilotLogo className="scale-110" />
        </div>
        <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-8">
          {!ready ? (
            <p className="text-[#677077] text-sm text-center">Loading…</p>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#1B4332] mb-1">Set a new password</h1>
              <p className="text-[#677077] text-sm mb-6">
                Choose a strong password for your account.
              </p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3A474E] mb-1.5">
                    New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full rounded-lg border-[1.5px] border-[#C7D0D5] bg-white text-[#141A1E] placeholder:text-[#97A1A7] px-4 py-2.5 text-sm focus:border-[#2D6A4F] focus:outline-none focus:shadow-[0_0_0_3px_rgba(45,106,79,0.14)] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3A474E] mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat your password"
                    className="w-full rounded-lg border-[1.5px] border-[#C7D0D5] bg-white text-[#141A1E] placeholder:text-[#97A1A7] px-4 py-2.5 text-sm focus:border-[#2D6A4F] focus:outline-none focus:shadow-[0_0_0_3px_rgba(45,106,79,0.14)] transition"
                  />
                </div>
                {error && <p className="text-sm text-[#97271D] font-semibold">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-hospopilot-mid hover:bg-hospopilot-deep text-white font-semibold rounded-lg disabled:opacity-40 transition-colors"
                >
                  {loading ? 'Saving…' : 'Set new password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
