'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Circle, Sparkles } from 'lucide-react'

type Task = { id: string; name: string; frequency: string; area: string | null; done: boolean }

export default function StaffCleaning() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [restaurantId, setRestaurantId] = useState('')
  const [staffName, setStaffName] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [signingOff, setSigningOff] = useState<string | null>(null)
  const [allDone, setAllDone] = useState(false)

  useEffect(() => {
    const rid = sessionStorage.getItem('staff_restaurant_id')
    const name = sessionStorage.getItem('staff_name')
    if (!rid) { router.replace(`/kitchen/${slug}`); return }
    setRestaurantId(rid)
    setStaffName(name ?? '')
    loadTasks(rid)
  }, [slug, router])

  async function loadTasks(rid: string) {
    setLoading(true)
    const res = await fetch(`/api/kitchen/cleaning?restaurantId=${rid}`)
    const data = await res.json()
    setTasks(data.tasks ?? [])
    setLoading(false)
  }

  async function signOff(task: Task) {
    setSigningOff(task.id)
    await fetch('/api/compliance/cleaning/sign-off', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, taskId: task.id, taskName: task.name, signedBy: staffName, source: 'staff' }),
    })
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: true } : t))
    setSigningOff(null)
  }

  const remaining = tasks.filter(t => !t.done)

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-mise-ink/40 text-sm animate-pulse">Loading tasks…</p>
    </div>
  )

  if (tasks.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <Sparkles className="h-12 w-12 text-mise-mid/30 mb-3" />
      <p className="text-mise-ink/60 font-medium">No cleaning tasks set up yet</p>
      <p className="text-mise-ink/30 text-sm mt-1">Ask your manager to add tasks in the owner portal</p>
      <button onClick={() => router.back()} className="mt-6 text-mise-mid text-sm font-medium">← Back</button>
    </div>
  )

  if (remaining.length === 0 && !loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
      <h2 className="text-xl font-semibold text-mise-ink">All done!</h2>
      <p className="text-mise-ink/50 text-sm mt-1">All cleaning tasks signed off</p>
      <button onClick={() => router.push(`/kitchen/${slug}/tasks`)} className="mt-6 bg-mise-deep text-white rounded-xl px-6 py-3 font-semibold text-sm">Back to tasks</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-mise-ink px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <p className="text-white font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" /> Cleaning tasks</p>
          <p className="text-white/40 text-xs">{remaining.length} remaining · {staffName}</p>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-3">
        {tasks.map(task => (
          <div key={task.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 transition-opacity ${task.done ? 'opacity-40' : ''}`}>
            <button onClick={() => !task.done && signOff(task)} disabled={task.done || signingOff === task.id}
              className="flex-shrink-0">
              {task.done
                ? <CheckCircle2 className="h-7 w-7 text-green-500" />
                : signingOff === task.id
                ? <div className="h-7 w-7 rounded-full border-2 border-mise-mid border-t-transparent animate-spin" />
                : <Circle className="h-7 w-7 text-mise-ink/20" />}
            </button>
            <div className="flex-1">
              <p className={`font-medium text-mise-ink ${task.done ? 'line-through' : ''}`}>{task.name}</p>
              {task.area && <p className="text-xs text-mise-ink/40 mt-0.5">{task.area}</p>}
              <p className="text-xs text-mise-ink/30 capitalize mt-0.5">{task.frequency}</p>
            </div>
            {!task.done && (
              <button onClick={() => signOff(task)} disabled={signingOff === task.id}
                className="flex-shrink-0 bg-mise-deep text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-40">
                Done
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
