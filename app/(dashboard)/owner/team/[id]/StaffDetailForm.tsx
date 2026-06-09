'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'head_chef', label: 'Head Chef' },
  { value: 'chef', label: 'Kitchen Staff' },
  { value: 'foh', label: 'Front of House' },
]

type Profile = {
  id: string
  full_name: string | null
  role: string
  email: string | null
  phone: string | null
  next_of_kin_name: string | null
  next_of_kin_phone: string | null
  notes: string | null
}

export default function StaffDetailForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    role: profile.role,
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    next_of_kin_name: profile.next_of_kin_name ?? '',
    next_of_kin_phone: profile.next_of_kin_phone ?? '',
    notes: profile.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('profiles').update({
      full_name: form.full_name || null,
      role: form.role,
      email: form.email || null,
      phone: form.phone || null,
      next_of_kin_name: form.next_of_kin_name || null,
      next_of_kin_phone: form.next_of_kin_phone || null,
      notes: form.notes || null,
    }).eq('id', profile.id)
    setSaving(false)
    if (err) setError(err.message)
    else setSaved(true)
  }

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-hospopilot-ink">Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Full name</label>
            <input
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => set('role', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              {ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="+44 7700 000000"
            />
          </div>
        </div>
      </div>

      {/* Next of kin */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-hospopilot-ink">Next of kin</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              value={form.next_of_kin_name}
              onChange={e => set('next_of_kin_name', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Next of kin name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={form.next_of_kin_phone}
              onChange={e => set('next_of_kin_phone', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="+44 7700 000000"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-hospopilot-ink">Notes</h2>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
          placeholder="Any additional notes about this team member..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>
          {saved ? 'Saved ✓' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
