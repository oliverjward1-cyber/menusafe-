'use client'

import { useState, useRef } from 'react'
import { Loader2, AlertTriangle, CheckCircle2, ImagePlus, ShieldCheck } from 'lucide-react'

const ALLERGEN_LABELS: Record<string, string> = {
  celery: 'Celery',
  cereals_gluten: 'Gluten',
  crustaceans: 'Crustaceans',
  eggs: 'Eggs',
  fish: 'Fish',
  lupin: 'Lupin',
  milk: 'Milk',
  molluscs: 'Molluscs',
  mustard: 'Mustard',
  nuts: 'Nuts',
  peanuts: 'Peanuts',
  sesame: 'Sesame',
  soya: 'Soya',
  sulphites: 'Sulphites',
}

interface Recipe { id: string; name: string }
interface ScanResult { dish: string; allergens: string[] }
interface MatchedResult { recipeId: string; recipeName: string; allergens: string[]; matched: boolean }

function fuzzyMatch(name: string, recipes: Recipe[]): Recipe | null {
  const n = name.toLowerCase().trim()
  // Exact match first
  let found = recipes.find(r => r.name.toLowerCase() === n)
  if (found) return found
  // Partial match
  found = recipes.find(r => r.name.toLowerCase().includes(n) || n.includes(r.name.toLowerCase()))
  return found ?? null
}

interface Props {
  recipes: Recipe[]
  onDone: () => void
}

export function AllergenSheetImport({ recipes, onDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<'upload' | 'scanning' | 'review' | 'saving' | 'done'>('upload')
  const [matches, setMatches] = useState<MatchedResult[]>([])
  const [unmatched, setUnmatched] = useState<ScanResult[]>([])
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    setStage('scanning')

    const form = new FormData()
    form.append('image', file)
    form.append('dishNames', JSON.stringify(recipes.map(r => r.name)))

    const res = await fetch('/api/allergen-import', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok || !data.results) {
      setError(data.error ?? 'Could not read the allergen sheet. Try a clearer photo.')
      setStage('upload')
      return
    }

    const results: ScanResult[] = data.results
    const matched: MatchedResult[] = []
    const notMatched: ScanResult[] = []

    for (const r of results) {
      const recipe = fuzzyMatch(r.dish, recipes)
      if (recipe) {
        matched.push({ recipeId: recipe.id, recipeName: recipe.name, allergens: r.allergens, matched: true })
      } else {
        notMatched.push(r)
      }
    }

    setMatches(matched)
    setUnmatched(notMatched)
    setStage('review')
  }

  function toggleAllergen(recipeId: string, allergen: string) {
    setMatches(prev => prev.map(m => {
      if (m.recipeId !== recipeId) return m
      const has = m.allergens.includes(allergen)
      return { ...m, allergens: has ? m.allergens.filter(a => a !== allergen) : [...m.allergens, allergen] }
    }))
  }

  async function handleSave() {
    setStage('saving')
    const updates = matches.map(m => ({ recipeId: m.recipeId, allergens: m.allergens }))

    const res = await fetch('/api/allergen-import/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })

    if (!res.ok) {
      setError('Failed to save allergen data')
      setStage('review')
      return
    }

    setStage('done')
  }

  if (stage === 'upload') {
    return (
      <div className="space-y-3">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-hospopilot-ink/20 rounded-2xl p-8 text-center cursor-pointer hover:border-hospopilot-gold hover:bg-hospopilot-gold/5 transition-colors group"
        >
          <ShieldCheck className="h-8 w-8 text-hospopilot-ink/20 group-hover:text-hospopilot-gold mx-auto mb-3 transition-colors" />
          <p className="text-sm font-semibold text-hospopilot-ink mb-1">Upload your allergen sheet</p>
          <p className="text-xs text-hospopilot-ink/40">Photo of your printed allergen matrix or information sheet</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <button onClick={onDone} className="w-full py-2 text-xs text-hospopilot-ink/40 hover:text-hospopilot-ink/60 transition-colors">
          Skip this step
        </button>
      </div>
    )
  }

  if (stage === 'scanning') {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-hospopilot-gold mx-auto mb-3" />
        <p className="text-sm font-semibold text-hospopilot-ink">Reading allergen sheet…</p>
        <p className="text-xs text-hospopilot-ink/40 mt-1">Matching dishes to your recipes</p>
      </div>
    )
  }

  if (stage === 'done') {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-10 w-10 text-hospopilot-fresh mx-auto mb-3" />
        <p className="text-lg font-display font-semibold text-hospopilot-ink mb-1">Allergens saved</p>
        <p className="text-sm text-hospopilot-ink/50 mb-5">
          {matches.length} dish{matches.length !== 1 ? 'es' : ''} updated. These will show on your public menu straight away.
        </p>
        <button
          onClick={onDone}
          className="px-5 py-2.5 bg-hospopilot-gold hover:bg-yellow-600 text-white font-semibold rounded-xl transition-colors"
        >
          Continue to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-hospopilot-ink">
          {matches.length} of {matches.length + unmatched.length} dishes matched
        </p>
        <p className="text-xs text-hospopilot-ink/40 mt-0.5">Review and adjust allergens before saving</p>
      </div>

      <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
        {matches.map(m => (
          <div key={m.recipeId} className="bg-white rounded-xl border border-black/[0.06] p-4">
            <p className="text-sm font-semibold text-hospopilot-ink mb-3">{m.recipeName}</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(ALLERGEN_LABELS).map(([key, label]) => {
                const active = m.allergens.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleAllergen(m.recipeId, key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? 'bg-hospopilot-deep text-white'
                        : 'bg-black/5 text-hospopilot-ink/40 hover:bg-black/10'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {unmatched.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              {unmatched.length} dish{unmatched.length !== 1 ? 'es' : ''} not matched to your recipes
            </p>
            <p className="text-xs text-amber-600">{unmatched.map(u => u.dish).join(', ')}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={stage === 'saving' || matches.length === 0}
        className="w-full py-3 bg-hospopilot-gold hover:bg-yellow-600 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {stage === 'saving'
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          : `Save allergens for ${matches.length} dish${matches.length !== 1 ? 'es' : ''}`}
      </button>
    </div>
  )
}
