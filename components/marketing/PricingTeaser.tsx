// Condensed pricing section for the landing — DRAFT (Drew to confirm we want
// pricing on the landing vs only the /pricing page). Surfaces price + the
// founding-restaurant offer (honest urgency). Full detail lives on /pricing.

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-none mt-0.5" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="#E7F4EC" />
      <path d="M4.5 8.2l2.2 2.2 4.8-5" stroke="#1F8A5B" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PricingTeaser() {
  return (
    <section id="pricing" className="border-t border-[#E3E9EC] py-12 md:py-16 scroll-mt-20">
      <div className="mx-auto w-full max-w-[920px] px-6">
        <div className="text-center max-w-[620px] mx-auto">
          <span className="font-['IBM_Plex_Mono'] text-[13px] font-medium tracking-[0.14em] uppercase text-[#2D6A4F]">
            Pricing
          </span>
          <h2 className="text-[clamp(26px,4vw,38px)] leading-[1.12] tracking-[-0.02em] font-bold text-[#1B4332] mt-3 text-balance">
            Simple pricing. No surprises.
          </h2>
          <p className="text-[16px] text-[#3A474E] mt-3">
            14 days free, no card. Then less than a main course a day.
          </p>
        </div>

        {/* Founding offer — honest urgency */}
        <div className="mt-8 max-w-[680px] mx-auto">
          <div className="flex items-center justify-center gap-3 rounded-xl bg-[#FBF4DD] border border-[#EAD9A3] px-5 py-3.5 text-center">
            <span className="text-lg leading-none">🌱</span>
            <p className="text-[14.5px] text-[#7a5d12]">
              <b className="text-[#5e470c] font-bold">Founding restaurants:</b> be one of our first 25 and lock today&apos;s price for life.
            </p>
          </div>
        </div>

        {/* Tiers */}
        <div className="mt-6 grid gap-5 md:grid-cols-2 items-start">
          {/* EHO Compliance */}
          <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-7">
            <h3 className="text-[19px] font-bold text-[#1B4332]">EHO Compliance</h3>
            <p className="text-[14px] text-[#677077] mt-1">Be inspection-ready every day.</p>
            <div className="mt-4 flex items-end gap-1.5">
              <span className="text-[36px] font-bold text-[#141A1E] leading-none tracking-[-0.02em]">£79</span>
              <span className="text-[15px] text-[#677077] mb-1">/month</span>
            </div>
            <p className="font-['IBM_Plex_Mono'] text-[12px] text-[#97A1A7] mt-1.5">≈ £2.60 a day</p>
            <ul className="mt-5 space-y-2.5 text-[14px] text-[#3A474E]">
              <li className="flex items-start gap-2.5"><Check />Allergens, temps, cleaning, deliveries & incidents</li>
              <li className="flex items-start gap-2.5"><Check />Staff allergen training & EHO mode</li>
            </ul>
            <a href="/signup" className="mt-6 w-full inline-flex items-center justify-center border-[1.5px] border-[#1B4332] text-[#1B4332] font-bold text-[15px] px-6 py-3 rounded-lg no-underline hover:bg-[#1B4332] hover:text-white transition-colors">
              Start your free trial
            </a>
          </div>

          {/* EHO Compliance + Profit */}
          <div className="bg-white rounded-2xl border-[1.5px] border-[#1B4332] shadow-[0_4px_24px_-6px_rgba(27,67,50,0.25)] p-7 relative">
            <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 bg-[#1B4332] text-white font-['IBM_Plex_Mono'] text-[10.5px] font-semibold tracking-[0.08em] uppercase px-3 py-1.5 rounded-full whitespace-nowrap">
              Most popular
            </span>
            <h3 className="text-[19px] font-bold text-[#1B4332]">EHO Compliance + Profit</h3>
            <p className="text-[14px] text-[#677077] mt-1">Plus the margin on every plate.</p>
            <div className="mt-4 flex items-end gap-1.5">
              <span className="text-[36px] font-bold text-[#141A1E] leading-none tracking-[-0.02em]">£129</span>
              <span className="text-[15px] text-[#677077] mb-1">/month</span>
            </div>
            <p className="font-['IBM_Plex_Mono'] text-[12px] text-[#97A1A7] mt-1.5">≈ £4.30 a day</p>
            <ul className="mt-5 space-y-2.5 text-[14px] text-[#3A474E]">
              <li className="flex items-start gap-2.5"><Check />Everything in EHO Compliance</li>
              <li className="flex items-start gap-2.5"><Check />Recipe costing & live GP% on every dish</li>
            </ul>
            <a href="/signup" className="mt-6 w-full inline-flex items-center justify-center bg-[#1B4332] text-white font-bold text-[15px] px-6 py-3 rounded-lg no-underline hover:bg-[#14342A] transition-colors">
              Start your free trial
            </a>
          </div>
        </div>

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-x-5 gap-y-2 text-[14px]">
          <span className="text-[#677077]">Running a group? From £50 per site —{' '}
            <a href="mailto:support@hospopilot.co.uk?subject=HospoPilot%20for%20groups" className="font-semibold text-[#2D6A4F] hover:text-[#1B4332]">book a demo</a>
          </span>
          <a href="/pricing" className="font-bold text-[#2D6A4F] hover:text-[#1B4332] no-underline border-b-[1.5px] border-[#2D6A4F]/30 pb-px hover:border-[#2D6A4F] transition-colors">
            See everything included →
          </a>
        </div>
      </div>
    </section>
  )
}
