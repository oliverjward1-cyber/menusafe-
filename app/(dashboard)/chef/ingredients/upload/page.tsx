'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Upload, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { ALLERGENS } from '@/lib/constants/allergens'

type Row = Record<string, string>

interface MappedIngredient {
  name: string
  costPerUnit: number
  unitType: 'kg' | 'g' | 'ml' | 'litre' | 'each'
}

function parseCSV(text: string): { headers: string[]; rows: Row[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
  return { headers, rows }
}

function guessColumn(headers: string[], keywords: string[]): string {
  return headers.find((h) => keywords.some((k) => h.toLowerCase().includes(k))) ?? ''
}

function guessUnitType(raw: string): 'kg' | 'g' | 'ml' | 'litre' | 'each' {
  const v = raw.toLowerCase().trim()
  if (v === 'kg' || v === 'kilogram') return 'kg'
  if (v === 'g' || v === 'gram') return 'g'
  if (v === 'ml' || v === 'millilitre' || v === 'milliliter') return 'ml'
  if (v === 'litre' || v === 'liter' || v === 'l') return 'litre'
  if (v === 'each' || v === 'ea' || v === 'item' || v === 'unit') return 'each'
  return 'kg'
}

export default function UploadCostingPage() {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const fileRef = useRef<HTMLInputElement>(null)

  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [fileName, setFileName] = useState('')

  const [nameCol, setNameCol] = useState('')
  const [costCol, setCostCol] = useState('')
  const [unitCol, setUnitCol] = useState('')
  const [defaultUnit, setDefaultUnit] = useState<'kg' | 'g' | 'ml' | 'litre' | 'each'>('kg')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [done, setDone] = useState(false)

  function handleFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers: h, rows: r } = parseCSV(text)
      setHeaders(h)
      setRows(r)
      setNameCol(guessColumn(h, ['name', 'ingredient', 'description', 'item', 'product']))
      setCostCol(guessColumn(h, ['cost', 'price', 'unit price', 'rate', '£', 'gbp']))
      setUnitCol(guessColumn(h, ['unit', 'uom', 'measure']))
      setDone(false)
      setSaved(0)
      setErrors([])
    }
    reader.readAsText(file)
  }

  const preview: MappedIngredient[] = rows
    .filter((r) => nameCol && r[nameCol]?.trim())
    .slice(0, 5)
    .map((r) => ({
      name: r[nameCol].trim(),
      costPerUnit: costCol ? parseFloat(r[costCol]?.replace(/[£$,]/g, '') ?? '0') || 0 : 0,
      unitType: unitCol && r[unitCol] ? guessUnitType(r[unitCol]) : defaultUnit,
    }))

  const totalValid = rows.filter((r) => nameCol && r[nameCol]?.trim()).length

  async function handleImport() {
    if (!nameCol) return
    setSaving(true)
    setErrors([])

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles').select('restaurant_id').eq('id', user?.id ?? '').single()
    const restaurantId = profile?.restaurant_id
    if (!restaurantId) { setSaving(false); return }

    const toImport = rows.filter((r) => r[nameCol]?.trim())

    const { data: existing } = await supabase
      .from('ingredients')
      .select('id, name')
      .eq('restaurant_id', restaurantId)

    const existingMap = new Map((existing ?? []).map((i) => [i.name.toLowerCase(), i.id]))

    let savedCount = 0
    const errs: string[] = []

    for (const r of toImport) {
      const name = r[nameCol].trim()
      const costPerUnit = costCol ? parseFloat(r[costCol]?.replace(/[£$,]/g, '') ?? '0') || 0 : 0
      const unitType = unitCol && r[unitCol] ? guessUnitType(r[unitCol]) : defaultUnit

      const allergenFields = Object.fromEntries(ALLERGENS.map((a) => [a.key, false]))

      try {
        const existingId = existingMap.get(name.toLowerCase())
        if (existingId) {
          await supabase
            .from('ingredients')
            .update({ cost_per_unit: costPerUnit, unit_type: unitType })
            .eq('id', existingId)
        } else {
          await supabase
            .from('ingredients')
            .insert({ restaurant_id: restaurantId, name, cost_per_unit: costPerUnit, unit_type: unitType, ...allergenFields })
        }
        savedCount++
      } catch {
        errs.push(name)
      }
    }

    setSaved(savedCount)
    setErrors(errs)
    setSaving(false)
    setDone(true)
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/chef/ingredients" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Upload costing sheet</h1>
      </div>

      {/* Upload area */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Select file</h2>
        </div>
        <div className="p-5">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors"
          >
            <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            {fileName ? (
              <p className="text-sm font-medium text-gray-700">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-600">Drop your CSV here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">CSV files only — exported from Excel, Google Sheets, or your supplier</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      </div>

      {/* Column mapping */}
      {headers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Map columns</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tell us which columns contain the ingredient name and cost.</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Ingredient name <span className="text-red-400">*</span>
                </label>
                <select value={nameCol} onChange={(e) => setNameCol(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none">
                  <option value="">— select column —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Cost per unit (£)</label>
                <select value={costCol} onChange={(e) => setCostCol(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none">
                  <option value="">— none —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Unit type column</label>
                <select value={unitCol} onChange={(e) => setUnitCol(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none">
                  <option value="">— none —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {!unitCol && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Default unit (applied to all rows)</label>
                <div className="flex gap-2 flex-wrap">
                  {(['kg', 'g', 'ml', 'litre', 'each'] as const).map((u) => (
                    <button key={u} onClick={() => setDefaultUnit(u)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${defaultUnit === u ? 'bg-green-800 text-white border-green-800' : 'border-gray-200 text-gray-600 hover:border-green-400'}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {nameCol && preview.length > 0 && (
            <div className="border-t border-gray-100">
              <div className="px-5 py-3 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Preview — first 5 of {totalValid} rows
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Name</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Cost</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {p.costPerUnit > 0 ? `£${p.costPerUnit.toFixed(2)}` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{p.unitType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {done && (
        <div className={`rounded-xl border px-5 py-4 ${errors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            {errors.length === 0
              ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              : <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {saved} ingredient{saved !== 1 ? 's' : ''} imported successfully
              </p>
              {errors.length > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  Failed to import: {errors.join(', ')}
                </p>
              )}
              <button onClick={() => router.push('/chef/ingredients')}
                className="mt-3 text-sm font-medium text-green-700 hover:text-green-900 underline">
                View ingredient library →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {headers.length > 0 && !done && (
        <div className="flex gap-3 justify-end">
          <Link href="/chef/ingredients"
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button onClick={handleImport} disabled={saving || !nameCol}
            className="px-5 py-2.5 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? `Importing…` : `Import ${totalValid} ingredient${totalValid !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
