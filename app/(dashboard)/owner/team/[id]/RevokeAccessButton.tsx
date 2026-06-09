'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function RevokeAccessButton({ staffId, staffName }: { staffId: string; staffName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRevoke() {
    if (!confirm(`Remove ${staffName} from this restaurant? They will lose all access immediately.`)) return
    setLoading(true)
    const res = await fetch('/api/owner/revoke-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId }),
    })
    setLoading(false)
    if (res.ok) router.push('/owner/team')
    else {
      const { error } = await res.json()
      alert(error ?? 'Failed to revoke access')
    }
  }

  return (
    <Button variant="danger" size="sm" onClick={handleRevoke} loading={loading}>
      Revoke access
    </Button>
  )
}
