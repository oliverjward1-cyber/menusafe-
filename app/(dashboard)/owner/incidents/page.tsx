import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, AlertOctagon, Plus, CheckCircle2 } from 'lucide-react'
import IncidentForm from './IncidentForm'
import ResolveButton from './ResolveButton'

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  allergen_reaction: { label: 'Allergen reaction', emoji: '⚠️' },
  injury: { label: 'Injury', emoji: '🩹' },
  near_miss: { label: 'Near miss', emoji: '🔶' },
  contamination: { label: 'Contamination', emoji: '🧪' },
  pest: { label: 'Pest sighting', emoji: '🐀' },
  equipment: { label: 'Equipment failure', emoji: '🔧' },
  other: { label: 'Other', emoji: '📋' },
}

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-700 font-bold',
}

export default async function IncidentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id, role').eq('id', user.id).single()
  const rid = profile?.restaurant_id ?? ''

  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .eq('restaurant_id', rid)
    .order('occurred_at', { ascending: false })

  const allIncidents = incidents ?? []
  const open = allIncidents.filter(i => !i.resolved)
  const resolved = allIncidents.filter(i => i.resolved)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/owner" className="text-mise-ink/40 hover:text-mise-ink transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-semibold text-mise-ink flex items-center gap-2">
              <AlertOctagon className="h-6 w-6 text-red-500" />
              Incident Log
            </h1>
            <p className="text-sm text-mise-ink/50 mt-0.5">
              {open.length > 0 ? `${open.length} open incident${open.length !== 1 ? 's' : ''}` : 'No open incidents'}
            </p>
          </div>
        </div>
      </div>

      {/* Report new incident */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-mise-ink mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-red-500" /> Report an incident
        </h2>
        <IncidentForm restaurantId={rid} reportedBy={user.email?.split('@')[0] ?? ''} />
      </div>

      {/* Open incidents */}
      {open.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-mise-ink/60 uppercase tracking-widest px-1">Open</h2>
          {open.map(incident => {
            const t = TYPE_LABELS[incident.type] ?? TYPE_LABELS.other
            return (
              <div key={incident.id} className="bg-white rounded-2xl border border-red-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{t.emoji}</span>
                      <span className="font-semibold text-mise-ink">{incident.title}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${SEVERITY_STYLES[incident.severity]}`}>
                        {incident.severity}
                      </span>
                      <span className="text-xs text-mise-ink/40 bg-mise-cream px-2 py-0.5 rounded-full">{t.label}</span>
                    </div>
                    <p className="text-sm text-mise-ink/70 mt-2">{incident.description}</p>
                    {incident.affected_person && (
                      <p className="text-xs text-mise-ink/50 mt-1">Person affected: {incident.affected_person}</p>
                    )}
                    {incident.action_taken && (
                      <p className="text-xs text-green-700 mt-1">Action taken: {incident.action_taken}</p>
                    )}
                    <p className="text-xs text-mise-ink/40 mt-2">
                      Reported by {incident.reported_by} · {new Date(incident.occurred_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ResolveButton incidentId={incident.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resolved incidents */}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-mise-ink/60 uppercase tracking-widest px-1">Resolved</h2>
          {resolved.map(incident => {
            const t = TYPE_LABELS[incident.type] ?? TYPE_LABELS.other
            return (
              <div key={incident.id} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 opacity-60">
                <div className="flex items-center gap-2 flex-wrap">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-mise-ink">{incident.title}</span>
                  <span className="text-xs text-mise-ink/40 bg-mise-cream px-2 py-0.5 rounded-full">{t.label}</span>
                  <span className="text-xs text-mise-ink/40">
                    {new Date(incident.occurred_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {allIncidents.length === 0 && (
        <div className="text-center py-12 text-mise-ink/40 text-sm">
          No incidents recorded. Use the form above to log any issues.
        </div>
      )}
    </div>
  )
}
