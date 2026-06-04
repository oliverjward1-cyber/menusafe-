import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Thermometer, Plus } from 'lucide-react'
import TempLogForm from './TempLogForm'

export default async function TemperatureLogsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const rid = profile?.restaurant_id ?? ''

  const { data: logs } = await supabase
    .from('temperature_logs')
    .select('*')
    .eq('restaurant_id', rid)
    .order('logged_at', { ascending: false })
    .limit(100)

  const allLogs = logs ?? []

  // Group by date for display
  const byDate: Record<string, typeof allLogs> = {}
  for (const log of allLogs) {
    const d = new Date(log.logged_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(log)
  }

  function tempColor(temp: number, location: string) {
    const loc = location.toLowerCase()
    if (loc.includes('freezer') || loc.includes('frozen')) {
      return temp <= -18 ? 'text-green-700' : temp <= -15 ? 'text-amber-600' : 'text-red-600'
    }
    if (loc.includes('hot') || loc.includes('hold')) {
      return temp >= 63 ? 'text-green-700' : temp >= 60 ? 'text-amber-600' : 'text-red-600'
    }
    // Fridge / chilled default: ≤5°C safe
    return temp <= 5 ? 'text-green-700' : temp <= 8 ? 'text-amber-600' : 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/owner" className="text-mise-ink/40 hover:text-mise-ink transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-semibold text-mise-ink flex items-center gap-2">
              <Thermometer className="h-6 w-6 text-mise-mid" />
              Temperature Log
            </h1>
            <p className="text-sm text-mise-ink/50 mt-0.5">Record fridge, freezer and hot-hold temperatures</p>
          </div>
        </div>
      </div>

      {/* Log new reading */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-mise-ink mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-mise-mid" /> Record temperature check
        </h2>
        <TempLogForm restaurantId={rid} staffName={user.email ?? ''} />
      </div>

      {/* History */}
      <div className="space-y-4">
        {Object.keys(byDate).length === 0 && (
          <div className="text-center py-12 text-mise-ink/40 text-sm">
            No temperature checks yet. Record your first one above.
          </div>
        )}
        {Object.entries(byDate).map(([date, entries]) => (
          <div key={date} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-black/[0.04] bg-mise-cream/30">
              <p className="text-sm font-semibold text-mise-ink/60">{date}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.04]">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Location</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Temp</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Check</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">By</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(log => (
                  <tr key={log.id} className="border-b border-black/[0.04] last:border-0 hover:bg-mise-cream/20">
                    <td className="px-5 py-3 font-medium text-mise-ink">{log.location}</td>
                    <td className={`px-5 py-3 font-bold font-mono ${tempColor(log.temperature, log.location)}`}>
                      {log.temperature}°{log.unit}
                    </td>
                    <td className="px-5 py-3 text-mise-ink/60 capitalize">{log.check_type}</td>
                    <td className="px-5 py-3 text-mise-ink/60">{log.recorded_by}</td>
                    <td className="px-5 py-3 text-mise-ink/40">
                      {new Date(log.logged_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
