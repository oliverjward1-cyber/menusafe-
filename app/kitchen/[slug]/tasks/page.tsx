'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Thermometer, Sparkles, Truck, AlertOctagon, BookOpen,
  CheckCircle2, Clock, ArrowRight, LogOut, ListChecks,
} from 'lucide-react'

type Task = {
  id: string
  href: string
  icon: any
  label: string
  description: string
  colour: string
  urgent?: boolean
}

export default function StaffTaskBoard() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [staffName, setStaffName] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantId, setRestaurantId] = useState('')
  const [tempStatus, setTempStatus] = useState<{ amDone: boolean; pmDone: boolean } | null>(null)
  const [cleaningDue, setCleaningDue] = useState(0)
  const [openIncidents, setOpenIncidents] = useState(0)
  const [modulesDone, setModulesDone] = useState<number | null>(null)

  useEffect(() => {
    const name = sessionStorage.getItem('staff_name')
    const rid = sessionStorage.getItem('staff_restaurant_id')
    const rname = sessionStorage.getItem('staff_restaurant_name')
    if (!name || !rid) { router.replace(`/kitchen/${slug}`); return }
    setStaffName(name)
    setRestaurantId(rid)
    setRestaurantName(rname ?? '')

    // Load today's status
    fetch(`/api/kitchen/status?restaurantId=${rid}`)
      .then(r => r.json())
      .then(d => {
        setTempStatus({ amDone: d.amDone, pmDone: d.pmDone })
        setCleaningDue(d.cleaningDue ?? 0)
        setOpenIncidents(d.openIncidents ?? 0)
        setModulesDone(d.modulesDone ?? 0)
      })
  }, [slug, router])

  const now = new Date()
  const hour = now.getHours()
  const amOverdue = tempStatus && !tempStatus.amDone && hour >= 10
  const pmOverdue = tempStatus && !tempStatus.pmDone && hour >= 18

  const tasks: Task[] = [
    {
      id: 'temp',
      href: `/kitchen/${slug}/temperature`,
      icon: Thermometer,
      label: 'Temperature check',
      description: tempStatus
        ? (tempStatus.amDone && tempStatus.pmDone)
          ? 'Both checks done today ✓'
          : (!tempStatus.amDone ? 'AM check needed' : 'PM check needed')
        : 'Log fridge, freezer & hot-hold temps',
      colour: (amOverdue || pmOverdue) ? 'border-red-300 bg-red-50' : tempStatus?.amDone && tempStatus?.pmDone ? 'border-green-200 bg-green-50' : 'border-black/[0.06] bg-white',
      urgent: !!(amOverdue || pmOverdue),
    },
    {
      id: 'cleaning',
      href: `/kitchen/${slug}/cleaning`,
      icon: Sparkles,
      label: 'Cleaning tasks',
      description: cleaningDue > 0 ? `${cleaningDue} task${cleaningDue !== 1 ? 's' : ''} outstanding` : 'All tasks signed off',
      colour: cleaningDue > 0 ? 'border-amber-200 bg-amber-50' : 'border-black/[0.06] bg-white',
      urgent: cleaningDue > 0,
    },
    {
      id: 'delivery',
      href: `/kitchen/${slug}/delivery`,
      icon: Truck,
      label: 'Log a delivery',
      description: 'Record supplier, temperature and condition',
      colour: 'border-black/[0.06] bg-white',
    },
    {
      id: 'incident',
      href: `/kitchen/${slug}/incident`,
      icon: AlertOctagon,
      label: 'Report an incident',
      description: openIncidents > 0 ? `${openIncidents} open incident${openIncidents !== 1 ? 's' : ''}` : 'Allergen reaction, injury or near miss',
      colour: openIncidents > 0 ? 'border-red-200 bg-red-50' : 'border-black/[0.06] bg-white',
      urgent: openIncidents > 0,
    },
    {
      id: 'learn',
      href: `/kitchen/${slug}/learn`,
      icon: BookOpen,
      label: 'Allergen learning',
      description: modulesDone !== null ? `${modulesDone} of 14 modules completed` : '14 modules · ~5 min each',
      colour: modulesDone === 14 ? 'border-green-200 bg-green-50' : 'border-black/[0.06] bg-white',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-mise-ink px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold">{restaurantName}</p>
          <p className="text-white/50 text-sm">Hi {staffName.split(' ')[0]} 👋</p>
        </div>
        <button onClick={() => { sessionStorage.clear(); router.push(`/kitchen/${slug}`) }}
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="px-4 py-5 space-y-3 max-w-lg mx-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
          {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {/* Daily Trail CTA */}
        <Link href={`/kitchen/${slug}/trail`}
          className="flex items-center gap-4 p-4 rounded-2xl border-2 border-mise-mid bg-mise-mid/5 shadow-sm active:scale-[0.98] transition-transform">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-mise-mid/10">
            <ListChecks className="h-5 w-5 text-mise-mid" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-mise-ink text-sm">Today&apos;s Trail</p>
            <p className="text-xs mt-0.5 text-mise-ink/50">Work through your daily tasks in order</p>
          </div>
          <ArrowRight className="h-4 w-4 text-mise-mid flex-shrink-0" />
        </Link>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 pt-1">Quick log</p>

        {tasks.map(task => (
          <Link key={task.id} href={task.href}
            className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm active:scale-[0.98] transition-transform ${task.colour}`}>
            <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${task.urgent ? 'bg-red-100' : 'bg-mise-ink/5'}`}>
              <task.icon className={`h-5 w-5 ${task.urgent ? 'text-red-600' : 'text-mise-ink/60'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-mise-ink text-sm">{task.label}</p>
              <p className={`text-xs mt-0.5 ${task.urgent ? 'text-red-600 font-medium' : 'text-mise-ink/50'}`}>
                {task.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-mise-ink/20 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
