'use client'

import { useEffect, useState } from 'react'

const CATEGORIES = [
  'Temperature Control',
  'Personal Hygiene',
  'Storage',
  'Preparation & Cross-Contamination',
  'Cleaning',
  'Allergen Management',
  'HACCP & Records',
  'Pest Control',
]

interface AuditQuestion {
  id: string
  key: string
  label: string
  category: string
  requires_photo_on_fail: boolean
  position: number
}

interface EditState {
  label: string
  category: string
  requires_photo_on_fail: boolean
}

const emptyNew = (): EditState => ({
  label: '',
  category: CATEGORIES[0],
  requires_photo_on_fail: false,
})

export default function AuditQuestionsManager({ restaurantId }: { restaurantId: string }) {
  const [questions, setQuestions] = useState<AuditQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>(emptyNew())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState<EditState>(emptyNew())
  const [saving, setSaving] = useState(false)

  async function fetchQuestions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/audit-questions')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load')
      setQuestions(json.questions ?? [])
      return json.questions as AuditQuestion[]
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return []
    } finally {
      setLoading(false)
    }
  }

  async function seed() {
    await fetch('/api/owner/audit-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed' }),
    })
  }

  useEffect(() => {
    fetchQuestions().then(async (qs) => {
      if (qs.length === 0) {
        await seed()
        await fetchQuestions()
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startEdit(q: AuditQuestion) {
    setEditingId(q.id)
    setEditState({ label: q.label, category: q.category, requires_photo_on_fail: q.requires_photo_on_fail })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/owner/audit-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          id,
          question: {
            label: editState.label,
            category: editState.category,
            requiresPhotoOnFail: editState.requires_photo_on_fail,
          },
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setEditingId(null)
      await fetchQuestions()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return
    setSaving(true)
    try {
      const res = await fetch('/api/owner/audit-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      if (!res.ok) throw new Error('Delete failed')
      await fetchQuestions()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  async function addQuestion() {
    if (!newQuestion.label.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/owner/audit-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          question: {
            label: newQuestion.label.trim(),
            category: newQuestion.category,
            requiresPhotoOnFail: newQuestion.requires_photo_on_fail,
          },
        }),
      })
      if (!res.ok) throw new Error('Add failed')
      setNewQuestion(emptyNew())
      setShowAddForm(false)
      await fetchQuestions()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Add failed')
    } finally {
      setSaving(false)
    }
  }

  // Group by category
  const grouped = CATEGORIES.reduce<Record<string, AuditQuestion[]>>((acc, cat) => {
    acc[cat] = questions.filter((q) => q.category === cat)
    return acc
  }, {})

  // Also handle any questions with unknown categories
  const unknownCats = Array.from(new Set(questions.map((q) => q.category).filter((c) => !CATEGORIES.includes(c))))
  unknownCats.forEach((cat) => {
    grouped[cat] = questions.filter((q) => q.category === cat)
  })

  const allCategories = [...CATEGORIES, ...unknownCats]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500 text-sm">Loading questions…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audit Questions</h1>
          <p className="text-sm text-gray-500 mt-1">Customise the kitchen audit checklist</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setNewQuestion(emptyNew()) }}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Add question
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-gray-900 text-sm">New question</h3>
          <input
            type="text"
            placeholder="Question label"
            value={newQuestion.label}
            onChange={(e) => setNewQuestion((prev) => ({ ...prev, label: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <div className="flex gap-3 flex-wrap items-center">
            <select
              value={newQuestion.category}
              onChange={(e) => setNewQuestion((prev) => ({ ...prev, category: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={newQuestion.requires_photo_on_fail}
                onChange={(e) => setNewQuestion((prev) => ({ ...prev, requires_photo_on_fail: e.target.checked }))}
                className="rounded"
              />
              Requires photo on fail
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addQuestion}
              disabled={saving || !newQuestion.label.trim()}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Questions by category */}
      {allCategories.map((cat) => {
        const qs = grouped[cat]
        if (!qs || qs.length === 0) return null
        return (
          <div key={cat} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">{cat}</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {qs.map((q) => (
                <li key={q.id} className="px-5 py-3">
                  {editingId === q.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editState.label}
                        onChange={(e) => setEditState((prev) => ({ ...prev, label: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      <div className="flex gap-3 flex-wrap items-center">
                        <select
                          value={editState.category}
                          onChange={(e) => setEditState((prev) => ({ ...prev, category: e.target.value }))}
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editState.requires_photo_on_fail}
                            onChange={(e) => setEditState((prev) => ({ ...prev, requires_photo_on_fail: e.target.checked }))}
                            className="rounded"
                          />
                          Requires photo on fail
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(q.id)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{q.label}</p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            {q.category}
                          </span>
                          {q.requires_photo_on_fail && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                              Photo required on fail
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => startEdit(q)}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="px-3 py-1.5 border border-red-100 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      {questions.length === 0 && !loading && (
        <div className="text-center text-gray-400 text-sm py-16">No questions found.</div>
      )}
    </div>
  )
}
