'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

type Task = {
  id: string
  name: string
  frequency: string
  area: string | null
}

export default function CleaningTaskList({
  tasks,
  lastSignOff,
  restaurantId,
  staffName,
}: {
  tasks: Task[]
  lastSignOff: Record<string, string>
  restaurantId: string
  staffName: string
}) {
  const router = useRouter()
  const [signingOff, setSigningOff] = useState<string | null>(null)
  const [name, setName] = useState(staffName)
  const [activeTask, setActiveTask] = useState<string | null>(null)

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  function isDone(task: Task) {
    const last = lastSignOff[task.id]
    if (!last) return false
    const lastDate = new Date(last)
    if (task.frequency === 'daily') return lastDate.toISOString().split('T')[0] === todayStr
    if (task.frequency === 'weekly') return (now.getTime() - lastDate.getTime()) <= 7 * 24 * 60 * 60 * 1000
    if (task.frequency === 'monthly') return (now.getTime() - lastDate.getTime()) <= 30 * 24 * 60 * 60 * 1000
    return false
  }

  async function signOff(task: Task) {
    setSigningOff(task.id)
    await fetch('/api/compliance/cleaning/sign-off', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, taskId: task.id, taskName: task.name, signedBy: name }),
    })
    setSigningOff(null)
    setActiveTask(null)
    router.refresh()
  }

  return (
    <div className="divide-y divide-black/[0.04]">
      {tasks.map(task => {
        const done = isDone(task)
        const last = lastSignOff[task.id]
        return (
          <div key={task.id} className="px-5 py-3 flex items-center gap-3">
            <button
              onClick={() => done ? null : setActiveTask(activeTask === task.id ? null : task.id)}
              className="flex-shrink-0"
            >
              {done
                ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                : <Circle className="h-5 w-5 text-mise-ink/20 hover:text-mise-mid transition-colors" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${done ? 'text-mise-ink/40 line-through' : 'text-mise-ink'}`}>{task.name}</p>
              {task.area && <p className="text-xs text-mise-ink/40">{task.area}</p>}
              {last && !done && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  Last done {new Date(last).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              )}
              {done && last && (
                <p className="text-xs text-green-600 mt-0.5">
                  Signed off {new Date(last).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {activeTask === task.id && !done && (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="border border-black/[0.08] rounded-lg px-2.5 py-1.5 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
                />
                <button
                  onClick={() => signOff(task)}
                  disabled={signingOff === task.id || !name.trim()}
                  className="bg-mise-deep text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                >
                  {signingOff === task.id ? '…' : 'Sign off'}
                </button>
              </div>
            )}

            {!activeTask && !done && (
              <button
                onClick={() => setActiveTask(task.id)}
                className="text-xs font-semibold text-mise-mid hover:text-mise-deep transition-colors flex-shrink-0"
              >
                Sign off
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
