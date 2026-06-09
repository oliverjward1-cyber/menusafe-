'use client'

import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'

interface Props {
  onFileSelected: (file: File, preview: string) => void
  onClear: () => void
  preview: string | null
  label?: string
}

export default function PhotoUpload({ onFileSelected, onClear, preview, label = 'Add photo evidence' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      onFileSelected(file, e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">{label}</label>
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="evidence" className="h-32 w-48 object-cover rounded-xl border border-gray-200" />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files[0]
            if (file?.type.startsWith('image/')) handleFile(file)
          }}
          className={`flex flex-col items-center justify-center gap-2 h-24 w-48 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            dragging ? 'border-mise-mid bg-mise-mid/5' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
          }`}
        >
          <Camera className="h-5 w-5 text-gray-400" />
          <span className="text-xs text-gray-400 text-center px-2">Tap or drag to upload</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
