import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E3E9EC]">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-12 md:py-14">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Brand */}
          <div className="max-w-[340px]">
            <Link href="/" className="inline-flex items-center gap-[11px] no-underline">
              <svg width="28" height="28" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="40" height="40" rx="10" fill="#1B4332" />
                <path d="M22 9 C 23 18.4 25.6 21 35 22 C 25.6 23 23 25.6 22 35 C 21 25.6 18.4 23 9 22 C 18.4 21 21 18.4 22 9 Z" fill="#D4A017" />
              </svg>
              <span className="text-[19px] font-bold tracking-[-0.02em] text-[#1B4332]">
                Hospo<b className="text-[#2D6A4F]">Pilot</b>
              </span>
            </Link>
            <p className="text-[14px] text-[#677077] mt-3 leading-[1.55]">
              Inspection-ready every day. Built for independent restaurants.
            </p>
            <p className="text-[13px] font-semibold text-[#2D6A4F] mt-3">
              14 days free · No card · Cancel anytime
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12 sm:gap-16">
            <div>
              <p className="font-['IBM_Plex_Mono'] text-[11px] tracking-[0.08em] uppercase text-[#97A1A7] mb-3">Product</p>
              <ul className="space-y-2.5 text-[14.5px] text-[#3A474E]">
                <li><Link href="/pricing" className="no-underline hover:text-[#1B4332] transition-colors">Pricing</Link></li>
                <li><Link href="/story" className="no-underline hover:text-[#1B4332] transition-colors">Our story</Link></li>
                <li><Link href="/signup" className="no-underline hover:text-[#1B4332] transition-colors">Start free trial</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-['IBM_Plex_Mono'] text-[11px] tracking-[0.08em] uppercase text-[#97A1A7] mb-3">Company</p>
              <ul className="space-y-2.5 text-[14.5px] text-[#3A474E]">
                <li><a href="mailto:support@hospopilot.co.uk" className="no-underline hover:text-[#1B4332] transition-colors">Contact</a></li>
                <li><Link href="/terms" className="no-underline hover:text-[#1B4332] transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="no-underline hover:text-[#1B4332] transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* bottom bar — registered company number + address to be added here */}
        <div className="mt-10 pt-6 border-t border-[#E3E9EC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[12.5px] text-[#97A1A7]">© 2026 HospoPilot. All rights reserved.</p>
          <p className="text-[12.5px] text-[#97A1A7]">UK · support@hospopilot.co.uk</p>
        </div>
      </div>
    </footer>
  )
}
