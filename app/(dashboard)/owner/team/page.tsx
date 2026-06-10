import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { InviteChef } from '../InviteChef'
import { ResendInviteButton } from './ResendInviteButton'
import { ChevronRight } from 'lucide-react'

function RoleBadge({ role }: { role: string | null }) {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        Owner
      </span>
    )
  }
  const labels: Record<string, string> = {
    manager: 'Manager',
    head_chef: 'Head Chef',
    chef: 'Kitchen Staff',
    foh: 'Front of House',
  }
  if (role && labels[role]) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        {labels[role]}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      {role ?? 'Unknown'}
    </span>
  )
}

export default async function TeamPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  const rid = profile?.restaurant_id
  if (!rid) redirect('/onboarding')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', rid)
    .single()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('restaurant_id', rid)
    .order('created_at')

  const { data: pendingInvites } = await supabase
    .from('invites')
    .select('id, email, role, created_at, expires_at')
    .eq('restaurant_id', rid)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Team</h1>
        <p className="text-sm text-hospopilot-ink/50 mt-0.5">{restaurant?.name}</p>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-hospopilot-ink">Members</h2>
          <p className="text-xs text-hospopilot-ink/40 mt-0.5">{members?.length ?? 0} people with access</p>
        </div>
        <div className="divide-y divide-gray-50">
          {(!members || members.length === 0) ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-hospopilot-ink/40">No team members found</p>
            </div>
          ) : (
            members.map(member => (
              <Link key={member.id} href={`/owner/team/${member.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-hospopilot-mid/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-hospopilot-mid">
                      {(member.full_name ?? '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-hospopilot-ink">
                        {member.full_name ?? 'Unknown'}
                      </p>
                      {member.id === user.id && (
                        <span className="text-xs text-hospopilot-ink/40">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-hospopilot-ink/40">
                      Joined {new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role={member.role} />
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Pending invites */}
      {pendingInvites && pendingInvites.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-hospopilot-ink">Pending invites</h2>
            <p className="text-xs text-hospopilot-ink/40 mt-0.5">{pendingInvites.length} invite{pendingInvites.length !== 1 ? 's' : ''} awaiting acceptance</p>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingInvites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-gray-400">
                      {invite.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hospopilot-ink truncate">{invite.email}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs text-hospopilot-ink/40">
                        Sent {new Date(invite.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      <span className="text-xs text-amber-600 font-medium">
                        Expires {new Date(invite.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <RoleBadge role={invite.role} />
                  <ResendInviteButton email={invite.email} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite someone */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
        <h2 className="text-sm font-semibold text-hospopilot-ink mb-1">Invite someone</h2>
        <p className="text-xs text-hospopilot-ink/50 mb-4">
          Invite a head chef to manage recipes, ingredients, and kitchen audits.
        </p>
        <InviteChef />
      </div>
    </div>
  )
}
