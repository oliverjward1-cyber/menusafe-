'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { HospoPilotLogo } from '@/components/HospoPilotLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    const destination = profile?.role === 'owner' ? '/owner' : '/chef'

    // Record session and check limits
    try {
      const sessionKey = `${navigator.userAgent.slice(0, 50)}-${Date.now()}`
      const sessionRes = await fetch('/api/sessions/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey }),
      })
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        if (sessionData.allowed === false) {
          router.push(`/session-limit?limit=${sessionData.limit}&count=${sessionData.activeCount}`)
          return
        }
        if (sessionData.suspicious) {
          sessionStorage.setItem('suspicious_login', '1')
        }
      }
    } catch {
      // Don't block login if session recording fails
    }

    router.push(destination)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-[#3A474E] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <HospoPilotLogo className="scale-110" />
          <p className="text-[#677077] text-sm mt-3">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@restaurant.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <div className="text-right -mt-2">
              <Link href="/forgot-password" className="text-xs text-[#677077] hover:text-[#1B4332]">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full !bg-hospopilot-mid hover:!bg-hospopilot-deep">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#677077] mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#2D6A4F] hover:text-[#1B4332] font-semibold">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
