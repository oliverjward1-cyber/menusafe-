'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { HospoPilotLogo } from '@/components/HospoPilotLogo'

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
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-[#3A474E] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <HospoPilotLogo className="scale-110" />
        </div>

        <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-8 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 border border-red-200 mx-auto mb-5">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-[#1B4332] mb-2">Too many active devices</h1>
          <p className="text-[#677077] text-sm mb-6 leading-relaxed">
            You&apos;ve reached the limit of{' '}
            <span className="text-[#1B4332] font-semibold">{limit} active devices</span> on your current plan.
            You currently have{' '}
            <span className="text-[#1B4332] font-semibold">{count} devices</span> signed in.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleClearSessions}
              disabled={clearing}
              className="w-full py-2.5 px-4 rounded-lg bg-hospopilot-mid hover:bg-hospopilot-deep disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {clearing ? 'Signing out other devices…' : 'Sign out all other devices'}
            </button>

            <a
              href="mailto:support@hospopilot.co.uk?subject=Plan%20Upgrade"
              className="block w-full py-2.5 px-4 rounded-lg bg-[#F0F3F4] hover:bg-[#E3E9EC] text-[#1B4332] text-sm font-semibold transition-colors"
            >
              Upgrade your plan
            </a>
          </div>

          <p className="text-xs text-[#97A1A7] mt-5">
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
