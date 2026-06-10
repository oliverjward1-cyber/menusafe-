import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — HospoPilot',
  description:
    'Simple pricing for independent restaurants. Be inspection-ready every day from £79/month. 14 days free, no card.',
}

const COMPLIANCE_FEATURES = [
  'Allergen matrix for every dish (all 14 UK allergens)',
  'Daily temperature, cleaning & delivery logs',
  'Incident & corrective-action records',
  'HACCP + the daily trail, signed off on a phone',
  'Staff allergen training & pass/fail records',
  'EHO mode — hand the inspector everything in seconds',
]

const PROFIT_FEATURES = [
  'Recipe costing & live GP% on every dish',
  'Menu builder with profit built in',
  'Catch a price rise or portion drift before it costs you',
]

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="flex-none mt-0.5" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="#E7F4EC" />
      <path d="M4.5 8.2l2.2 2.2 4.8-5" stroke="#1F8A5B" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PricingPage() {
  return (
    <div
      className="min-h-screen bg-[#F8FAFB] text-[#3A474E] font-['Hanken_Grotesk'] antialiased"
      style={{
        backgroundImage:
          'radial-gradient(#E2E8EC 1px, transparent 1px), linear-gradient(to right, #ECF0F2 1px, transparent 1px), linear-gradient(to bottom, #ECF0F2 1px, transparent 1px)',
        backgroundSize: '22px 22px, 88px 88px, 88px 88px',
      }}
    >
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#F8FAFB]/[.86] backdrop-blur-md border-b border-[#E3E9EC]">
        <div className="mx-auto w-full max-w-[1180px] px-6 flex items-center justify-between h-[66px]">
          <Link href="/" className="inline-flex items-center gap-[11px] no-underline">
            <svg width="30" height="30" viewBox="0 0 44 44" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="40" height="40" rx="10" fill="#1B4332" />
              <path d="M22 9 C 23 18.4 25.6 21 35 22 C 25.6 23 23 25.6 22 35 C 21 25.6 18.4 23 9 22 C 18.4 21 21 18.4 22 9 Z" fill="#D4A017" />
            </svg>
            <span className="text-[21px] font-bold tracking-[-0.02em] text-[#1B4332]">
              Hospo<b className="text-[#2D6A4F]">Pilot</b>
            </span>
          </Link>
          <div className="flex items-center gap-5 sm:gap-7">
            <nav className="flex items-center gap-5 sm:gap-6 text-[14.5px] font-semibold text-[#677077]">
              <Link href="/story" className="hidden sm:inline no-underline hover:text-[#1B4332] transition-colors">Our story</Link>
              <Link href="/pricing" className="no-underline hover:text-[#1B4332] transition-colors">Pricing</Link>
            </nav>
            <Link
              href="/signup"
              className="inline-flex items-center text-[14.5px] font-bold text-white bg-[#1B4332] px-[18px] py-[10px] rounded-lg no-underline whitespace-nowrap leading-none hover:bg-[#14342A] transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto w-full max-w-[760px] px-6 pt-12 md:pt-16 text-center">
        <span className="font-['IBM_Plex_Mono'] text-[13px] font-medium tracking-[0.14em] uppercase text-[#2D6A4F]">
          Pricing
        </span>
        <h1 className="text-[clamp(32px,5.4vw,50px)] leading-[1.08] tracking-[-0.02em] font-bold text-[#1B4332] mt-4 text-balance">
          Simple pricing. No surprises.
        </h1>
        <p className="text-[clamp(16px,2.4vw,19px)] leading-[1.55] text-[#3A474E] mt-4 max-w-[44ch] mx-auto">
          One subscription that keeps you inspection-ready every day. 14 days free — no card, no sales call.
        </p>
      </section>

      {/* FOUNDING OFFER */}
      <div className="mx-auto w-full max-w-[920px] px-6 mt-9">
        <div className="flex items-center justify-center gap-3 rounded-xl bg-[#FBF4DD] border border-[#EAD9A3] px-5 py-3.5 text-center">
          <span className="text-lg leading-none">🌱</span>
          <p className="text-[14.5px] text-[#7a5d12]">
            <b className="text-[#5e470c] font-bold">Founding restaurants:</b> be one of our first 25 and lock today&apos;s price for life.
          </p>
        </div>
      </div>

      {/* TIERS */}
      <section className="mx-auto w-full max-w-[920px] px-6 py-10 md:py-12">
        <div className="grid gap-6 md:grid-cols-2 items-start">
          {/* EHO Compliance */}
          <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-7 md:p-8">
            <h2 className="text-[20px] font-bold text-[#1B4332]">EHO Compliance</h2>
            <p className="text-[14.5px] text-[#677077] mt-1 leading-snug">
              Be inspection-ready every day — not just the day before.
            </p>
            <div className="mt-5 flex items-end gap-1.5">
              <span className="text-[40px] font-bold text-[#141A1E] leading-none tracking-[-0.02em]">£79</span>
              <span className="text-[15px] text-[#677077] mb-1">/month</span>
            </div>
            <p className="font-['IBM_Plex_Mono'] text-[12px] text-[#97A1A7] mt-1.5 tracking-[0.03em]">≈ £2.60 a day</p>
            <Link
              href="/signup"
              className="mt-6 w-full inline-flex items-center justify-center bg-white border-[1.5px] border-[#1B4332] text-[#1B4332] font-bold text-[15px] px-6 py-3 rounded-lg no-underline hover:bg-[#1B4332] hover:text-white transition-colors"
            >
              Start your free trial
            </Link>
            <ul className="mt-7 space-y-3">
              {COMPLIANCE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14.5px] text-[#3A474E] leading-snug">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* EHO Compliance + Profit */}
          <div className="bg-white rounded-2xl border-[1.5px] border-[#1B4332] shadow-[0_4px_24px_-6px_rgba(27,67,50,0.25)] p-7 md:p-8 relative">
            <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 bg-[#1B4332] text-white font-['IBM_Plex_Mono'] text-[10.5px] font-semibold tracking-[0.08em] uppercase px-3 py-1.5 rounded-full whitespace-nowrap">
              Most popular
            </span>
            <h2 className="text-[20px] font-bold text-[#1B4332]">EHO Compliance + Profit</h2>
            <p className="text-[14.5px] text-[#677077] mt-1 leading-snug">
              Everything in EHO Compliance — plus the margin on every plate.
            </p>
            <div className="mt-5 flex items-end gap-1.5">
              <span className="text-[40px] font-bold text-[#141A1E] leading-none tracking-[-0.02em]">£129</span>
              <span className="text-[15px] text-[#677077] mb-1">/month</span>
            </div>
            <p className="font-['IBM_Plex_Mono'] text-[12px] text-[#97A1A7] mt-1.5 tracking-[0.03em]">≈ £4.30 a day</p>
            <Link
              href="/signup"
              className="mt-6 w-full inline-flex items-center justify-center bg-[#1B4332] text-white font-bold text-[15px] px-6 py-3 rounded-lg no-underline hover:bg-[#14342A] transition-colors"
            >
              Start your free trial
            </Link>
            <p className="mt-7 text-[13px] font-semibold text-[#1B4332]">Everything in EHO Compliance, plus:</p>
            <ul className="mt-3 space-y-3">
              {PROFIT_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14.5px] text-[#3A474E] leading-snug">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* reassurance */}
        <p className="text-center font-['IBM_Plex_Mono'] text-[12px] tracking-[0.04em] uppercase text-[#97A1A7] mt-8">
          14 days free · No card · Cancel anytime
        </p>
      </section>

      {/* GROUPS */}
      <section className="border-t border-[#E3E9EC] py-12 md:py-16">
        <div className="mx-auto w-full max-w-[920px] px-6">
          <div className="rounded-2xl bg-white border border-[#E3E9EC] p-7 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex-1">
              <h3 className="text-[19px] font-bold text-[#1B4332]">Running a group?</h3>
              <p className="text-[14.5px] text-[#677077] mt-1 leading-snug">
                One dashboard across all your venues, from <b className="text-[#1B4332]">£50 per site / month</b>. We&apos;ll set you up.
              </p>
            </div>
            <a
              href="mailto:support@hospopilot.co.uk?subject=HospoPilot%20for%20groups"
              className="inline-flex items-center justify-center whitespace-nowrap border-[1.5px] border-[#1B4332] text-[#1B4332] font-bold text-[15px] px-6 py-3 rounded-lg no-underline hover:bg-[#1B4332] hover:text-white transition-colors"
            >
              Book a demo
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
