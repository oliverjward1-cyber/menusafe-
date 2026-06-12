'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export interface WeekDay {
  date: string
  done: number
  total: number
  pct: number | null
  label: string
  isToday: boolean
  isFuture: boolean
}

export function WeekStrip({ days }: { days: WeekDay[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLAnchorElement>(null)

  // Centre today's tile when the strip overflows (mobile)
  useEffect(() => {
    const scroller = scrollerRef.current
    const today = todayRef.current
    if (!scroller || !today) return
    if (scroller.scrollWidth > scroller.clientWidth) {
      scroller.scrollLeft = today.offsetLeft - scroller.clientWidth / 2 + today.clientWidth / 2
    }
  }, [])

  return (
    <div ref={scrollerRef} className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-1">
      {days.map(day => {
        const complete = !day.isFuture && day.total > 0 && day.pct === 100
        const base = 'flex h-[72px] min-w-[68px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border'

        if (day.isFuture) {
          return (
            <div key={day.date} className={`${base} border-dashed border-black/10`}>
              <span className="text-[11px] font-medium text-hospopilot-ink/30">{day.label}</span>
            </div>
          )
        }

        return (
          <Link
            key={day.date}
            ref={day.isToday ? todayRef : undefined}
            href={day.isToday ? '/owner/trail' : `/owner/trail-history/${day.date}`}
            className={`${base} shadow-sm transition-shadow hover:shadow-md active:shadow-sm ${
              complete
                ? 'border-hospopilot-fresh/50 bg-hospopilot-fresh/10'
                : 'border-black/[0.12] bg-white'
            } ${day.isToday ? 'ring-2 ring-hospopilot-mid ring-offset-2 ring-offset-white' : ''}`}
          >
            <span className={`text-[11px] font-semibold ${day.isToday ? 'text-hospopilot-mid' : 'text-hospopilot-ink/40'}`}>
              {day.label}
            </span>
            {complete ? (
              <CheckCircle2 className="h-4 w-4 text-hospopilot-mid" />
            ) : (
              <span className="text-xs font-bold text-hospopilot-ink/70">
                {day.total > 0 ? `${day.pct}%` : '—'}
              </span>
            )}
            {day.total > 0 && (
              <span className="text-[10px] text-hospopilot-ink/40">{day.done}/{day.total}</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
