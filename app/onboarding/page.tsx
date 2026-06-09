'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Upload, BookOpen, Package, CheckCircle2, ChefHat } from 'lucide-react'
import { HospoPilotLogo } from '@/components/HospoPilotLogo'
import { MenuPhotoImport } from './MenuPhotoImport'

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

const GP_PRESETS = [
  { label: '65%', value: 65, note: 'Casual dining' },
  { label: '70%', value: 70, note: 'Standard' },
  { label: '72%', value: 72, note: 'Fine dining' },
  { label: '75%', value: 75, note: 'Premium' },
]
const PRESET_VALUES = GP_PRESETS.map(p => p.value)

const STEPS = ['Welcome', 'Your restaurant', 'Your menu']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 2 state
  const [restaurantName, setRestaurantName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [targetGp, setTargetGp] = useState(70)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState('')
  const [error, setError] = useState('')

  function handleNameChange(val: string) {
    setRestaurantName(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  async function handleCreate() {
    if (!restaurantName.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: restaurantName, slug, targetGp }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); setSaving(false); return }
      setRestaurantId(data.id ?? '')
      setStep(3)
    } catch {
      setError('Network error — please try again')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-[#3A474E] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <HospoPilotLogo className="scale-110" />
        </div>

        {/* Step progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => {
              const num = i + 1
              const done = step > num
              const active = step === num
              return (
                <div key={s} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-hospopilot-fresh text-white' : active ? 'bg-hospopilot-deep text-white ring-2 ring-hospopilot-mid/30' : 'bg-[#E3E9EC] text-[#97A1A7]'}`}>
                    {done ? '✓' : num}
                  </div>
                  <span className={`text-xs hidden sm:block transition-colors ${active ? 'text-[#1B4332] font-medium' : done ? 'text-[#2D6A4F]' : 'text-[#97A1A7]'}`}>{s}</span>
                </div>
              )
            })}
          </div>
          <div className="relative h-1.5 bg-[#E3E9EC] rounded-full mt-1">
            <div
              className="absolute left-0 top-0 h-1.5 bg-hospopilot-mid rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <p className="text-center text-xs text-[#677077] mt-2">Step {step} of {STEPS.length} — {STEPS[step - 1]}</p>
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-8 text-center">
            <div className="h-16 w-16 bg-hospopilot-mid/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ChefHat className="h-8 w-8 text-hospopilot-mid" />
            </div>
            <h1 className="text-2xl font-bold text-[#1B4332] mb-3">Welcome to HospoPilot</h1>
            <p className="text-[#3A474E] mb-2">
              The all-in-one kitchen management platform for UK independent restaurants.
            </p>
            <p className="text-sm text-[#677077] mb-8">
              Set up takes about 2 minutes. You&apos;ll be ready to build recipes and manage allergens straight away.
            </p>

            <div className="grid grid-cols-1 gap-3 mb-8 text-left">
              {[
                { icon: '🥗', title: 'Recipe costing', desc: 'Know the food cost and GP of every dish' },
                { icon: '⚠️', title: 'Allergen compliance', desc: 'Auto-detect all 14 UK regulated allergens' },
                { icon: '📋', title: 'Staff training', desc: 'Allergen quizzes with pass/fail records' },
                { icon: '📱', title: 'Public menu', desc: 'QR code menu with allergen info for customers' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#F8FAFB] border border-[#E3E9EC]">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-[#141A1E]">{item.title}</p>
                    <p className="text-xs text-[#677077]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)}
              className="w-full py-3 bg-hospopilot-mid hover:bg-hospopilot-deep text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              Let&apos;s get started <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2 — Restaurant setup */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-8">
            <h2 className="text-xl font-bold text-[#1B4332] mb-1">Set up your restaurant</h2>
            <p className="text-sm text-[#677077] mb-6">You can change all of this later.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#3A474E] mb-1.5">Restaurant name</label>
                <input
                  type="text" value={restaurantName} onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. The Crown Kitchen"
                  className="w-full rounded-lg border-[1.5px] border-[#C7D0D5] bg-white text-[#141A1E] placeholder:text-[#97A1A7] px-4 py-2.5 text-sm focus:border-[#2D6A4F] focus:outline-none focus:shadow-[0_0_0_3px_rgba(45,106,79,0.14)] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3A474E] mb-1.5">
                  Menu URL
                  <span className="ml-2 text-xs text-[#97A1A7] font-normal">Used for your public QR menu</span>
                </label>
                <div className="flex items-center rounded-lg border-[1.5px] border-[#C7D0D5] overflow-hidden focus-within:border-[#2D6A4F] focus-within:shadow-[0_0_0_3px_rgba(45,106,79,0.14)] transition">
                  <span className="px-3 py-2.5 bg-[#F0F3F4] text-xs text-[#677077] border-r border-[#C7D0D5] whitespace-nowrap">hospopilot.co.uk/menu/</span>
                  <input
                    type="text" value={slug}
                    onChange={(e) => { setSlug(slugify(e.target.value)); setSlugEdited(true) }}
                    placeholder="the-crown-kitchen"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent text-[#141A1E] placeholder:text-[#97A1A7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3A474E] mb-2">
                  Target gross profit
                  <span className="ml-2 text-xs text-[#97A1A7] font-normal">What GP% are you aiming for per dish?</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {GP_PRESETS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setTargetGp(p.value)}
                      className={`py-3 rounded-xl border text-center transition-colors ${targetGp === p.value ? 'border-hospopilot-mid bg-hospopilot-mid/10' : 'border-[#E3E9EC] hover:border-[#C7D0D5]'}`}>
                      <p className={`text-base font-bold ${targetGp === p.value ? 'text-[#1B4332]' : 'text-[#3A474E]'}`}>{p.label}</p>
                      <p className="text-xs text-[#97A1A7] mt-0.5">{p.note}</p>
                    </button>
                  ))}
                  <button type="button" onClick={() => { if (PRESET_VALUES.includes(targetGp)) setTargetGp(0) }}
                    className={`py-3 rounded-xl border text-center transition-colors ${!PRESET_VALUES.includes(targetGp) ? 'border-hospopilot-mid bg-hospopilot-mid/10' : 'border-[#E3E9EC] hover:border-[#C7D0D5]'}`}>
                    <p className={`text-base font-bold ${!PRESET_VALUES.includes(targetGp) ? 'text-[#1B4332]' : 'text-[#3A474E]'}`}>Custom</p>
                    <p className="text-xs text-[#97A1A7] mt-0.5">Set your own</p>
                  </button>
                </div>
                {!PRESET_VALUES.includes(targetGp) && (
                  <>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="number" min={1} max={99}
                        value={targetGp || ''}
                        onChange={e => setTargetGp(Math.min(99, Math.max(1, parseInt(e.target.value) || 0)))}
                        placeholder="e.g. 68"
                        className="w-28 border-[1.5px] border-[#C7D0D5] rounded-lg px-3 py-2 text-sm bg-white text-[#141A1E] focus:outline-none focus:border-[#2D6A4F] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.14)] transition"
                        autoFocus
                      />
                      <span className="text-sm text-[#677077]">% target GP</span>
                    </div>
                    {targetGp >= 99 && <p className="text-xs text-amber-600 mt-1">Maximum target GP is 99%</p>}
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)}
                className="px-5 py-2.5 text-sm font-medium text-[#677077] border border-[#E3E9EC] rounded-xl hover:bg-[#F0F3F4] transition-colors">
                Back
              </button>
              <button onClick={handleCreate} disabled={saving || !restaurantName.trim() || !slug.trim()}
                className="flex-1 py-2.5 bg-hospopilot-mid hover:bg-hospopilot-deep text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {saving ? 'Setting up…' : <><CheckCircle2 className="h-4 w-4" /> Create my restaurant</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Menu import */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-[#E3E9EC] shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] p-8">
            <div className="text-center mb-6">
              <div className="h-14 w-14 bg-hospopilot-gold/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-hospopilot-gold" />
              </div>
              <h2 className="text-xl font-bold text-[#1B4332] mb-1">
                {restaurantName} is ready
              </h2>
              <p className="text-sm text-[#677077]">
                Take a photo of your existing menu and we&apos;ll add all your dishes instantly — names, categories, and prices.
              </p>
            </div>

            <MenuPhotoImport restaurantId={restaurantId} />

            <div className="mt-6 pt-5 border-t border-[#E3E9EC] space-y-2">
              <p className="text-xs font-semibold text-[#97A1A7] uppercase tracking-widest text-center mb-3">Or start another way</p>
              <button onClick={() => router.push('/chef/ingredients/upload')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E3E9EC] hover:border-[#C7D0D5] hover:bg-[#F8FAFB] transition-colors text-left">
                <Upload className="h-4 w-4 text-[#677077] shrink-0" />
                <span className="text-sm text-[#3A474E]">Upload supplier invoice / CSV</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#97A1A7] ml-auto" />
              </button>
              <button onClick={() => router.push('/chef/recipes/new')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E3E9EC] hover:border-[#C7D0D5] hover:bg-[#F8FAFB] transition-colors text-left">
                <BookOpen className="h-4 w-4 text-[#677077] shrink-0" />
                <span className="text-sm text-[#3A474E]">Add dishes manually</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#97A1A7] ml-auto" />
              </button>
            </div>

            <button onClick={() => router.push('/chef')}
              className="w-full mt-4 py-2 text-xs text-[#97A1A7] hover:text-[#677077] transition-colors">
              Skip — take me to the dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
