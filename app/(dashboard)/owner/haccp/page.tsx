import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HaccpPlanForm, ProbeCalibrationForm } from './HaccpForms'

export default async function HaccpPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) redirect('/owner')

  const [haccpRes, calsRes] = await Promise.all([
    supabase.from('haccp_plans').select('*').eq('restaurant_id', profile.restaurant_id).order('last_reviewed_date', { ascending: false }),
    supabase.from('probe_calibrations').select('*').eq('restaurant_id', profile.restaurant_id).order('calibrated_at', { ascending: false }).limit(10),
  ])

  const haccpPlans = haccpRes.data ?? []
  const calibrations = calsRes.data ?? []

  function icePass(v: number) { return v >= -1 && v <= 1 }
  function boilPass(v: number) { return v >= 99 && v <= 101 }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-semibold text-mise-ink">HACCP & Probe Calibration</h1>
        <p className="text-mise-ink/50 mt-1 text-sm">Records shown in EHO Inspection Mode</p>
      </div>

      {/* HACCP Plans */}
      <section className="space-y-4">
        <h2 className="font-semibold text-mise-ink">HACCP Plan</h2>

        {haccpPlans.length > 0 && (
          <div className="space-y-2 mb-4">
            {haccpPlans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl border border-black/[0.06] p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-mise-ink">{plan.title}</p>
                    <p className="text-mise-ink/50 text-xs mt-0.5">
                      Reviewed {new Date(plan.last_reviewed_date).toLocaleDateString('en-GB')} by {plan.reviewed_by}
                    </p>
                    {plan.document_url && (
                      <a href={plan.document_url} target="_blank" rel="noreferrer" className="text-xs text-mise-mid hover:underline mt-0.5 block">View document →</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
          <h3 className="font-medium text-mise-ink mb-4 text-sm">Add / update HACCP plan</h3>
          <HaccpPlanForm onSaved={() => {}} />
        </div>
      </section>

      {/* Probe Calibration */}
      <section className="space-y-4">
        <h2 className="font-semibold text-mise-ink">Probe Calibration Log</h2>

        {calibrations.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-black/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-black/[0.06]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mise-ink/40 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mise-ink/40 uppercase tracking-wide">Ice point</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mise-ink/40 uppercase tracking-wide">Boiling point</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mise-ink/40 uppercase tracking-wide">Result</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mise-ink/40 uppercase tracking-wide">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {calibrations.map(cal => {
                  const ip = icePass(cal.ice_point)
                  const bp = boilPass(cal.boiling_point)
                  const pass = ip && bp
                  return (
                    <tr key={cal.id} className={!pass ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2.5 text-xs text-mise-ink">{new Date(cal.calibrated_at).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-2.5 font-mono text-sm"><span className={ip ? 'text-green-700' : 'text-red-600 font-bold'}>{cal.ice_point}°C</span></td>
                      <td className="px-4 py-2.5 font-mono text-sm"><span className={bp ? 'text-green-700' : 'text-red-600 font-bold'}>{cal.boiling_point}°C</span></td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold ${pass ? 'text-green-600' : 'text-red-600'}`}>{pass ? '✓ Pass' : '✗ Fail'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-mise-ink/60">{cal.recorded_by}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
          <h3 className="font-medium text-mise-ink mb-4 text-sm">Log a calibration</h3>
          <ProbeCalibrationForm restaurantId={profile.restaurant_id} onSaved={() => {}} />
        </div>
      </section>
    </div>
  )
}
