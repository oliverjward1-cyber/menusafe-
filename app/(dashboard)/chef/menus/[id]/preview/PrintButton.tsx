'use client'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="shrink-0 text-xs font-medium text-amber-700 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
    >
      <Printer className="h-3 w-3" /> Print / Save PDF
    </button>
  )
}
