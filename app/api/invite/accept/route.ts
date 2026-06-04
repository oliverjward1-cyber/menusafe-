import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { token, password, fullName } = await request.json()

    if (!token || !password || !fullName) {
      return NextResponse.json({ error: 'token, password, and fullName are required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: invite, error: inviteError } = await adminClient
      .from('invites')
      .select('*, restaurants(name)')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 })
    }

    const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
    })

    if (createUserError || !authData.user) {
      console.error('Create user error:', createUserError)
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    const newUser = authData.user

    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: newUser.id,
        restaurant_id: invite.restaurant_id,
        role: invite.role,
        full_name: fullName,
      })

    if (profileError) {
      console.error('Profile insert error:', profileError)
      // Attempt cleanup
      await adminClient.auth.admin.deleteUser(newUser.id)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    const { error: updateError } = await adminClient
      .from('invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    if (updateError) {
      console.error('Invite update error:', updateError)
      // Non-fatal — continue
    }

    return NextResponse.json({ ok: true, email: invite.email })
  } catch (err) {
    console.error('Accept invite route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
