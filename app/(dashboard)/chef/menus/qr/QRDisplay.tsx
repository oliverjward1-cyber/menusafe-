'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Download, Printer, Copy, CheckCircle2 } from 'lucide-react'
import { useState, useRef } from 'react'

interface Props {
  menuUrl: string | null
  restaurantName: string
}

export function QRDisplay({ menuUrl, restaurantName }: Props) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  if (!menuUrl) {
    return (
      <div className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center text-hospopilot-ink/50">
        <p>No menu URL found. Complete onboarding first.</p>
      </div>
    )
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(menuUrl!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  function handleDownload() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const canvas = document.createElement('canvas')
    const img = new Image()
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    img.onload = () => {
      canvas.width = 600
      canvas.height = 600
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 600, 600)
      ctx.drawImage(img, 0, 0, 600, 600)
      URL.revokeObjectURL(url)
      const link = document.createElement('a')
      link.download = `${restaurantName.replace(/\s+/g, '-').toLowerCase()}-menu-qr.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = url
  }

  return (
    <div className="space-y-4">
      {/* Print-friendly QR card */}
      <div id="qr-print-area" className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-8 text-center space-y-4">
        <div ref={qrRef} className="inline-block p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <QRCodeSVG
            value={menuUrl}
            size={220}
            level="H"
            includeMargin={false}
          />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{restaurantName}</p>
          <p className="text-sm text-hospopilot-ink/50 mt-1">Scan to view our menu &amp; allergen information</p>
          <p className="text-xs text-gray-400 font-mono mt-2 break-all">{menuUrl}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={copyUrl}
          className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          {copied ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <Copy className="h-6 w-6 text-hospopilot-ink/40" />}
          {copied ? 'Copied!' : 'Copy URL'}
        </button>
        <button
          onClick={handlePrint}
          className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <Printer className="h-6 w-6 text-hospopilot-ink/40" />
          Print
        </button>
        <button
          onClick={handleDownload}
          className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <Download className="h-6 w-6 text-hospopilot-ink/40" />
          Download PNG
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Tip:</strong> Print and laminate this QR code for each table. Customers scan it to see your live menu with full allergen information. Only published menus are visible to customers.
        </p>
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #qr-print-area { display: block !important; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 2px solid #e5e7eb; border-radius: 16px; padding: 40px; text-align: center; }
        }
      `}</style>
    </div>
  )
}
