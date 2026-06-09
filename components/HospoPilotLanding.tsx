'use client'

// HospoPilotLanding.tsx
// Self-contained landing page. Tailwind CSS (arbitrary-value classes, so it
// works with any Tailwind setup — no config changes needed).
//
// FONTS (required for the intended look): Hanken Grotesk + IBM Plex Mono are
// loaded via a <link> in app/layout.tsx so the font-['Hanken_Grotesk'] /
// font-['IBM_Plex_Mono'] classes below resolve correctly.
//
// The hero CTA links straight to /signup (the free-trial flow).

import { EhoReadinessScore } from '@/components/marketing/EhoReadinessScore'

export default function HospoPilotLanding() {
  return (
    <div className="min-h-screen bg-[#F8FAFB] text-[#3A474E] font-['Hanken_Grotesk'] antialiased">
      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-40 bg-[#F8FAFB]/[.86] backdrop-blur-md border-b border-[#E3E9EC]">
        <div className="mx-auto w-full max-w-[1180px] px-6 flex items-center justify-between h-[66px]">
          <a href="/" className="inline-flex items-center gap-[11px] no-underline">
            <svg width="30" height="30" viewBox="0 0 44 44" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="40" height="40" rx="10" fill="#1B4332" />
              <path d="M22 9 C 23 18.4 25.6 21 35 22 C 25.6 23 23 25.6 22 35 C 21 25.6 18.4 23 9 22 C 18.4 21 21 18.4 22 9 Z" fill="#D4A017" />
            </svg>
            <span className="text-[21px] font-bold tracking-[-0.02em] text-[#1B4332]">
              Hospo<b className="text-[#2D6A4F]">Pilot</b>
            </span>
          </a>
          <nav className="hidden lg:flex items-center gap-7">
            <a href="/allergens" className="text-[14.5px] font-semibold text-[#677077] no-underline hover:text-[#1B4332] transition-colors">Allergens</a>
            <a href="/costing" className="text-[14.5px] font-semibold text-[#677077] no-underline hover:text-[#1B4332] transition-colors">Costing</a>
            <a href="/compliance" className="text-[14.5px] font-semibold text-[#677077] no-underline hover:text-[#1B4332] transition-colors">Compliance</a>
            <a href="/pricing" className="text-[14.5px] font-semibold text-[#677077] no-underline hover:text-[#1B4332] transition-colors">Pricing</a>
          </nav>
          <a href="#capture" className="hidden lg:inline-flex items-center text-[14.5px] font-bold text-white bg-[#1B4332] px-[18px] py-[10px] rounded-lg no-underline whitespace-nowrap leading-none">
            Start free
          </a>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <main className="py-7 md:py-9 lg:pb-16">
        <div className="mx-auto w-full max-w-[1180px] px-6">
          {/* Hero copy + email capture — centered, full width */}
          <div className="max-w-[900px] mx-auto text-center">
            <span className="font-['IBM_Plex_Mono'] text-[13px] font-medium tracking-[0.14em] uppercase text-[#2D6A4F] inline-flex items-center gap-[11px] before:content-[''] before:w-6 before:h-0.5 before:bg-[#52B788]">
              For independent restaurants
            </span>
            <h1 className="text-[clamp(33px,6vw,58px)] leading-[1.05] tracking-[-0.03em] font-bold text-[#1B4332] mt-4 text-balance">
              <span className="text-[#74828B]">Your kitchen&apos;s already clean.</span> Can you prove it?
            </h1>
            <p className="text-[clamp(17px,2.4vw,20px)] leading-[1.55] text-[#3A474E] mt-4 max-w-[46ch] mx-auto">
              Your standards aren&apos;t the problem — <b className="text-[#141A1E] font-bold">proving them is.</b> HospoPilot logs allergens, temps and cleaning as you go, ready in seconds.
            </p>

            {/* PRIMARY CTA */}
            <div className="mt-6 max-w-[420px] mx-auto">
              <a
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-[9px] font-bold text-base bg-[#1B4332] text-white px-6 py-[15px] rounded-lg shadow-sm transition hover:bg-[#14342A] hover:-translate-y-px active:translate-y-0 no-underline"
              >
                Start your free trial
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h9M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>

              <div className="flex items-center justify-center gap-[9px] mt-[13px] text-[13.5px] text-[#677077]">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-none">
                  <path d="M8 1l6 2.5v4C14 11 11.5 14 8 15 4.5 14 2 11 2 7.5v-4L8 1z" stroke="#677077" strokeWidth="1.3" fill="none" />
                  <path d="M5.5 8l1.8 1.8L10.8 6" stroke="#677077" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                14 days free. No card, no sales call — set it up between lunch and prep.
              </div>
            </div>
          </div>

          {/* Pointer down to the free EHO tool */}
          <div className="mt-6 flex justify-center">
            <a
              href="#eho"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#E7F4EC] border-[1.5px] border-[#9FD6B6] text-[#136B43] font-bold text-[14px] pl-4 pr-[18px] py-2.5 shadow-[0_3px_14px_-3px_rgba(31,138,91,0.35)] hover:bg-[#DCEEE3] hover:border-[#1F8A5B] transition-colors no-underline"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#1F8A5B] opacity-60 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1F8A5B]" />
              </span>
              Try our free 30-second EHO check
              <svg className="animate-bounce" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v9M4 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {/* Interactive EHO readiness check */}
          <div id="eho" className="mt-6 max-w-[480px] mx-auto scroll-mt-24">
            <EhoReadinessScore />
          </div>
        </div>
      </main>
    </div>
  )
}
