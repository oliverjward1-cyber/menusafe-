'use client'

import { Printer } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function PrintButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.print()}
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      Print / Save PDF
    </Button>
  )
}
