'use client'

import { useEffect, useState } from 'react'

type QuizType = 'front_of_house' | 'kitchen'

interface QuizQuestion {
  id: string
  quiz_type: QuizType
  question: string
  options: string[]
  correct_index: number
  created_at: string
}

interface QuizEdit {
  question: string
  options: [string, string, string, string]
  correct_index: number
}

const emptyEdit = (): QuizEdit => ({
  question: '',
  options: ['', '', '', ''],
  correct_index: 0,
})

const OPTION_LABELS = ['A', 'B', 'C', 'D']

const TABS: { type: QuizType; label: string }[] = [
  { type: 'front_of_house', label: 'Front of House' },
  { type: 'kitchen', label: 'Kitchen Staff' },
]

export default function QuizQuestionsManager({ restaurantId }: { restaurantId: string }) {
  const [activeTab, setActiveTab] = useState<QuizType>('front_of_house')
  const [questions, setQuestions] = useState<Record<QuizType, QuizQuestion[]>>({
    front_of_house: [],
    kitchen: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<QuizEdit>(emptyEdit())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState<QuizEdit>(emptyEdit())
  const [saving, setSaving] = useState(false)

  async function fetchQuestions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/quiz-questions')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load')
      setQuestions({
        front_of_house: json.questions?.front_of_house ?? [],
        kitchen: json.questions?.kitchen ?? [],
      })
      return json.questions as Record<QuizType, QuizQuestion[]>
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return { front_of_house: [], kitchen: [] }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function seed(quizType: QuizType) {
    setSaving(true)
    try {
      const res = await fetch('/api/owner/quiz-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed', quizType }),
      })
      if (!res.ok) throw new Error('Seed failed')
      await fetchQuestions()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Seed failed')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(q: QuizQuestion) {
    setEditingId(q.id)
    const opts = [...q.options] as [string, string, string, string]
    while (opts.length < 4) opts.push('')
    setEditState({ question: q.question, options: opts as [string, string, string, string], correct_index: q.correct_index })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/owner/quiz-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          id,
          question: {
            question: editState.question,
            options: editState.options,
            correctIndex: editState.correct_index,
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
      const res = await fetch('/api/owner/quiz-questions', {
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
    if (!newQuestion.question.trim() || newQuestion.options.some((o) => !o.trim())) return
    setSaving(true)
    try {
      const res = await fetch('/api/owner/quiz-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          quizType: activeTab,
          question: {
            question: newQuestion.question.trim(),
            options: newQuestion.options,
            correctIndex: newQuestion.correct_index,
          },
        }),
      })
      if (!res.ok) throw new Error('Add failed')
      setNewQuestion(emptyEdit())
      setShowAddForm(false)
      await fetchQuestions()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Add failed')
    } finally {
      setSaving(false)
    }
  }

  const tabQuestions = questions[activeTab]

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
          <h1 className="text-2xl font-semibold text-gray-900">Quiz Questions</h1>
          <p className="text-sm text-gray-500 mt-1">Customise the allergen knowledge quiz for staff</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setNewQuestion(emptyEdit()) }}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Add question
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => { setActiveTab(tab.type); setShowAddForm(false); setEditingId(null) }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.type
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 space-y-4">
          <h3 className="font-medium text-gray-900 text-sm">New question ({activeTab === 'front_of_house' ? 'Front of House' : 'Kitchen Staff'})</h3>
          <textarea
            placeholder="Question text"
            value={newQuestion.question}
            onChange={(e) => setNewQuestion((prev) => ({ ...prev, question: e.target.value }))}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
          <div className="space-y-2">
            {newQuestion.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-4">{OPTION_LABELS[i]}</span>
                <input
                  type="text"
                  placeholder={`Option ${OPTION_LABELS[i]}`}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...newQuestion.options] as [string, string, string, string]
                    opts[i] = e.target.value
                    setNewQuestion((prev) => ({ ...prev, options: opts }))
                  }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="radio"
                  name="new-correct"
                  checked={newQuestion.correct_index === i}
                  onChange={() => setNewQuestion((prev) => ({ ...prev, correct_index: i }))}
                  className="accent-green-600"
                  title="Mark as correct answer"
                />
              </div>
            ))}
            <p className="text-xs text-gray-400">Select the radio button next to the correct answer</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addQuestion}
              disabled={saving || !newQuestion.question.trim() || newQuestion.options.some((o) => !o.trim())}
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

      {/* Empty state */}
      {tabQuestions.length === 0 && !showAddForm && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-10 text-center space-y-4">
          <p className="text-gray-500 text-sm">No questions yet for this quiz type.</p>
          <button
            onClick={() => seed(activeTab)}
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Load default questions
          </button>
        </div>
      )}

      {/* Question list */}
      {tabQuestions.length > 0 && (
        <div className="space-y-3">
          {tabQuestions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
              {editingId === q.id ? (
                <div className="space-y-4">
                  <textarea
                    value={editState.question}
                    onChange={(e) => setEditState((prev) => ({ ...prev, question: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  />
                  <div className="space-y-2">
                    {editState.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-4">{OPTION_LABELS[i]}</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const opts = [...editState.options] as [string, string, string, string]
                            opts[i] = e.target.value
                            setEditState((prev) => ({ ...prev, options: opts }))
                          }}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        <input
                          type="radio"
                          name={`edit-correct-${q.id}`}
                          checked={editState.correct_index === i}
                          onChange={() => setEditState((prev) => ({ ...prev, correct_index: i }))}
                          className="accent-green-600"
                          title="Mark as correct answer"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">Select the radio button next to the correct answer</p>
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
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex gap-2">
                      <span className="text-xs font-semibold text-gray-400 mt-0.5">Q{idx + 1}</span>
                      <p className="text-sm font-medium text-gray-900">{q.question}</p>
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
                  <div className="space-y-1.5 ml-6">
                    {(q.options as string[]).map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                          i === q.correct_index
                            ? 'bg-green-50 text-green-800 font-medium'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="text-xs font-bold w-4 shrink-0">{OPTION_LABELS[i]}</span>
                        <span>{opt}</span>
                        {i === q.correct_index && (
                          <span className="ml-auto text-xs text-green-600 font-medium">Correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
