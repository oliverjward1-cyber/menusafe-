'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Loader2 } from 'lucide-react'

const DAYPARTS = [
  { value: 'all-day', label: 'All day' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'brunch', label: 'Brunch' },
  { value: 'specials', label: 'Specials / seasonal' },
]

export default function NewMenuPage() {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [daypart, setDaypart] = useState('all-day')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Menu name is required'); return }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user?.id ?? '').single()
    const rid = profile?.restaurant_id
      ?? document.cookie.split('; ').find(r => r.startsWith('msafe_rid='))?.split('=')[1]

    if (!rid) { setError('No restaurant found'); setSaving(false); return }

    const { data, error: err } = await supabase
      .from('menus')
      .insert({ restaurant_id: rid, name: name.trim(), description: description.trim() || null, daypart })
      .select('id')
      .single()

    if (err || !data) { setError(err?.message ?? 'Failed to create menu'); setSaving(false); return }

    router.push(`/chef/menus/${data.id}`)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/chef/menus" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-display font-semibold text-mise-ink">Create menu</h1>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Menu name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Summer Menu 2025, Dinner Menu, Sunday Specials"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="e.g. Available June–August. Celebrating seasonal British produce."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Service</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DAYPARTS.map(d => (
              <button
                key={d.value}
                onClick={() => setDaypart(d.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left ${
                  daypart === d.value
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/chef/menus"
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save and add recipes →
          </button>
        </div>
      </div>
    </div>
  )
}
