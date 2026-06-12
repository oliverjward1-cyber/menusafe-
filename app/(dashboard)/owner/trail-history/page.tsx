import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Flag, Clock, ChevronRight } from 'lucide-react'

export default async function TrailHistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) redirect('/owner')

  const rid = profile.restaurant_id

  const { data: summaries } = await supabase
    .from('ops_trail_summaries')
    .select('*')
    .eq('restaurant_id', rid)
    .order('trail_date', { ascending: false })
    .limit(60)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/trail" className="text-hospopilot-ink/40 hover:text-hospopilot-ink transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-hospopilot-ink">Trail History</h1>
          <p className="text-hospopilot-ink/50 text-sm">All submitted daily trails</p>
        </div>
      </div>

      {(!summaries || summaries.length === 0) && (
        <div className="text-center py-16 text-hospopilot-ink/40">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No trails submitted yet. Complete and submit today&apos;s trail to see it here.</p>
        </div>
      )}

      <div className="space-y-2">
        {summaries?.map(s => {
          const date = new Date(s.trail_date + 'T12:00:00')
          const pct = s.total_tasks ? Math.round((s.completed_tasks / s.total_tasks) * 100) : 0
          const hasFlagged = s.flagged_tasks > 0

          return (
            <Link
              key={s.id}
              href={`/owner/trail-history/${s.trail_date}`}
              className="flex items-center gap-4 bg-white border border-black/[0.06] rounded-2xl p-4 shadow-sm hover:border-hospopilot-mid/30 transition-colors"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                ${pct === 100 ? 'bg-green-100' : hasFlagged ? 'bg-amber-100' : 'bg-gray-100'}`}>
                {pct === 100
                  ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                  : hasFlagged
                  ? <Flag className="h-5 w-5 text-amber-500" />
                  : <Clock className="h-5 w-5 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-hospopilot-ink text-sm">
                  {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-hospopilot-ink/40">
                    {s.completed_tasks}/{s.total_tasks} tasks · {pct}%
                  </span>
                  {hasFlagged && (
                    <span className="text-xs text-amber-600 font-medium">
                      {s.flagged_tasks} flagged
                    </span>
                  )}
                  <span className="text-xs text-hospopilot-ink/30">by {s.submitted_by}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-hospopilot-ink/20 flex-shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
