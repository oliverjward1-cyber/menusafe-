'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { MiseLogo } from '@/components/MiseLogo'
import { usePathname } from 'next/navigation'

export function MobileNavWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 text-white sticky top-0 z-30 border-b border-gray-700">
        <MiseLogo />
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-72 bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <MiseLogo />
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Nav content injected here — hides the built-in header */}
        <div className="[&>aside>div:first-child]:hidden">
          {children}
        </div>
      </div>

      {/* Desktop sidebar — unchanged */}
      <div className="hidden md:block">
        {children}
      </div>
    </>
  )
}
