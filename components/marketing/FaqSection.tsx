// FAQ — objection handling. Native <details> accordion (no JS needed, accessible).
// NOTE: a few answers contain claims to confirm before publishing — see the
// landing-cro-roadmap memory / the build summary (setup time, offline, FSA
// wording, post-trial behaviour).

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How long does it take to set up?',
    a: `About an afternoon — and you'll have something useful on day one. Snap a photo of your menu and HospoPilot drafts every dish with its allergens automatically, so your allergen matrix is live the same day. Your daily temperature, cleaning and delivery checks move onto the team's phones in minutes.`,
  },
  {
    q: 'We already do all this on paper. Why change?',
    a: `Paper works — until the day it doesn't. Your kitchen's clean and your team are trained, but if the EHO asks for last Tuesday's fridge temps and the binder's three months patchy, none of it counts. HospoPilot makes every record timestamped, complete and pullable in seconds — so "we do everything right" becomes something you can actually prove.`,
  },
  {
    q: "I'm not very techy — is it complicated?",
    a: `If you can use Instagram, you can use HospoPilot. Checks are 30-second taps on a phone, and most of the allergen setup happens from a single photo of your menu. There's no training day and no manual to wade through.`,
  },
  {
    q: "What if the wifi goes down when the EHO's standing there?",
    a: `Your records live in the cloud, not on the restaurant wifi — so they're there on any phone with mobile data, wherever you are. Nothing important is trapped on a single device.`,
  },
  {
    q: 'Will an EHO actually accept digital records?',
    a: `Yes — digital records are increasingly the norm, and the FSA's guidance points firmly towards clear, written allergen information. A complete, timestamped digital trail is exactly the "confidence in management" an inspector wants to see.`,
  },
  {
    q: 'How much does it cost?',
    a: `From £79 a month — less than the price of one main course a day — for everything you need to stay inspection-ready. Add live GP and recipe costing for £129. You get 14 days free first, with no card required.`,
  },
  {
    q: 'Isn’t this just Trail?',
    a: `Trail is a task-and-checklist app built for chains with a compliance manager and a head of training. HospoPilot is built for the independent doing it all themselves — designed around exactly what an EHO scores. And it does things a checklist app doesn't: it builds your allergen matrix straight from a photo of your menu, and shows live GP on every plate.`,
  },
  {
    q: 'What happens when the free trial ends?',
    a: `Nothing automatic — there's no card on file, so you're never charged by surprise. After 14 days you simply choose whether to carry on, and you can cancel any time. Your data is always yours.`,
  },
]

function Chevron() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="flex-none text-[#2D6A4F] transition-transform duration-200 group-open:rotate-180"
    >
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-[#E3E9EC] py-12 md:py-16 scroll-mt-20">
      <div className="mx-auto w-full max-w-[760px] px-6">
        <div className="text-center max-w-[620px] mx-auto">
          <span className="font-['IBM_Plex_Mono'] text-[13px] font-medium tracking-[0.14em] uppercase text-[#2D6A4F]">
            FAQ
          </span>
          <h2 className="text-[clamp(26px,4vw,38px)] leading-[1.12] tracking-[-0.02em] font-bold text-[#1B4332] mt-3 text-balance">
            The questions every owner asks
          </h2>
        </div>

        <div className="mt-8 border-y border-[#E3E9EC] divide-y divide-[#E3E9EC]">
          {FAQS.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden py-5 text-[16.5px] font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors">
                <span>{item.q}</span>
                <Chevron />
              </summary>
              <p className="text-[15px] text-[#3A474E] leading-[1.65] pb-5 -mt-1 max-w-[68ch]">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="text-center text-[15px] text-[#677077] mt-9">
          Still wondering?{' '}
          <a
            href="mailto:support@hospopilot.co.uk"
            className="font-bold text-[#2D6A4F] hover:text-[#1B4332] no-underline border-b-[1.5px] border-[#2D6A4F]/30 pb-px hover:border-[#2D6A4F] transition-colors"
          >
            Ask us anything →
          </a>
        </p>
      </div>
    </section>
  )
}
