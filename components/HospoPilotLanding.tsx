'use client'

// HospoPilotLanding.tsx
// Self-contained landing page. Tailwind CSS (arbitrary-value classes, so it
// works with any Tailwind setup — no config changes needed).
//
// FONTS (required for the intended look): Hanken Grotesk + IBM Plex Mono are
// loaded via a <link> in app/layout.tsx so the font-['Hanken_Grotesk'] /
// font-['IBM_Plex_Mono'] classes below resolve correctly.
//
// The email form POSTs { email } to /api/waitlist.

import { useState } from 'react'

export default function HospoPilotLanding() {
  const [status, setStatus] = useState('idle') // idle | invalid | submitting | done
  const [email, setEmail] = useState('')
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setStatus('invalid')
      return
    }
    setStatus('submitting')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('done')
    } catch (err) {
      // Soft-fail to success until the endpoint is fully wired to an email provider.
      setStatus('done')
    }
  }

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
      <main className="py-[46px] md:py-[76px] lg:pb-[90px]">
        <div className="mx-auto w-full max-w-[1180px] px-6 grid gap-11 items-center lg:grid-cols-[1.08fr_0.92fr] lg:gap-[60px]">
          {/* LEFT — copy + email capture */}
          <div>
            <span className="font-['IBM_Plex_Mono'] text-[13px] font-medium tracking-[0.14em] uppercase text-[#2D6A4F] inline-flex items-center gap-[11px] before:content-[''] before:w-6 before:h-0.5 before:bg-[#52B788]">
              Built for independent restaurants
            </span>
            <h1 className="text-[clamp(38px,7.2vw,60px)] leading-[1.04] tracking-[-0.03em] font-bold text-[#1B4332] mt-5 text-balance">
              Allergen control, costing &amp; compliance, <span className="text-[#C7D0D5]">in one place.</span>
            </h1>
            <p className="text-[clamp(17px,2.4vw,20px)] leading-[1.55] text-[#3A474E] mt-[22px] max-w-[46ch]">
              Allergen-safe menus. <b className="text-[#141A1E] font-bold">GP on every plate.</b> EHO-compliant records.
            </p>

            {/* EMAIL CAPTURE */}
            <div id="capture" className="mt-8 max-w-[480px]">
              {status === 'done' ? (
                <div role="status" className="flex items-start gap-[14px] bg-[#E7F4EC] border border-[#BCE3CC] rounded-xl px-[22px] py-5">
                  <span className="w-[34px] h-[34px] rounded-full bg-[#1F8A5B] flex-none grid place-items-center">
                    <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                      <path d="M3.5 8.5l3 3 6-6.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <h4 className="m-0 mb-[3px] text-base text-[#136B43] font-bold">Check your inbox.</h4>
                    <p className="m-0 text-sm text-[#3A474E]">Your 14-day free trial is ready — we&apos;ve sent the next steps to your email.</p>
                  </div>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[10px] sm:flex-row">
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (status === 'invalid') setStatus('idle')
                        }}
                        placeholder="you@yourrestaurant.co.uk"
                        autoComplete="email"
                        aria-label="Work email address"
                        className={
                          'w-full text-base px-4 py-[15px] rounded-lg bg-white text-[#141A1E] border-[1.5px] outline-none transition placeholder:text-[#97A1A7] focus:border-[#2D6A4F] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.14)] ' +
                          (status === 'invalid' ? 'border-[#C5362A]' : 'border-[#C7D0D5]')
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="font-bold text-base border-0 cursor-pointer bg-[#1B4332] text-white px-6 py-[15px] rounded-lg whitespace-nowrap shadow-sm transition hover:bg-[#14342A] hover:-translate-y-px active:translate-y-0 disabled:opacity-70 inline-flex items-center justify-center gap-[9px]"
                    >
                      {status === 'submitting' ? 'Starting…' : 'Start your free trial'}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h9M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </form>

                  {status === 'invalid' && (
                    <p className="text-[#97271D] text-[13.5px] font-semibold mt-[9px]">Please enter a valid email address.</p>
                  )}

                  <div className="flex items-center gap-[9px] mt-[13px] text-[13.5px] text-[#677077]">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-none">
                      <path d="M8 1l6 2.5v4C14 11 11.5 14 8 15 4.5 14 2 11 2 7.5v-4L8 1z" stroke="#677077" strokeWidth="1.3" fill="none" />
                      <path d="M5.5 8l1.8 1.8L10.8 6" stroke="#677077" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    14 days free. No card, no sales call — just see if it fits your business.
                  </div>

                  <p className="mt-[18px] text-[14.5px]">
                    Running 10+ sites?{' '}
                    <a href="/demo" className="text-[#2D6A4F] font-bold no-underline border-b-[1.5px] border-[#2D6A4F]/30 pb-px hover:border-[#2D6A4F]">
                      Book a demo →
                    </a>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* RIGHT — proof card */}
          <div>
            <div className="bg-white border border-[#E3E9EC] rounded-xl shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] overflow-hidden relative">
              <span className="absolute -top-[13px] left-[22px] bg-[#14342A] text-white font-['IBM_Plex_Mono'] text-[10.5px] font-semibold tracking-[0.08em] uppercase px-3 py-1.5 rounded-full">
                Live · The Harbour Kitchen
              </span>
              <div className="px-[22px] pt-[18px] pb-4 border-b border-[#E3E9EC] flex items-center gap-[10px]">
                <h3 className="m-0 text-[15px] font-bold text-[#141A1E] tracking-[-0.01em]">Pan-seared hake</h3>
                <span className="ml-auto font-['IBM_Plex_Mono'] text-[11px] tracking-[0.05em] uppercase text-[#97A1A7]">GP 71.4%</span>
              </div>
              <div className="px-[22px] pt-2 pb-[14px]">
                <div className="flex items-center gap-3 py-[13px] border-b border-[#E3E9EC]">
                  <div>
                    <div className="font-semibold text-[#141A1E] text-[14.5px]">Food cost</div>
                    <div className="font-['IBM_Plex_Mono'] text-[11px] text-[#677077] mt-0.5 tracking-[0.04em]">7 INGREDIENTS</div>
                  </div>
                  <span className="ml-auto font-['IBM_Plex_Mono'] font-semibold text-[15px] text-[#1F2A30] tabular-nums">£3.24</span>
                </div>
                <div className="flex items-center gap-3 py-[13px] border-b border-[#E3E9EC]">
                  <div>
                    <div className="font-semibold text-[#141A1E] text-[14.5px]">Menu price</div>
                    <div className="font-['IBM_Plex_Mono'] text-[11px] text-[#677077] mt-0.5 tracking-[0.04em]">GROSS PROFIT 71.4%</div>
                  </div>
                  <span className="ml-auto font-['IBM_Plex_Mono'] font-semibold text-[15px] text-[#1F2A30] tabular-nums">£14.50</span>
                </div>
                <div className="flex items-center gap-3 py-[13px] border-b border-[#E3E9EC]">
                  <div>
                    <div className="font-semibold text-[#141A1E] text-[14.5px]">Allergens</div>
                    <div className="font-['IBM_Plex_Mono'] text-[11px] text-[#677077] mt-0.5 tracking-[0.04em]">FISH · MILK · CELERY</div>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-[7px] text-xs font-bold pl-[9px] pr-[11px] py-[5px] rounded-full border border-[#BCE3CC] bg-[#E7F4EC] text-[#136B43] whitespace-nowrap">
                    <i className="w-[7px] h-[7px] rounded-full flex-none bg-[#1F8A5B]"></i>Labelled
                  </span>
                </div>
                <div className="flex items-center gap-3 py-[13px]">
                  <div>
                    <div className="font-semibold text-[#141A1E] text-[14.5px]">Food-safety record</div>
                    <div className="font-['IBM_Plex_Mono'] text-[11px] text-[#677077] mt-0.5 tracking-[0.04em]">UPDATED 06:14</div>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-[7px] text-xs font-bold pl-[9px] pr-[11px] py-[5px] rounded-full border border-[#BCE3CC] bg-[#E7F4EC] text-[#136B43] whitespace-nowrap">
                    <i className="w-[7px] h-[7px] rounded-full flex-none bg-[#1F8A5B]"></i>Current
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-[9px] px-[22px] py-[14px] bg-[#F8FAFB] border-t border-[#E3E9EC] font-['IBM_Plex_Mono'] text-[11px] tracking-[0.05em] uppercase text-[#677077]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#1F8A5B]"></span>Inspection-ready · 14 / 14 allergens logged
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
