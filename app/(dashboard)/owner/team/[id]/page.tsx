import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import StaffDetailForm from './StaffDetailForm'
import RevokeAccessButton from './RevokeAccessButton'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  head_chef: 'Head Chef',
  chef: 'Kitchen Staff',
  foh: 'Front of House',
}

export default async function StaffDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viewerProfile } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single()

  if (viewerProfile?.role !== 'owner') redirect('/owner')

  const rid = viewerProfile.restaurant_id
  if (!rid) redirect('/onboarding')

  const { data: member } = await supabase
    .from('profiles')
    .select('id, full_name, role, email, phone, next_of_kin_name, next_of_kin_phone, notes, created_at')
    .eq('id', params.id)
    .eq('restaurant_id', rid)
    .single()

  if (!member) notFound()

  // Can't revoke access to yourself
  const isSelf = member.id === user.id

  // Pull quiz attempts for this staff member by name
  const { data: quizAttempts } = await supabase
    .from('staff_quiz_attempts')
    .select('id, score, total_questions, passed, assessment_type, created_at')
    .eq('restaurant_id', rid)
    .eq('staff_name', member.full_name ?? '')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/owner/team" className="text-sm text-gray-500 hover:text-mise-ink flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Team
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-mise-mid/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-semibold text-mise-mid">
              {(member.full_name ?? '?')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-mise-ink">
              {member.full_name ?? 'Unknown'}
              {isSelf && <span className="ml-2 text-sm font-sans font-normal text-gray-400">(you)</span>}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {ROLE_LABELS[member.role] ?? member.role} · Joined {new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        {!isSelf && (
          <RevokeAccessButton staffId={member.id} staffName={member.full_name ?? 'this person'} />
        )}
      </div>

      <StaffDetailForm profile={{
        id: member.id,
        full_name: member.full_name,
        role: member.role,
        email: member.email ?? null,
        phone: member.phone ?? null,
        next_of_kin_name: member.next_of_kin_name ?? null,
        next_of_kin_phone: member.next_of_kin_phone ?? null,
        notes: member.notes ?? null,
      }} />

      {/* Training history */}
      {quizAttempts && quizAttempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-mise-ink">Training history</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {quizAttempts.map(a => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-mise-ink">{a.assessment_type ?? 'Allergen Quiz'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${a.passed ? 'text-green-600' : 'text-red-500'}`}>
                    {a.score}/{a.total_questions} — {a.passed ? 'Pass' : 'Fail'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
