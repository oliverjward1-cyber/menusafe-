'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { MiseLogo } from '@/components/MiseLogo'

function SessionLimitContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [clearing, setClearing] = useState(false)

  const limit = searchParams.get('limit') ?? '3'
  const count = searchParams.get('count') ?? limit

  async function handleClearSessions() {
    setClearing(true)
    try {
      await fetch('/api/sessions/clear', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-mise-ink flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <MiseLogo className="mb-3 scale-125" />
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-xl p-8 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-900/40 border border-red-500/40 mx-auto mb-5">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-white mb-2">Too many active devices</h1>
          <p className="text-mise-fresh/70 text-sm mb-6 leading-relaxed">
            You&apos;ve reached the limit of{' '}
            <span className="text-white font-medium">{limit} active devices</span> on your current plan.
            You currently have{' '}
            <span className="text-white font-medium">{count} devices</span> signed in.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleClearSessions}
              disabled={clearing}
              className="w-full py-2.5 px-4 rounded-lg bg-mise-mid hover:bg-mise-deep disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {clearing ? 'Signing out other devices…' : 'Sign out all other devices'}
            </button>

            <a
              href="mailto:hello@menusafe.app?subject=Plan%20Upgrade"
              className="block w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
            >
              Upgrade your plan
            </a>
          </div>

          <p className="text-xs text-gray-500 mt-5">
            This protects your account from being shared
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SessionLimitPage() {
  return (
    <Suspense>
      <SessionLimitContent />
    </Suspense>
  )
}
