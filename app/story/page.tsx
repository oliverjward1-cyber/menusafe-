import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Story — HospoPilot',
  description:
    "We didn't read about this problem. We lived it. Why two hospitality operators built HospoPilot for independent restaurants.",
}

const TAGS = ['Front of house', 'Head chef', 'General manager', 'Independent operator']

export default function StoryPage() {
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
          <Link
            href="/signup"
            className="inline-flex items-center text-[14.5px] font-bold text-white bg-[#1B4332] px-[18px] py-[10px] rounded-lg no-underline whitespace-nowrap leading-none hover:bg-[#14342A] transition-colors"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto w-full max-w-[760px] px-6 pt-12 md:pt-16 text-center">
        <span className="font-['IBM_Plex_Mono'] text-[13px] font-medium tracking-[0.14em] uppercase text-[#2D6A4F]">
          Our story
        </span>
        <h1 className="text-[clamp(32px,5.4vw,52px)] leading-[1.08] tracking-[-0.02em] font-bold text-[#1B4332] mt-4 text-balance">
          {`We didn't read about this problem. We lived it.`}
        </h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {TAGS.map((t) => (
            <span
              key={t}
              className="font-['IBM_Plex_Mono'] text-[11.5px] tracking-[0.04em] uppercase text-[#677077] bg-white border border-[#E3E9EC] rounded-full px-3 py-1.5"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* PHOTO — placeholder until the final edited image is supplied (swap for <img src="/founders.jpg" />) */}
      <div className="mx-auto w-full max-w-[760px] px-6 mt-10">
        <div className="aspect-[16/10] w-full rounded-2xl border border-[#E3E9EC] bg-gradient-to-br from-[#EAF1ED] to-[#E7F4EC] flex items-center justify-center">
          <span className="font-['IBM_Plex_Mono'] text-[12px] tracking-[0.06em] uppercase text-[#9FB3A8]">
            Drew &amp; Oliver — photo coming
          </span>
        </div>
      </div>

      {/* ARTICLE */}
      <article className="mx-auto w-full max-w-[680px] px-6 py-12 md:py-16 space-y-5 text-[17px] leading-[1.65] text-[#3A474E]">
        <p>{`Drew spent years running front of house. GM positions across multiple sites — including Oliver's. Oliver ran Harbour Kitchen as owner and head chef. The kind of place where he was in the kitchen at 6am and still there at midnight, and the entire menu lived in his head.`}</p>
        <p>{`Between them, they've done nearly every job hospitality throws at you. And like anyone serious about their restaurant, they cared. Standards were high. The kitchen was clean. The team knew their stuff.`}</p>
        <p className="text-[#141A1E] font-semibold">{`But allergen records? GP margins? Staff training sign-offs? That was a different story.`}</p>

        <h2 className="text-[26px] font-bold text-[#1B4332] pt-6">The EHO knock</h2>
        <p>{`You know the feeling. Unannounced. The inspector at the door. Your ring binder somewhere under a stack of invoices and a delivery note from last Tuesday.`}</p>
        <p>{`Your kitchen is clean. Your team are trained. But in that moment, none of it counts if your paperwork doesn't back it up.`}</p>
        <p>{`We felt that more than once. The stomach drop. The scramble. The relief — and then the quiet resolution: we need to sort this.`}</p>

        <h2 className="text-[26px] font-bold text-[#1B4332] pt-6">Five apps and still falling through the gaps</h2>
        <p>{`We tried to fix it the way most operators do. With software. One app for delivery checks. Another for staff onboarding and allergen training. A spreadsheet for GP. Something else for the menu. Change an ingredient price and you're doing the maths by hand.`}</p>
        <p>{`Nothing talked to anything else. The more you patched it together, the more things slipped between the joins.`}</p>
        <p>{`Sometimes the business would quietly lose money — not through any single failure, but through a price rise here, a portion drift there. And without sitting down with every piece of paper you owned, you couldn't see it until it hurt.`}</p>

        <h2 className="text-[26px] font-bold text-[#1B4332] pt-6">The thing we kept coming back to</h2>
        <p>{`Imagine if you never had to think about the paperwork again. Not because it didn't matter — because it was already done. Live, correctly, every day. So when the EHO walked in, you could look them in the eye and hand them everything. No scramble. No apology.`}</p>

        <blockquote className="my-8 border-l-[3px] border-[#52B788] pl-5 py-1">
          <p className="text-[clamp(20px,3vw,24px)] leading-[1.4] font-semibold text-[#1B4332] italic">
            {`"If we could stop worrying about whether our records were up to date — we could focus entirely on the customer and the food. That's what we actually got into this for."`}
          </p>
        </blockquote>

        <p>{`And what if your food costs, your GP, your menu — all of it was visible in one place? So you could make a decision at 4pm in the prep kitchen, not in a crisis meeting three weeks later.`}</p>
        <p className="text-[#141A1E] font-semibold">{`That's what we wanted. That's what didn't exist. So we built it.`}</p>

        <h2 className="text-[26px] font-bold text-[#1B4332] pt-6">Built for independents. Only for independents.</h2>
        <p>{`HospoPilot isn't for chains. It isn't for groups with a compliance manager and a head of training. It's for the operator doing it themselves — with a small, stretched team — trying to run a great restaurant and stay on top of everything else at the same time.`}</p>
        <p>{`We know what that feels like. We've been that person. And we built the tool we always needed.`}</p>

        {/* Byline */}
        <div className="pt-8 mt-8 border-t border-[#E3E9EC]">
          <p className="font-bold text-[#1B4332] text-[17px]">Drew &amp; Oliver</p>
          <p className="font-['IBM_Plex_Mono'] text-[12.5px] tracking-[0.04em] uppercase text-[#677077] mt-1">
            Co-Founders, HospoPilot · South West, UK
          </p>
        </div>
      </article>

      {/* BOTTOM CTA */}
      <section className="border-t border-[#E3E9EC] py-14 md:py-20">
        <div className="mx-auto w-full max-w-[680px] px-6 text-center">
          <h2 className="text-[clamp(24px,4vw,34px)] leading-[1.15] font-bold text-[#1B4332]">
            {`Built for operators like you.`}
          </h2>
          <p className="text-[#3A474E] text-[17px] mt-3">
            {`Be inspection-ready every day — not just the day before.`}
          </p>
          <Link
            href="/signup"
            className="mt-7 inline-flex items-center justify-center gap-[9px] bg-[#1B4332] text-white font-bold text-base px-7 py-[15px] rounded-lg no-underline hover:bg-[#14342A] transition-colors"
          >
            Start your free trial
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h9M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-[13.5px] text-[#677077] mt-4">14 days free. No card, no sales call.</p>
        </div>
      </section>
    </div>
  )
}
