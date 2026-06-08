import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-mise-cream">
      {/* Nav */}
      <nav className="border-b border-mise-deep/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="0" y="0" width="10" height="10" rx="2.5" fill="#1B4332" />
              <rect x="12" y="0" width="10" height="10" rx="2.5" fill="#1B4332" />
              <rect x="0" y="12" width="10" height="10" rx="2.5" fill="#1B4332" />
              <rect x="12" y="12" width="10" height="10" rx="2.5" fill="#D4A017" />
            </svg>
            <span className="font-display text-xl font-semibold text-mise-deep">HospoPilot</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-mise-ink/60">
            <a href="#why" className="hover:text-mise-ink transition-colors">Why HospoPilot</a>
            <a href="#features" className="hover:text-mise-ink transition-colors">Features</a>
            <a href="#pricing" className="hover:text-mise-ink transition-colors">Pricing</a>
          </div>
          <Link
            href="/signup"
            className="bg-mise-gold text-white text-sm font-semibold rounded-full px-5 py-2.5 hover:bg-mise-gold/90 transition-colors"
          >
            Book a demo
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <p className="text-mise-gold text-sm font-semibold mb-4">Built for UK kitchens</p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-mise-deep leading-tight">
          The kitchen management platform that keeps you safe.
        </h1>
        <p className="text-mise-ink/60 text-lg sm:text-xl mt-6 max-w-xl mx-auto">
          Allergens, recipe costing, staff training and QR menus — all in one place.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/signup"
            className="bg-mise-gold text-white text-sm font-semibold rounded-full px-7 py-3 hover:bg-mise-gold/90 transition-colors"
          >
            Book a demo
          </Link>
          <Link
            href="/onboarding"
            className="border border-mise-deep/30 text-mise-deep text-sm font-semibold rounded-full px-7 py-3 hover:bg-mise-deep/5 transition-colors"
          >
            See how it works
          </Link>
        </div>

        {/* Recipe preview card */}
        <div className="mt-16 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.07)] p-5 max-w-md mx-auto text-left">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-mise-ink text-base">Pan-roasted hake</p>
              <p className="text-sm text-mise-ink/40 mt-0.5">Sea salt, brown shrimp butter, greens</p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-mise-ink text-2xl leading-none">71%</p>
              <p className="text-xs text-mise-ink/40 mt-1">GP</p>
            </div>
          </div>
          <div className="border-t border-black/[0.06] mt-4 pt-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {['Fish', 'Milk', 'Crustaceans'].map(tag => (
                <span key={tag} className="bg-mise-fresh/20 text-mise-deep text-xs font-semibold rounded-full px-2.5 py-1">
                  {tag}
                </span>
              ))}
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-semibold rounded-full px-2.5 py-1">LIVE</span>
          </div>
        </div>
      </section>
    </div>
  )
}
