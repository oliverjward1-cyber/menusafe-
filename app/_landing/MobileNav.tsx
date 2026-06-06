'use client'

import { useState } from 'react'
import { X, Menu } from 'lucide-react'

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="h-6 w-6 text-[#1C3A2E]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-[#F5F0E8] flex flex-col px-6 pt-6 pb-8">
          <div className="flex items-center justify-between mb-10">
            <MiseLogo />
            <button onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="h-6 w-6 text-[#1C3A2E]" />
            </button>
          </div>
          <nav className="flex-1 space-y-0 divide-y divide-gray-200">
            {['Why mise', 'Features', 'Pricing', 'About Us'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                onClick={() => setOpen(false)}
                className="block py-5 text-lg text-[#1C3A2E] font-medium"
              >
                {item}
              </a>
            ))}
          </nav>
          <a
            href="#waitlist"
            onClick={() => setOpen(false)}
            className="block bg-[#C8971A] hover:bg-[#b5851a] text-white font-semibold py-4 rounded-full text-center text-sm transition-colors"
          >
            Join the waitlist
          </a>
        </div>
      )}
    </>
  )
}

function MiseLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid grid-cols-2 gap-0.5 w-7 h-7">
        <div className="rounded-sm bg-[#1C3A2E]" />
        <div className="rounded-sm bg-[#1C3A2E]" />
        <div className="rounded-sm bg-[#1C3A2E]" />
        <div className="rounded-sm bg-[#C8971A]" />
      </div>
      <span className="text-[#1C3A2E] font-medium tracking-wide text-lg">mise</span>
    </div>
  )
}
