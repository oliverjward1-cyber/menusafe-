import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'

export default async function TrailSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/trail" className="text-mise-ink/40 hover:text-mise-ink transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-mise-ink">Trail Settings</h1>
          <p className="text-mise-ink/50 text-sm">Manage your daily task templates</p>
        </div>
      </div>
      <div className="text-center py-16 text-mise-ink/40">
        <Construction className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Coming soon — task template builder</p>
      </div>
    </div>
  )
}
