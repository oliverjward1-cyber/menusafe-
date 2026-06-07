import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Plus, ClipboardList } from 'lucide-react'
import CleaningTaskList from './CleaningTaskList'
import AddTaskForm from './AddTaskForm'
import AdHocTaskForm from './AdHocTaskForm'

export default async function CleaningPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const rid = profile?.restaurant_id ?? ''

  const [tasksRes, logsRes] = await Promise.all([
    supabase.from('cleaning_tasks').select('*').eq('restaurant_id', rid).eq('is_active', true).order('frequency').order('name'),
    supabase.from('cleaning_logs').select('*').eq('restaurant_id', rid).order('completed_at', { ascending: false }).limit(50),
  ])

  const tasks = tasksRes.data ?? []
  const logs = logsRes.data ?? []

  // Find last sign-off per task
  const lastSignOff: Record<string, string> = {}
  for (const log of logs) {
    if (log.task_id && !lastSignOff[log.task_id]) {
      lastSignOff[log.task_id] = log.completed_at
    }
  }

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  function isDue(task: typeof tasks[number]) {
    const last = lastSignOff[task.id]
    if (!last) return true
    const lastDate = new Date(last)
    if (task.frequency === 'daily') return lastDate.toISOString().split('T')[0] < todayStr
    if (task.frequency === 'weekly') return (now.getTime() - lastDate.getTime()) > 7 * 24 * 60 * 60 * 1000
    if (task.frequency === 'monthly') return (now.getTime() - lastDate.getTime()) > 30 * 24 * 60 * 60 * 1000
    return false
  }

  const dailyTasks = tasks.filter(t => t.frequency === 'daily')
  const weeklyTasks = tasks.filter(t => t.frequency === 'weekly')
  const monthlyTasks = tasks.filter(t => t.frequency === 'monthly')

  const dueTodayCount = tasks.filter(isDue).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/owner" className="text-mise-ink/40 hover:text-mise-ink transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-semibold text-mise-ink flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-mise-mid" />
              Cleaning Schedule
            </h1>
            <p className="text-sm text-mise-ink/50 mt-0.5">
              {dueTodayCount > 0
                ? `${dueTodayCount} task${dueTodayCount !== 1 ? 's' : ''} outstanding`
                : 'All tasks signed off'}
            </p>
          </div>
        </div>
      </div>

      {tasks.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          No cleaning tasks set up yet. Add your first task below to start tracking.
        </div>
      )}

      {/* Task groups */}
      {[
        { label: 'Daily', tasks: dailyTasks },
        { label: 'Weekly', tasks: weeklyTasks },
        { label: 'Monthly', tasks: monthlyTasks },
      ].filter(g => g.tasks.length > 0).map(group => (
        <div key={group.label} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-black/[0.04] bg-mise-cream/30">
            <p className="text-sm font-semibold text-mise-ink/60">{group.label} tasks</p>
          </div>
          <CleaningTaskList
            tasks={group.tasks}
            lastSignOff={lastSignOff}
            restaurantId={rid}
            staffName={user.email?.split('@')[0] ?? ''}
          />
        </div>
      ))}

      {/* Log a one-off job */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-mise-ink mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-mise-mid" /> Log a one-off job
        </h2>
        <p className="text-sm text-mise-ink/50 -mt-2 mb-4">
          For unscheduled jobs — a one-off clean, an unexpected delivery, a maintenance issue — that don't belong on the recurring schedule.
        </p>
        <AdHocTaskForm restaurantId={rid} staffName={user.email?.split('@')[0] ?? ''} />
      </div>

      {/* Add task */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-mise-ink mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-mise-mid" /> Add cleaning task
        </h2>
        <AddTaskForm restaurantId={rid} />
      </div>

      {/* Recent sign-off log */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-black/[0.04]">
            <p className="text-sm font-semibold text-mise-ink">Recent sign-offs</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.04]">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Task</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Signed by</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map(log => (
                <tr key={log.id} className="border-b border-black/[0.04] last:border-0">
                  <td className="px-5 py-3 font-medium text-mise-ink">{log.task_name}</td>
                  <td className="px-5 py-3 text-mise-ink/60">{log.signed_by}</td>
                  <td className="px-5 py-3 text-mise-ink/40">
                    {new Date(log.completed_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
