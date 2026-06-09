import Link from 'next/link'
import { ArrowLeft, Check, X } from 'lucide-react'

const FEATURES = [
  {
    category: 'Compliance & EHO',
    items: [
      { label: 'Temperature logging (AM/PM/spot checks)', compliance: true, kitchen: true },
      { label: 'Corrective action tracking', compliance: true, kitchen: true },
      { label: 'Cleaning schedule & sign-off logs', compliance: true, kitchen: true },
      { label: 'Delivery records', compliance: true, kitchen: true },
      { label: 'Incident log with photo evidence', compliance: true, kitchen: true },
      { label: 'HACCP plans & probe calibration', compliance: true, kitchen: true },
      { label: 'EHO Inspection Mode — one-screen compliance pack', compliance: true, kitchen: true },
      { label: 'Printable compliance sheets (A4, EHO-ready)', compliance: true, kitchen: true },
    ],
  },
  {
    category: 'Allergen Management',
    items: [
      { label: 'Full 14-allergen matrix (FIR 2014 compliant)', compliance: true, kitchen: true },
      { label: 'Staff allergen training (Learning Hub)', compliance: true, kitchen: true },
      { label: 'Allergen quiz with pass/fail records', compliance: true, kitchen: true },
      { label: 'Owen\'s Law — written allergen info on menus', compliance: true, kitchen: true },
      { label: 'Customer-facing allergen QR code', compliance: true, kitchen: true },
    ],
  },
  {
    category: 'Team Management',
    items: [
      { label: 'Unlimited staff accounts', compliance: true, kitchen: true },
      { label: 'Role-based access (Manager, Head Chef, FOH, etc.)', compliance: true, kitchen: true },
      { label: 'Staff profiles with contact & next-of-kin details', compliance: true, kitchen: true },
      { label: 'Training history per staff member', compliance: true, kitchen: true },
      { label: 'Invite & revoke access', compliance: true, kitchen: true },
    ],
  },
  {
    category: 'Menu & Kitchen',
    items: [
      { label: 'Recipe builder with ingredient costing', compliance: false, kitchen: true },
      { label: 'GP% calculator per dish', compliance: false, kitchen: true },
      { label: 'Menu management (lunch, dinner, specials)', compliance: false, kitchen: true },
      { label: 'Published menus with allergen info for customers', compliance: false, kitchen: true },
      { label: 'Kitchen audit (scored, with photo evidence)', compliance: false, kitchen: true },
      { label: 'Below-target GP alerts on dashboard', compliance: false, kitchen: true },
    ],
  },
  {
    category: 'Reporting & History',
    items: [
      { label: 'Full history view (all logs in one place)', compliance: true, kitchen: true },
      { label: 'Invoice history & printable billing', compliance: true, kitchen: true },
      { label: 'Document storage (HACCP, insurance, certs)', compliance: true, kitchen: true },
    ],
  },
  {
    category: 'Multi-site',
    items: [
      { label: 'Additional sites', compliance: true, kitchen: true, note: '+£50/mo per site' },
      { label: 'Per-site compliance dashboards', compliance: true, kitchen: true },
    ],
  },
]

export default function PlansPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/owner/billing" className="text-sm text-gray-500 hover:text-mise-ink flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Billing
        </Link>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold text-mise-ink">Compare plans</h1>
        <p className="text-gray-500 mt-2">Everything you need to stay compliant, run a safe kitchen, and protect your business.</p>
      </div>

      {/* Plan header cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border-2 border-gray-200 p-6 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Compliance</p>
            <p className="font-display text-3xl font-bold text-mise-ink">£79<span className="text-lg font-normal text-gray-400">/mo</span></p>
          </div>
          <p className="text-sm text-gray-500">The complete EHO and allergen compliance toolkit. Everything you need to pass an inspection and protect your customers.</p>
          <Link href="/owner/billing" className="inline-flex items-center gap-1 text-sm font-semibold text-mise-mid hover:text-mise-deep">
            Get started →
          </Link>
        </div>
        <div className="rounded-2xl border-2 border-mise-mid bg-mise-mid/5 p-6 space-y-3 relative">
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-mise-gold text-white">Most popular</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-mise-mid uppercase tracking-widest mb-1">Compliance + Kitchen</p>
            <p className="font-display text-3xl font-bold text-mise-ink">£129<span className="text-lg font-normal text-gray-400">/mo</span></p>
          </div>
          <p className="text-sm text-gray-500">Everything in Compliance, plus a full recipe and menu management suite — so your kitchen runs as efficiently as it runs safely.</p>
          <Link href="/owner/billing" className="inline-flex items-center gap-1 text-sm font-semibold text-mise-mid hover:text-mise-deep">
            Get started →
          </Link>
        </div>
      </div>

      {/* Feature comparison table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Sticky column headers */}
        <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200 sticky top-0">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Feature</span>
          <span className="text-xs font-semibold text-mise-ink text-center uppercase tracking-widest">Compliance</span>
          <span className="text-xs font-semibold text-mise-mid text-center uppercase tracking-widest">+ Kitchen</span>
        </div>

        {FEATURES.map((section) => (
          <div key={section.category}>
            {/* Category header */}
            <div className="px-5 py-2.5 bg-gray-50/60 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{section.category}</p>
            </div>
            {/* Feature rows */}
            {section.items.map((item) => (
              <div key={item.label} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center px-5 py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-mise-ink">{item.label}</p>
                  {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
                </div>
                <div className="flex justify-center">
                  {item.compliance
                    ? <Check className="h-4 w-4 text-green-600" />
                    : <X className="h-4 w-4 text-gray-300" />}
                </div>
                <div className="flex justify-center">
                  {item.kitchen
                    ? <Check className="h-4 w-4 text-green-600" />
                    : <X className="h-4 w-4 text-gray-300" />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Additional sites callout */}
      <div className="rounded-2xl border border-dashed border-gray-300 p-6 space-y-2">
        <p className="font-semibold text-mise-ink">Running multiple sites?</p>
        <p className="text-sm text-gray-500">Add extra restaurant locations to either plan for <strong>+£50/mo per site</strong>. Each site gets its own compliance dashboard, team, menus and history — all managed from one account.</p>
        <Link href="/owner/billing" className="inline-flex items-center gap-1 text-sm font-semibold text-mise-mid hover:text-mise-deep mt-1">
          Set up additional sites →
        </Link>
      </div>

      <div className="pb-4">
        <Link href="/owner/billing">
          <button className="w-full sm:w-auto bg-mise-mid text-white font-semibold rounded-xl px-8 py-3 hover:bg-mise-deep transition-colors">
            Choose a plan
          </button>
        </Link>
      </div>
    </div>
  )
}
