import MobileNav from './MobileNav'
import WaitlistForm from './WaitlistForm'

function MiseLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid grid-cols-2 gap-0.5 w-7 h-7">
        <div className={`rounded-sm ${light ? 'bg-white/80' : 'bg-[#1C3A2E]'}`} />
        <div className={`rounded-sm ${light ? 'bg-white/80' : 'bg-[#1C3A2E]'}`} />
        <div className={`rounded-sm ${light ? 'bg-white/80' : 'bg-[#1C3A2E]'}`} />
        <div className="rounded-sm bg-[#C8971A]" />
      </div>
      <span className={`font-medium tracking-wide text-lg ${light ? 'text-white' : 'text-[#1C3A2E]'}`}>mise</span>
    </div>
  )
}

function AllergenDots({ active }: { active: number[] }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${active.includes(i) ? 'bg-[#1C3A2E]' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-[#F5F0E8] min-h-screen font-sans text-[#1C3A2E]">

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[#F5F0E8]/95 backdrop-blur border-b border-[#1C3A2E]/10">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <MiseLogo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1C3A2E]">
            <a href="#why" className="hover:text-[#C8971A] transition-colors">Why mise</a>
            <a href="#features" className="hover:text-[#C8971A] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#C8971A] transition-colors">Pricing</a>
            <a href="#waitlist" className="bg-[#C8971A] hover:bg-[#b5851a] text-white px-5 py-2 rounded-full text-sm transition-colors">Join the waitlist</a>
          </div>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-[#1C3A2E]/8 rounded-full px-4 py-1.5 text-xs font-medium text-[#1C3A2E] mb-6 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8971A]" /> Built for UK independent kitchens
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#1C3A2E] leading-tight mb-5">
          The kitchen management platform that keeps you safe, profitable and calm.
        </h1>
        <p className="text-base md:text-lg text-[#4a6358] max-w-2xl mx-auto mb-8">
          mise helps you plan menus to maximise profitability, while tracking, managing and communicating accurate allergen and nutritional information.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <a href="#waitlist" className="bg-[#C8971A] hover:bg-[#b5851a] text-white font-semibold px-8 py-3.5 rounded-full text-sm transition-colors">
            Book a demo
          </a>
          <a href="#features" className="border border-[#1C3A2E]/30 text-[#1C3A2E] font-semibold px-8 py-3.5 rounded-full text-sm hover:bg-[#1C3A2E]/5 transition-colors">
            See how it works
          </a>
        </div>

        {/* Hero mockup card */}
        <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-lg p-5 text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>mise · the harbour kitchen</span>
              <span className="bg-[#1C3A2E] text-white text-[10px] px-2 py-0.5 rounded-full font-medium">LIVE MENU</span>
            </div>
          </div>
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="font-semibold text-[#1C3A2E]">Pan-roasted hake</p>
              <p className="text-xs text-gray-500">Sea salt, brown shrimp butter, greens</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-[#1C3A2E]">71<span className="text-sm">%</span></p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">GP</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
            {['Fish', 'Milk', 'Crustaceans', 'Gluten', 'Nuts', 'Egg', 'Soya'].map(a => (
              <span key={a} className="text-[11px] bg-[#F5F0E8] text-[#1C3A2E] px-2.5 py-1 rounded-full border border-[#1C3A2E]/10">{a}</span>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 text-[11px] text-[#4a6358] flex items-center gap-1.5">
            <span className="text-green-500">✓</span>
            All 14 allergens checked · staff sign-off complete · QR menu updated
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section id="why" className="bg-[#1C3A2E] text-white py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#C8971A] text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-6 h-px bg-[#C8971A] inline-block" /> The problem
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-10">
            Spreadsheets weren&apos;t built to keep people safe.
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Allergens', body: "Most kitchens run allergens out of a tangle of spreadsheets and memory. It works — until the day it doesn't." },
              { label: 'Revenue', body: "Don't price on instinct and hope the margins work out… Often they don't." },
              { label: 'Staff', body: "Many restaurants depend on one person knowing everything. That's not a system — it's a risk." },
            ].map(item => (
              <div key={item.label}>
                <p className="font-semibold text-white mb-1">{item.label}:</p>
                <p className="text-white/70 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: '⚠️',
                title: 'Compliance is non-negotiable',
                body: 'UK law requires every dish to declare all 14 allergens, accurately, no excuses. One out-of-date cell in a spreadsheet is a genuine risk — to your guests, and to your business.',
                highlight: 'The margin for error is zero.',
              },
              {
                icon: '📉',
                title: 'Margins slip away quietly',
                body: "Ingredient prices move every week. Without live recipe costing you're guessing your GP% — and on tight margins, guesses are what close kitchens.",
                highlight: "You can't protect what you can't see.",
              },
              {
                icon: '👤',
                title: 'Empower every shift',
                body: 'When knowledge is shared, any member of your team can step up with confidence. Built-in training and sign-off keep everyone sharp — so the kitchen runs smoothly whoever\'s on.',
                highlight: 'A confident team is a resilient team.',
              },
            ].map(card => (
              <div key={card.title} className="bg-white/10 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg mb-4">{card.icon}</div>
                <h3 className="font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-2">{card.body}</p>
                <p className="text-[#C8971A] text-sm font-medium">{card.highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#C8971A] text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-6 h-px bg-[#C8971A] inline-block" /> Everything in one place
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1C3A2E] mb-3">
            Four tools your kitchen actually needs.
          </h2>
          <p className="text-[#4a6358] mb-10 max-w-xl">
            No bloat, no jargon. Just the things that keep you compliant, profitable and calm.
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            {/* 01 Allergen matrix */}
            <div className="bg-white rounded-2xl p-6">
              <p className="text-[#C8971A] text-xs font-semibold mb-4">01</p>
              <div className="w-11 h-11 rounded-xl bg-[#F5F0E8] flex items-center justify-center text-xl mb-4">⊞</div>
              <h3 className="text-xl font-semibold text-[#1C3A2E] mb-2">Allergen matrix</h3>
              <p className="text-[#4a6358] text-sm leading-relaxed mb-5">
                Every dish, all 14 allergens, one clear grid. Update an ingredient once and your menu, kitchen and staff stay in sync.
              </p>
              <div className="space-y-2.5 border-t border-gray-100 pt-4">
                {[
                  { name: 'Hake', active: [0, 1] },
                  { name: 'Soda bread', active: [0, 2, 3] },
                  { name: 'Lemon tart', active: [1, 2, 5, 6] },
                ].map(dish => (
                  <div key={dish.name} className="flex items-center justify-between">
                    <span className="text-sm text-[#1C3A2E]">{dish.name}</span>
                    <AllergenDots active={dish.active} />
                  </div>
                ))}
              </div>
            </div>

            {/* 02 Recipe costing */}
            <div className="bg-white rounded-2xl p-6">
              <p className="text-[#C8971A] text-xs font-semibold mb-4">02</p>
              <div className="w-11 h-11 rounded-xl bg-[#F5F0E8] flex items-center justify-center text-xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-[#1C3A2E] mb-2">Recipe costing & GP%</h3>
              <p className="text-[#4a6358] text-sm leading-relaxed mb-5">
                Live ingredient prices feed straight into each recipe, so you always know your margin before the plate leaves the pass.
              </p>
              <div className="space-y-2.5 border-t border-gray-100 pt-4">
                {[
                  { name: 'Target GP', value: '70%', highlight: false },
                  { name: 'Hake — current', value: '71%', highlight: true },
                  { name: 'Lemon tart — current', value: '64%', highlight: true },
                ].map(row => (
                  <div key={row.name} className="flex items-center justify-between text-sm">
                    <span className="text-[#4a6358]">{row.name}</span>
                    <span className={row.highlight ? 'font-semibold text-[#C8971A]' : 'text-[#1C3A2E]'}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 03 Staff training */}
            <div className="bg-white rounded-2xl p-6">
              <p className="text-[#C8971A] text-xs font-semibold mb-4">03</p>
              <div className="w-11 h-11 rounded-xl bg-[#F5F0E8] flex items-center justify-center text-xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold text-[#1C3A2E] mb-2">Staff training & quizzes</h3>
              <p className="text-[#4a6358] text-sm leading-relaxed mb-5">
                Short, friendly quizzes keep your team sharp and give you a dated record of who knows what — ready the moment anyone asks.
              </p>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#4a6358]">Front of house</span>
                  <span className="font-semibold text-[#1C3A2E]">6 / 6 signed off</span>
                </div>
              </div>
            </div>

            {/* 04 QR menu */}
            <div className="bg-white rounded-2xl p-6">
              <p className="text-[#C8971A] text-xs font-semibold mb-4">04</p>
              <div className="w-11 h-11 rounded-xl bg-[#F5F0E8] flex items-center justify-center text-xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-[#1C3A2E] mb-2">Public QR menu</h3>
              <p className="text-[#4a6358] text-sm leading-relaxed mb-5">
                A clean, always-current allergen menu guests scan at the table. Change a dish and it updates instantly — no reprints, no panic.
              </p>
              <div className="space-y-2.5 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#4a6358]">Guest-facing menu</span>
                  <span className="text-green-600 font-semibold">Live</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#4a6358]">Last updated</span>
                  <span className="text-[#1C3A2E]">2 minutes ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-5 bg-white">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-[#C8971A] text-xs font-semibold uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <span className="w-6 h-px bg-[#C8971A] inline-block" /> Simple, honest pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1C3A2E] mb-3">
            One plan. Everything included.
          </h2>
          <p className="text-[#4a6358] mb-8">No per-seat fees, no surprise add-ons. Cancel any time.</p>

          <div className="bg-[#F5F0E8] rounded-2xl p-7 text-left">
            <div className="text-center mb-6">
              <span className="inline-block bg-[#1C3A2E] text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                Waitlist · Early-access price
              </span>
              <p className="text-xs text-[#4a6358] uppercase tracking-widest mb-1">From</p>
              <p className="text-5xl font-bold text-[#1C3A2E]">
                £49<span className="text-xl font-normal text-[#4a6358]"> / month</span>
              </p>
            </div>

            <ul className="space-y-2.5 mb-6">
              {[
                'Allergen matrix for unlimited dishes',
                'Recipe costing & live GP% tracking',
                'Staff training, quizzes & sign-off records',
                'Public QR allergen menu',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-[#1C3A2E]">
                  <span className="text-[#C8971A] font-bold mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="#waitlist"
              className="block w-full bg-[#C8971A] hover:bg-[#b5851a] text-white font-semibold py-3.5 rounded-full text-center text-sm transition-colors"
            >
              Join the waitlist
            </a>
            <p className="text-center text-xs text-[#4a6358] mt-3">
              30 days free, then an early-access discount for your first 6 months.
            </p>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="py-16 px-5">
        <div className="max-w-md mx-auto">
          <p className="text-[#C8971A] text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-6 h-px bg-[#C8971A] inline-block" /> Early access
          </p>
          <h2 className="text-3xl font-serif font-bold text-[#1C3A2E] mb-3">
            Join the mise waitlist
          </h2>
          <p className="text-[#4a6358] text-sm mb-8">
            Be first in when we open. Waitlist members get 30 days free, plus an early-access discount for their first 6 months.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1C3A2E] text-white px-5 pt-12 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <MiseLogo light />
            <p className="text-white/60 text-sm mt-3 max-w-xs leading-relaxed">
              Focus on the food. Leave the rest to us. Made for UK independent kitchens.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm font-medium text-white/80 mb-8">
            <a href="#why" className="hover:text-white transition-colors">Why mise</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#waitlist" className="hover:text-white transition-colors">Join waitlist</a>
          </div>
          <div className="border-t border-white/10 pt-6 text-white/40 text-xs space-y-1">
            <p>© 2026 mise Ltd. All rights reserved.</p>
            <p>Compliance support, not legal advice.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
