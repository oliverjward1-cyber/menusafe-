'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, ExternalLink } from 'lucide-react'

export default function QrCodeDisplay({
  quizUrl,
  restaurantSlug,
}: {
  quizUrl: string
  restaurantSlug: string
}) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${quizUrl}`
      : quizUrl

  useEffect(() => {
    QRCode.toDataURL(
      typeof window !== 'undefined' ? `${window.location.origin}${quizUrl}` : quizUrl,
      { width: 200, margin: 2, color: { dark: '#111827', light: '#ffffff' } }
    ).then(setQrDataUrl)
  }, [quizUrl])

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {qrDataUrl && (
        <img src={qrDataUrl} alt="Staff quiz QR code" className="w-40 h-40 border border-gray-200 rounded-lg" />
      )}
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={fullUrl}
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-600 truncate"
          />
          <button
            onClick={copyLink}
            title="Copy link"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        {copied && <p className="text-xs text-green-600 text-center">Copied!</p>}
        <a
          href={quizUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open quiz
        </a>
      </div>
    </div>
  )
}
