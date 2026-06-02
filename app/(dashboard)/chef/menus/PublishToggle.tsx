'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Globe, GlobeLock, Loader2 } from 'lucide-react'

export function PublishToggle({ menuId, isPublished }: { menuId: string; isPublished: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    await supabase.from('menus').update({ is_published: !isPublished }).eq('id', menuId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 ${
        isPublished
          ? 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100'
          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
      }`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isPublished ? (
        <Globe className="h-3.5 w-3.5" />
      ) : (
        <GlobeLock className="h-3.5 w-3.5" />
      )}
      {isPublished ? 'Published' : 'Publish'}
    </button>
  )
}
