'use client'
import { useState } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'

export function HaccpPlanForm({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reviewedBy, setReviewedBy] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    if (!title || !date || !reviewedBy) return
    setSaving(true)
    const res = await fetch('/api/compliance/haccp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, lastReviewedDate: date, reviewedBy, documentUrl: docUrl, notes }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); onSaved() }
  }

  if (saved) return (
    <div className="flex items-center gap-2 p-4 bg-green-50 rounded-xl text-sm text-green-700">
      <CheckCircle2 className="h-4 w-4" /> HACCP plan saved. Refresh the EHO page to see it.
    </div>
  )

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-mise-ink/50 uppercase tracking-wide">Plan title *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. HACCP Plan v2 — Full Kitchen"
          className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-mise-ink/50 uppercase tracking-wide">Last reviewed date *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
        </div>
        <div>
          <label className="text-xs font-semibold text-mise-ink/50 uppercase tracking-wide">Reviewed by *</label>
          <input value={reviewedBy} onChange={e => setReviewedBy(e.target.value)} placeholder="Name"
            className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-mise-ink/50 uppercase tracking-wide">Document URL (optional)</label>
        <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="Link to Google Drive, Dropbox, etc."
          className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>
      <div>
        <label className="text-xs font-semibold text-mise-ink/50 uppercase tracking-wide">Notes</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional"
          className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>
      <button onClick={save} disabled={saving || !title || !date || !reviewedBy}
        className="bg-mise-deep text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
        {saving ? 'Saving…' : 'Save HACCP plan'}
      </button>
    </div>
  )
}

export function ProbeCalibrationForm({ restaurantId, onSaved }: { restaurantId: string; onSaved: () => void }) {
  const [icePoint, setIcePoint] = useState('')
  const [boilingPoint, setBoilingPoint] = useState('')
  const [recordedBy, setRecordedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const icePass = icePoint !== '' && parseFloat(icePoint) >= -1 && parseFloat(icePoint) <= 1
  const boilPass = boilingPoint !== '' && parseFloat(boilingPoint) >= 99 && parseFloat(boilingPoint) <= 101

  async function save() {
    if (!icePoint || !boilingPoint || !recordedBy) return
    setSaving(true)
    const res = await fetch('/api/compliance/probe-calibration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, icePoint, boilingPoint, recordedBy, notes }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); onSaved() }
  }

  if (saved) return (
    <div className="flex items-center gap-2 p-4 bg-green-50 rounded-xl text-sm text-green-700">
      <CheckCircle2 className="h-4 w-4" /> Calibration recorded.
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-mise-ink/50 uppercase tracking-wide">Ice point reading (°C)</label>
          <p className="text-xs text-mise-ink/30 mb-1">Pass: −1°C to +1°C</p>
          <input type="number" step="0.1" value={icePoint} onChange={e => setIcePoint(e.target.value)} placeholder="0.0"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm font-mono text-mise-ink focus:outline-none focus:ring-2 focus:ring-mise-mid/30 ${icePoint !== '' ? (icePass ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-black/[0.08]'}`} />
          {icePoint !== '' && <p className={`text-xs mt-1 font-semibold ${icePass ? 'text-green-600' : 'text-red-600'}`}>{icePass ? '✓ Pass' : '✗ Fail — probe may need replacing'}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-mise-ink/50 uppercase tracking-wide">Boiling point reading (°C)</label>
          <p className="text-xs text-mise-ink/30 mb-1">Pass: 99°C to 101°C</p>
          <input type="number" step="0.1" value={boilingPoint} onChange={e => setBoilingPoint(e.target.value)} placeholder="100.0"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm font-mono text-mise-ink focus:outline-none focus:ring-2 focus:ring-mise-mid/30 ${boilingPoint !== '' ? (boilPass ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-black/[0.08]'}`} />
          {boilingPoint !== '' && <p className={`text-xs mt-1 font-semibold ${boilPass ? 'text-green-600' : 'text-red-600'}`}>{boilPass ? '✓ Pass' : '✗ Fail — probe may need replacing'}</p>}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-mise-ink/50 uppercase tracking-wide">Recorded by *</label>
        <input value={recordedBy} onChange={e => setRecordedBy(e.target.value)} placeholder="Your name"
          className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>
      <div>
        <label className="text-xs font-semibold text-mise-ink/50 uppercase tracking-wide">Notes</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Probe serial #, any issues"
          className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>
      <button onClick={save} disabled={saving || !icePoint || !boilingPoint || !recordedBy}
        className="bg-mise-deep text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
        {saving ? 'Saving…' : 'Log calibration'}
      </button>
    </div>
  )
}
