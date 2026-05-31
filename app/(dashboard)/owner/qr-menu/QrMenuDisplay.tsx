'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, ExternalLink, Printer } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function QrMenuDisplay({
  restaurantName,
  restaurantSlug,
}: {
  restaurantName: string
  restaurantSlug: string
}) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const menuPath = `/menu/${restaurantSlug}`
  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${menuPath}` : menuPath

  useEffect(() => {
    QRCode.toDataURL(
      typeof window !== 'undefined' ? `${window.location.origin}${menuPath}` : menuPath,
      { width: 300, margin: 2, color: { dark: '#111827', light: '#ffffff' } }
    ).then(setQrDataUrl)
  }, [menuPath])

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-sm">
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm font-medium text-gray-700 mb-4">{restaurantName}</p>
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="Menu QR code"
            className="mx-auto w-48 h-48 border border-gray-200 rounded-lg mb-4"
          />
        )}
        <p className="text-xs text-gray-500 mb-6">Scan to view menu & allergen information</p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={fullUrl}
              className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-600 truncate"
            />
            <button
              onClick={copyLink}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied && <p className="text-xs text-green-600">Copied!</p>}

          <div className="flex gap-2">
            <a
              href={menuPath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Preview
            </a>
            <Button variant="outline" onClick={() => window.print()} className="flex-1 gap-2">
              <Printer className="h-4 w-4" />
              Print QR
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
