'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Delete } from 'lucide-react'

export default function PinEntry({ slug, restaurantName }: { slug: string; restaurantName: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'name' | 'pin'>('name')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleDigit(d: string) {
    if (pin.length < 4) setPin(p => p + d)
  }

  function handleDelete() {
    setPin(p => p.slice(0, -1))
    setError('')
  }

  async function submit() {
    if (pin.length !== 4) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/kitchen/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, pin }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Wrong PIN')
      setPin('')
      return
    }
    // Store staff session in sessionStorage — no server account needed
    sessionStorage.setItem('staff_name', name.trim())
    sessionStorage.setItem('staff_restaurant_id', data.restaurantId)
    sessionStorage.setItem('staff_restaurant_name', data.restaurantName)
    router.push(`/kitchen/${slug}/tasks`)
  }

  // Auto-submit when 4 digits entered
  if (pin.length === 4 && !loading && step === 'pin') {
    submit()
  }

  const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','del']

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-5">
      {step === 'name' ? (
        <>
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Your name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && setStep('pin')}
              placeholder="e.g. Jamie"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-lg focus:outline-none focus:border-white/50"
            />
          </div>
          <button
            onClick={() => setStep('pin')}
            disabled={!name.trim()}
            className="w-full bg-hospopilot-fresh text-hospopilot-ink font-bold rounded-xl py-3.5 text-base disabled:opacity-30 transition-opacity"
          >
            Continue →
          </button>
        </>
      ) : (
        <>
          <div className="text-center">
            <p className="text-white/60 text-sm">Hi {name.split(' ')[0]} 👋</p>
            <p className="text-white/40 text-xs mt-0.5">Enter the kitchen PIN</p>
          </div>

          {/* PIN dots */}
          <div className="flex justify-center gap-4 py-2">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < pin.length ? 'bg-hospopilot-fresh scale-110' : 'bg-white/20'}`} />
            ))}
          </div>

          {error && <p className="text-center text-red-400 text-sm">{error}</p>}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {DIGITS.map((d, i) => {
              if (d === '') return <div key={i} />
              if (d === 'del') return (
                <button key={i} onClick={handleDelete}
                  className="flex items-center justify-center h-14 rounded-xl bg-white/10 text-white active:bg-white/20 transition-colors">
                  <Delete className="h-5 w-5" />
                </button>
              )
              return (
                <button key={i} onClick={() => handleDigit(d)}
                  className="flex items-center justify-center h-14 rounded-xl bg-white/10 text-white text-xl font-semibold active:bg-white/30 transition-colors">
                  {d}
                </button>
              )
            })}
          </div>

          {loading && <p className="text-center text-white/40 text-sm animate-pulse">Checking…</p>}

          <button onClick={() => { setStep('name'); setPin(''); setError('') }}
            className="w-full text-white/30 text-xs hover:text-white/50 transition-colors">
            ← Change name
          </button>
        </>
      )}
    </div>
  )
}
