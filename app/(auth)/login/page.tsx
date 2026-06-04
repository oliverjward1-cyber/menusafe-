'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { MiseLogo } from '@/components/MiseLogo'

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

    if (profile?.role === 'owner') {
      router.push('/owner')
    } else {
      router.push('/chef')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-mise-ink flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <MiseLogo className="mb-3 scale-125" />
          <p className="text-mise-fresh/70 text-sm mt-1 font-sans">Sign in to your account</p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-xl p-8">
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

            {error && (
              <div className="rounded-lg bg-red-900/30 border border-red-500/40 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full !bg-mise-mid hover:!bg-mise-deep">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-mise-fresh hover:text-mise-gold font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
