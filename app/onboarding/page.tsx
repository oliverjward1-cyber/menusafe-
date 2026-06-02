'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UtensilsCrossed, ArrowRight, Upload, BookOpen, Package, CheckCircle2, ChefHat } from 'lucide-react'

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

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 2 state
  const [restaurantName, setRestaurantName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [targetGp, setTargetGp] = useState(70)
  const [saving, setSaving] = useState(false)
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
      setStep(3)
    } catch {
      setError('Network error — please try again')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 bg-green-800 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">MenuSafe</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-2 w-8 rounded-full transition-colors ${s <= step ? 'bg-green-700' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ChefHat className="h-8 w-8 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome to MenuSafe</h1>
            <p className="text-gray-500 mb-2">
              The all-in-one kitchen management platform for UK independent restaurants.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Set up takes about 2 minutes. You'll be ready to build recipes and manage allergens straight away.
            </p>

            <div className="grid grid-cols-1 gap-3 mb-8 text-left">
              {[
                { icon: '🥗', title: 'Recipe costing', desc: 'Know the food cost and GP of every dish' },
                { icon: '⚠️', title: 'Allergen compliance', desc: 'Auto-detect all 14 UK regulated allergens' },
                { icon: '📋', title: 'Staff training', desc: 'Allergen quizzes with pass/fail records' },
                { icon: '📱', title: 'Public menu', desc: 'QR code menu with allergen info for customers' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-50">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)}
              className="w-full py-3 bg-green-800 text-white font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              Let&apos;s get started <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2 — Restaurant setup */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Set up your restaurant</h2>
            <p className="text-sm text-gray-500 mb-6">This takes 30 seconds and you can change everything later.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Restaurant name</label>
                <input
                  type="text" value={restaurantName} onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. The Crown Kitchen"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Menu URL
                  <span className="ml-2 text-xs text-gray-400 font-normal">Used for your public QR menu</span>
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/10">
                  <span className="px-3 py-2.5 bg-gray-50 text-xs text-gray-400 border-r border-gray-200 whitespace-nowrap">menusafe.app/menu/</span>
                  <input
                    type="text" value={slug}
                    onChange={(e) => { setSlug(slugify(e.target.value)); setSlugEdited(true) }}
                    placeholder="the-crown-kitchen"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target gross profit
                  <span className="ml-2 text-xs text-gray-400 font-normal">What GP% are you aiming for per dish?</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GP_PRESETS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setTargetGp(p.value)}
                      className={`py-3 rounded-xl border text-center transition-colors ${targetGp === p.value ? 'border-green-700 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className={`text-base font-bold ${targetGp === p.value ? 'text-green-800' : 'text-gray-900'}`}>{p.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.note}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button onClick={handleCreate} disabled={saving || !restaurantName.trim() || !slug.trim()}
                className="flex-1 py-2.5 bg-green-800 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {saving ? 'Setting up…' : <><CheckCircle2 className="h-4 w-4" /> Create my restaurant</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Get started */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">You&apos;re all set up!</h2>
              <p className="text-sm text-gray-500">
                <strong>{restaurantName}</strong> is ready. Now let&apos;s get your ingredients and recipes in.
              </p>
            </div>

            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Choose where to start</p>
            <div className="space-y-3">
              <button onClick={() => router.push('/chef/ingredients/upload')}
                className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50/30 transition-colors text-left">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <Upload className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Upload your costing sheet</p>
                  <p className="text-xs text-gray-500 mt-0.5">Import prices from a CSV file — from your supplier or your own spreadsheet. Fastest way to get started.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
              </button>

              <button onClick={() => router.push('/chef/ingredients/new')}
                className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50/30 transition-colors text-left">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Add ingredients manually</p>
                  <p className="text-xs text-gray-500 mt-0.5">Add individual ingredients with their cost, unit type, and allergens.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
              </button>

              <button onClick={() => router.push('/chef/recipes/new')}
                className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50/30 transition-colors text-left">
                <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Build your first recipe</p>
                  <p className="text-xs text-gray-500 mt-0.5">Search ingredients, set quantities, and see food cost and GP calculate in real time.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
              </button>
            </div>

            <button onClick={() => router.push('/chef')}
              className="w-full mt-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Skip for now — take me to the dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
