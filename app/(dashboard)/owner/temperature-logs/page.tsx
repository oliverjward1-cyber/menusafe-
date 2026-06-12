import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Thermometer, Plus, Info } from 'lucide-react'
import TempLogForm from './TempLogForm'
import PrintButton from '@/components/ui/PrintButton'

const CHECK_TYPE_LABELS: Record<string, string> = {
  cooking: 'Cooking',
  hot_holding: 'Hot holding',
}

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
    .in('check_type', ['cooking', 'hot_holding'])
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

  function tempColor(temp: number, checkType: string) {
    if (checkType === 'hot_holding') {
      return temp >= 63 ? 'text-green-700' : temp >= 60 ? 'text-amber-600' : 'text-red-600'
    }
    // Cooking: core temp should reach 75°C (or 70°C held for 2 mins)
    return temp >= 75 ? 'text-green-700' : temp >= 70 ? 'text-amber-600' : 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/owner" className="text-hospopilot-ink/40 hover:text-hospopilot-ink transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-semibold text-hospopilot-ink flex items-center gap-2">
              <Thermometer className="h-6 w-6 text-hospopilot-mid" />
              Cooking Temp Checks
            </h1>
            <p className="text-sm text-hospopilot-ink/50 mt-0.5">Record cooking and hot-holding temperatures</p>
          </div>
        </div>
        <PrintButton label="Print log" />
      </div>

      {/* Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
        <div className="bg-hospopilot-cream/40 border border-hospopilot-mid/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-hospopilot-ink flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-hospopilot-mid" /> Cooking — what to look for
          </p>
          <ul className="text-xs text-hospopilot-ink/60 space-y-1 list-disc pl-4">
            <li>Cook food to a core temperature of <strong>75°C</strong> or above</li>
            <li>Or hold at <strong>70°C for 2 minutes</strong> as an alternative</li>
            <li>Check the thickest part of the food, away from bone</li>
            <li>Below 70°C — return to cook and re-check before serving</li>
          </ul>
        </div>

        <div className="bg-hospopilot-cream/40 border border-hospopilot-mid/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-hospopilot-ink flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-hospopilot-mid" /> Hot holding — what to look for
          </p>
          <ul className="text-xs text-hospopilot-ink/60 space-y-1 list-disc pl-4">
            <li>Food held for service must stay at <strong>63°C or above</strong></li>
            <li>Check bain maries, hot cabinets and pass shelves regularly</li>
            <li>Below 63°C — reheat to 75°C or discard after 2 hours</li>
            <li>Don&apos;t hold food for more than 2 hours below 63°C</li>
          </ul>
        </div>
      </div>

      {/* Log new reading */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm no-print">
        <h2 className="text-base font-semibold text-hospopilot-ink mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-hospopilot-mid" /> Record temperature check
        </h2>
        <TempLogForm restaurantId={rid} staffName={user.email ?? ''} />
      </div>

      {/* History */}
      <div className="space-y-4">
        {Object.keys(byDate).length === 0 && (
          <div className="text-center py-12 text-hospopilot-ink/40 text-sm">
            No temperature checks yet. Record your first one above.
          </div>
        )}
        {Object.entries(byDate).map(([date, entries]) => (
          <div key={date} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-black/[0.04] bg-hospopilot-cream/30">
              <p className="text-sm font-semibold text-hospopilot-ink/60">{date}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.04]">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-hospopilot-ink/40 uppercase tracking-widest">Type</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-hospopilot-ink/40 uppercase tracking-widest">Item</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-hospopilot-ink/40 uppercase tracking-widest">Temp</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-hospopilot-ink/40 uppercase tracking-widest">By</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-hospopilot-ink/40 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(log => (
                  <tr key={log.id} className="border-b border-black/[0.04] last:border-0 hover:bg-hospopilot-cream/20">
                    <td className="px-5 py-3 text-hospopilot-ink/60">{CHECK_TYPE_LABELS[log.check_type] ?? log.check_type}</td>
                    <td className="px-5 py-3 font-medium text-hospopilot-ink">{log.location}</td>
                    <td className={`px-5 py-3 font-bold font-mono ${tempColor(log.temperature, log.check_type)}`}>
                      {log.temperature}°{log.unit}
                    </td>
                    <td className="px-5 py-3 text-hospopilot-ink/60">{log.recorded_by}</td>
                    <td className="px-5 py-3 text-hospopilot-ink/40">
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
