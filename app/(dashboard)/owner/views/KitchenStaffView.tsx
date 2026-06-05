import Link from 'next/link'
import { CheckCircle2, XCircle, Thermometer, Sparkles, Truck, AlertOctagon, BookOpen, ExternalLink, QrCode } from 'lucide-react'

export default function KitchenStaffView({ data }: { data: any }) {
  const { restaurantSlug, staffPin, tempStatus, cleaningDue, openIncidents } = data

  const kitchenUrl = `/kitchen/${restaurantSlug}`

  const tasks = [
    {
      label: 'Temperature check',
      icon: Thermometer,
      status: tempStatus?.amDone && tempStatus?.pmDone ? 'done' : tempStatus?.amDone ? 'partial' : 'pending',
      detail: tempStatus?.amDone && tempStatus?.pmDone ? 'Both checks done today' : tempStatus?.amDone ? 'PM check still needed' : 'AM & PM checks needed',
      href: `${kitchenUrl}/temperature`,
    },
    {
      label: 'Cleaning tasks',
      icon: Sparkles,
      status: cleaningDue === 0 ? 'done' : 'pending',
      detail: cleaningDue === 0 ? 'All tasks signed off' : `${cleaningDue} task${cleaningDue !== 1 ? 's' : ''} outstanding`,
      href: `${kitchenUrl}/cleaning`,
    },
    {
      label: 'Deliveries',
      icon: Truck,
      status: 'neutral',
      detail: 'Log a new delivery',
      href: `${kitchenUrl}/delivery`,
    },
    {
      label: 'Incidents',
      icon: AlertOctagon,
      status: openIncidents.length > 0 ? 'alert' : 'neutral',
      detail: openIncidents.length > 0 ? `${openIncidents.length} open incident${openIncidents.length !== 1 ? 's' : ''}` : 'Report an incident',
      href: `${kitchenUrl}/incident`,
    },
    {
      label: 'Allergen learning',
      icon: BookOpen,
      status: 'neutral',
      detail: '14 modules + UK food law',
      href: `${kitchenUrl}/learn`,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-700 font-medium">
        🍳 Kitchen Staff view — this is what staff see on their portal
      </div>

      {/* Portal access */}
      <div className="bg-mise-ink rounded-2xl p-4 text-white">
        <p className="text-xs text-white/50 uppercase tracking-wide font-semibold mb-1">Kitchen portal</p>
        <p className="font-mono text-sm text-white/80">{kitchenUrl}</p>
        <div className="flex items-center gap-3 mt-3">
          {staffPin ? (
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-sm font-mono tracking-widest">{staffPin}</div>
          ) : (
            <div className="bg-red-500/20 text-red-300 rounded-xl px-3 py-1.5 text-xs font-medium">No PIN set — staff can't log in</div>
          )}
          <Link href="/owner/kitchen-settings" className="text-xs text-white/50 hover:text-white transition-colors">
            {staffPin ? 'Change PIN' : 'Set PIN →'}
          </Link>
        </div>
        <Link href={kitchenUrl} target="_blank"
          className="mt-3 flex items-center gap-1.5 text-xs text-mise-fresh hover:underline">
          <ExternalLink className="h-3 w-3" /> Open kitchen portal
        </Link>
      </div>

      {/* Today's task status */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
        <p className="text-sm font-semibold text-mise-ink mb-3">Today's task status</p>
        <div className="space-y-2">
          {tasks.map(task => {
            const Icon = task.icon
            const isDone = task.status === 'done'
            const isPending = task.status === 'pending'
            const isAlert = task.status === 'alert'
            return (
              <div key={task.label} className={`flex items-center gap-3 p-3 rounded-xl border ${
                isDone ? 'bg-green-50 border-green-100' :
                isAlert ? 'bg-red-50 border-red-100' :
                isPending ? 'bg-amber-50 border-amber-100' :
                'bg-gray-50 border-transparent'
              }`}>
                <Icon className={`h-4 w-4 flex-shrink-0 ${isDone ? 'text-green-500' : isAlert ? 'text-red-500' : isPending ? 'text-amber-500' : 'text-mise-ink/30'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-mise-ink">{task.label}</p>
                  <p className={`text-xs ${isDone ? 'text-green-600' : isAlert ? 'text-red-600' : isPending ? 'text-amber-600' : 'text-mise-ink/40'}`}>{task.detail}</p>
                </div>
                {isDone
                  ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  : isPending || isAlert
                    ? <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    : null}
              </div>
            )
          })}
        </div>
      </div>

      {/* Print QR */}
      <Link href="/owner/kitchen-settings"
        className="flex items-center gap-3 bg-white border border-black/[0.06] rounded-2xl p-4 hover:border-mise-mid/30 transition-all">
        <QrCode className="h-8 w-8 text-mise-mid" />
        <div>
          <p className="text-sm font-semibold text-mise-ink">Print kitchen QR code</p>
          <p className="text-xs text-mise-ink/40">Stick it in the kitchen so staff can scan to log in</p>
        </div>
        <ExternalLink className="h-4 w-4 text-mise-ink/20 ml-auto" />
      </Link>
    </div>
  )
}
