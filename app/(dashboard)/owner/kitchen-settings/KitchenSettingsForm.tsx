'use client'
import { useState } from 'react'
import { CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react'

export default function KitchenSettingsForm({
  restaurantId,
  restaurantSlug,
  currentPin,
}: {
  restaurantId: string
  restaurantSlug: string
  currentPin: string | null
}) {
  const [pin, setPin] = useState(currentPin ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [copied, setCopied] = useState(false)

  const kitchenUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/kitchen/${restaurantSlug}`
    : `/kitchen/${restaurantSlug}`

  async function savePin() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return
    setSaving(true)
    await fetch('/api/owner/kitchen-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(kitchenUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* PIN setting */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold text-mise-ink">Staff PIN</h2>
          <p className="text-sm text-mise-ink/50 mt-0.5">A 4-digit PIN your staff enter to access the kitchen portal. Share this verbally — don't write it on the wall!</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[160px]">
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setPin(v) }}
              placeholder="e.g. 1234"
              maxLength={4}
              inputMode="numeric"
              className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-lg font-mono tracking-widest text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30 pr-10"
            />
            <button onClick={() => setShowPin(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-mise-ink/30 hover:text-mise-ink/60">
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button onClick={savePin} disabled={saving || pin.length !== 4 || !/^\d{4}$/.test(pin)}
            className="bg-mise-deep text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40 flex items-center gap-2">
            {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : saving ? 'Saving…' : 'Save PIN'}
          </button>
        </div>
        {!currentPin && (
          <p className="text-amber-600 text-xs font-medium">No PIN set yet — staff can't access the kitchen portal until you set one.</p>
        )}
      </div>

      {/* Kitchen URL */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold text-mise-ink">Kitchen portal link</h2>
          <p className="text-sm text-mise-ink/50 mt-0.5">Staff open this on a tablet or phone in the kitchen. Bookmark it or print the QR code below.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-black/[0.06]">
          <p className="flex-1 text-sm text-mise-ink/70 truncate font-mono">/kitchen/{restaurantSlug}</p>
          <button onClick={copyUrl} className="flex-shrink-0 flex items-center gap-1 text-xs text-mise-mid font-semibold">
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="bg-mise-ink rounded-2xl p-5 flex flex-col items-center gap-3">
          {/* Simple QR placeholder — uses Google Charts API */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/kitchen/${restaurantSlug}` : `https://yourdomain.com/kitchen/${restaurantSlug}`)}`}
            alt="Kitchen QR code"
            width={180}
            height={180}
            className="rounded-xl"
          />
          <p className="text-white/50 text-xs text-center">Print and stick this in your kitchen</p>
          <a
            href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/kitchen/${restaurantSlug}` : '')}&format=png`}
            download="kitchen-qr.png"
            className="text-mise-mid text-xs font-semibold"
          >
            Download QR code
          </a>
        </div>
      </div>
    </div>
  )
}
