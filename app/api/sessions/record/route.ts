import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PLAN_LIMITS: Record<string, number> = {
  core: 3,
  plus: 5,
  multi: 999,
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function getGeoForIp(ip: string): Promise<{ city: string; country: string; lat: number; lng: number } | null> {
  const isLocal = !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')
  if (isLocal) return { city: 'Local', country: '', lat: 0, lng: 0 }

  try {
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=city,country,lat,lon,status`, {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    if (data.status !== 'success') return null
    return { city: data.city ?? '', country: data.country ?? '', lat: data.lat ?? 0, lng: data.lon ?? 0 }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionKey } = await req.json()
    if (!sessionKey) {
      return NextResponse.json({ error: 'sessionKey required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get restaurant + plan
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single()

    const plan: string = restaurant?.plan ?? 'core'
    const restaurantId: string | null = restaurant?.id ?? null
    const limit = PLAN_LIMITS[plan] ?? 3

    // Get IP
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? ''

    // Geolocation
    const geo = await getGeoForIp(ip)
    const city = geo?.city ?? ''
    const country = geo?.country ?? ''
    const lat = geo?.lat ?? 0
    const lng = geo?.lng ?? 0

    // Device hint
    const ua = req.headers.get('user-agent') ?? ''
    const deviceHint = ua.slice(0, 100)

    const admin = createAdminClient()

    // Count active sessions (last_seen within 30 days), excluding this session_key
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: activeSessions } = await admin
      .from('user_sessions')
      .select('id, session_key')
      .eq('user_id', user.id)
      .gt('last_seen', thirtyDaysAgo)

    const existingSession = activeSessions?.find((s) => s.session_key === sessionKey)
    const activeCount = existingSession
      ? activeSessions!.length
      : (activeSessions?.length ?? 0)

    // If this is a brand-new session and we're already at limit, deny
    if (!existingSession && activeCount >= limit) {
      return NextResponse.json({ allowed: false, limit, activeCount })
    }

    // Upsert the session
    await admin.from('user_sessions').upsert(
      {
        user_id: user.id,
        restaurant_id: restaurantId,
        session_key: sessionKey,
        ip_address: ip,
        city,
        device_hint: deviceHint,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'user_id,session_key' }
    )

    // Check for suspicious login: last login event within 4 hours from a different city > 100 miles away
    let suspicious = false
    if (lat !== 0 && lng !== 0) {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      const { data: recentLogins } = await admin
        .from('login_events')
        .select('city, lat, lng')
        .eq('user_id', user.id)
        .gt('created_at', fourHoursAgo)
        .not('city', 'eq', city)
        .limit(5)

      if (recentLogins && recentLogins.length > 0) {
        for (const prev of recentLogins) {
          if (prev.lat != null && prev.lng != null) {
            const distKm = haversineKm(Number(prev.lat), Number(prev.lng), lat, lng)
            const distMiles = distKm * 0.621371
            if (distMiles > 100) {
              suspicious = true
              break
            }
          }
        }
      }
    }

    // Insert login event
    await admin.from('login_events').insert({
      user_id: user.id,
      restaurant_id: restaurantId,
      ip_address: ip,
      city,
      country,
      lat: lat !== 0 ? lat : null,
      lng: lng !== 0 ? lng : null,
      device_hint: deviceHint,
      suspicious,
    })

    const finalActiveCount = existingSession ? activeCount : activeCount + 1

    return NextResponse.json({ allowed: true, suspicious, city, activeCount: finalActiveCount, limit })
  } catch (err) {
    console.error('[sessions/record]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
