'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { HospoPilotLogo } from '@/components/HospoPilotLogo'

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [expired, setExpired] = useState(false)
  const [pwError, setPwError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, fullName }),
    })

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 404) {
        setExpired(true)
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password,
    })

    if (signInError) {
      setError('Account created! Redirecting to login…')
      setTimeout(() => router.push('/login'), 1500)
      return
    }

    setSuccess(true)
    router.push('/chef')
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] font-sans text-[#3A474E] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <HospoPilotLogo className="scale-110" />
          </div>
          <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-8 text-center">
            <p className="text-2xl mb-3">🔗</p>
            <h1 className="text-xl font-bold text-[#1B4332] mb-2">Link expired</h1>
            <p className="text-[#677077] text-sm">
              This invite link has expired or already been used. Ask your restaurant owner to send a new invite.
            </p>
            <Link href="/login" className="mt-4 inline-block text-sm text-[#2D6A4F] hover:text-[#1B4332] font-semibold transition-colors">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-[#3A474E] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <HospoPilotLogo className="scale-110" />
          <p className="text-[#677077] text-sm mt-3">You&apos;ve been invited to join HospoPilot as head chef</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-8">
          <h1 className="text-xl font-bold text-[#1B4332] mb-6">Set up your account</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              autoComplete="new-password"
            />
            <div>
              <Input
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => {
                  if (confirmPassword && password !== confirmPassword) setPwError('Passwords do not match')
                  else setPwError('')
                }}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
              />
              {pwError && <p className="text-xs text-red-600 mt-1">{pwError}</p>}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full !bg-hospopilot-mid hover:!bg-hospopilot-deep">
              Create my account
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
