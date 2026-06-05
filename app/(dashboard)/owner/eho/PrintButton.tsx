'use client'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white border border-white/20 px-3 py-1.5 rounded-lg transition-colors"
    >
      <Printer className="h-3.5 w-3.5" /> Print / Save PDF
    </button>
  )
}
