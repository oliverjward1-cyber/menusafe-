'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle } from 'lucide-react'

export default function ApproveRejectButtons({ recipeId }: { recipeId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function update(status: 'approved' | 'rejected') {
    setLoading(status === 'approved' ? 'approve' : 'reject')
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('recipes')
      .update({
        status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => update('approved')}
        disabled={!!loading}
        title="Approve"
        className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
      >
        <CheckCircle className="h-5 w-5" />
      </button>
      <button
        onClick={() => update('rejected')}
        disabled={!!loading}
        title="Reject"
        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
      >
        <XCircle className="h-5 w-5" />
      </button>
    </div>
  )
}
