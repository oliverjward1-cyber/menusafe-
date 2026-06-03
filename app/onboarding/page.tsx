'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Upload, BookOpen, Package, CheckCircle2, ChefHat } from 'lucide-react'
import { MiseLogo } from '@/components/MiseLogo'
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
    <div className="min-h-screen bg-mise-ink flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <MiseLogo className="scale-125" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-2 w-8 rounded-full transition-colors ${s <= step ? 'bg-mise-fresh' : 'bg-white/10'}`} />
            </div>
          ))}
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-xl p-8 text-center">
            <div className="h-16 w-16 bg-mise-mid/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ChefHat className="h-8 w-8 text-mise-fresh" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 font-display">Welcome to mise</h1>
            <p className="text-gray-300 mb-2">
              The all-in-one kitchen management platform for UK independent restaurants.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Set up takes about 2 minutes. You&apos;ll be ready to build recipes and manage allergens straight away.
            </p>

            <div className="grid grid-cols-1 gap-3 mb-8 text-left">
              {[
                { icon: '🥗', title: 'Recipe costing', desc: 'Know the food cost and GP of every dish' },
                { icon: '⚠️', title: 'Allergen compliance', desc: 'Auto-detect all 14 UK regulated allergens' },
                { icon: '📋', title: 'Staff training', desc: 'Allergen quizzes with pass/fail records' },
                { icon: '📱', title: 'Public menu', desc: 'QR code menu with allergen info for customers' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/5">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)}
              className="w-full py-3 bg-mise-mid hover:bg-mise-deep text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
              Let&apos;s get started <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2 — Restaurant setup */}
        {step === 2 && (
          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-xl p-8">
            <h2 className="text-xl font-bold text-white mb-1">Set up your restaurant</h2>
            <p className="text-sm text-gray-400 mb-6">This takes 30 seconds and you can change everything later.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Restaurant name</label>
                <input
                  type="text" value={restaurantName} onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. The Crown Kitchen"
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 px-4 py-2.5 text-sm focus:border-mise-fresh focus:outline-none focus:ring-2 focus:ring-mise-fresh/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Menu URL
                  <span className="ml-2 text-xs text-gray-500 font-normal">Used for your public QR menu</span>
                </label>
                <div className="flex items-center rounded-xl border border-white/10 overflow-hidden focus-within:border-mise-fresh focus-within:ring-2 focus-within:ring-mise-fresh/20">
                  <span className="px-3 py-2.5 bg-white/5 text-xs text-gray-500 border-r border-white/10 whitespace-nowrap">getmise.app/menu/</span>
                  <input
                    type="text" value={slug}
                    onChange={(e) => { setSlug(slugify(e.target.value)); setSlugEdited(true) }}
                    placeholder="the-crown-kitchen"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target gross profit
                  <span className="ml-2 text-xs text-gray-500 font-normal">What GP% are you aiming for per dish?</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {GP_PRESETS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setTargetGp(p.value)}
                      className={`py-3 rounded-xl border text-center transition-colors ${targetGp === p.value ? 'border-mise-fresh bg-mise-mid/30' : 'border-white/10 hover:border-white/20'}`}>
                      <p className={`text-base font-bold ${targetGp === p.value ? 'text-white' : 'text-gray-300'}`}>{p.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.note}</p>
                    </button>
                  ))}
                  <button type="button" onClick={() => { if (PRESET_VALUES.includes(targetGp)) setTargetGp(0) }}
                    className={`py-3 rounded-xl border text-center transition-colors ${!PRESET_VALUES.includes(targetGp) ? 'border-mise-fresh bg-mise-mid/30' : 'border-white/10 hover:border-white/20'}`}>
                    <p className={`text-base font-bold ${!PRESET_VALUES.includes(targetGp) ? 'text-white' : 'text-gray-300'}`}>Custom</p>
                    <p className="text-xs text-gray-500 mt-0.5">Set your own</p>
                  </button>
                </div>
                {!PRESET_VALUES.includes(targetGp) && (
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="number" min={1} max={99}
                      value={targetGp || ''}
                      onChange={e => setTargetGp(Math.min(99, Math.max(1, parseInt(e.target.value) || 0)))}
                      placeholder="e.g. 68"
                      className="w-28 border border-mise-fresh/40 rounded-lg px-3 py-2 text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-mise-fresh/30"
                      autoFocus
                    />
                    <span className="text-sm text-gray-400">% target GP</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-900/30 border border-red-500/40 px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)}
                className="px-5 py-2.5 text-sm font-medium text-gray-400 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                Back
              </button>
              <button onClick={handleCreate} disabled={saving || !restaurantName.trim() || !slug.trim()}
                className="flex-1 py-2.5 bg-mise-mid hover:bg-mise-deep text-white font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {saving ? 'Setting up…' : <><CheckCircle2 className="h-4 w-4" /> Create my restaurant</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Menu import */}
        {step === 3 && (
          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="h-14 w-14 bg-mise-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-mise-gold" />
              </div>
              <h2 className="text-xl font-display font-semibold text-white mb-1">
                {restaurantName} is ready
              </h2>
              <p className="text-sm text-gray-400">
                Take a photo of your existing menu and we&apos;ll add all your dishes instantly — names, categories, and prices.
              </p>
            </div>

            <MenuPhotoImport restaurantId={restaurantId} />

            <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
              <p className="text-xs font-sans font-semibold text-gray-500 uppercase tracking-widest text-center mb-3">Or start another way</p>
              <button onClick={() => router.push('/chef/ingredients/upload')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors text-left">
                <Upload className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-300">Upload supplier invoice / CSV</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-500 ml-auto" />
              </button>
              <button onClick={() => router.push('/chef/recipes/new')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors text-left">
                <BookOpen className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-300">Add dishes manually</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-500 ml-auto" />
              </button>
            </div>

            <button onClick={() => router.push('/chef')}
              className="w-full mt-4 py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Skip — take me to the dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
