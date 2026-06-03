'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { MiseLogo } from '@/components/MiseLogo'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface Props {
  nav: React.ReactNode
  children: React.ReactNode
}

export function MobileNavWrapper({ nav, children }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Mobile top bar — fixed so it always sits above content */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-gray-900 text-white border-b border-gray-700">
        <Link href="/chef"><MiseLogo /></Link>
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Spacer so content doesn't hide under fixed bar on mobile */}
      <div className="md:hidden h-[52px] shrink-0" />

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-72 bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <Link href="/chef"><MiseLogo /></Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Strip the aside header since we have our own above */}
        <div className="[&>aside>div:first-child]:hidden overflow-y-auto h-[calc(100%-52px)]">
          {nav}
        </div>
      </div>

      {/* Page body — desktop: sidebar + main side by side */}
      <div className="flex flex-row flex-1">
        <div className="hidden md:block">{nav}</div>
        <main className="flex-1 min-w-0">
          <div className="p-4 md:p-6 max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </>
  )
}
