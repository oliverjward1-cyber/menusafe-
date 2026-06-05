import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const secret = () => process.env.STAFF_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'mise-staff-fallback-secret'

const COOKIE = 'mise_staff'
const TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

export function signStaffToken(restaurantId: string): string {
  const ts = Date.now().toString()
  const payload = `${restaurantId}:${ts}`
  const sig = createHmac('sha256', secret()).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function verifyStaffToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const lastColon = decoded.lastIndexOf(':')
    const secondLastColon = decoded.lastIndexOf(':', lastColon - 1)
    if (secondLastColon === -1) return null
    const restaurantId = decoded.slice(0, secondLastColon)
    const ts = decoded.slice(secondLastColon + 1, lastColon)
    const sig = decoded.slice(lastColon + 1)
    if (Date.now() - parseInt(ts, 10) > TTL_MS) return null
    const expected = createHmac('sha256', secret()).update(`${restaurantId}:${ts}`).digest('hex')
    const sigBuf = Buffer.from(sig, 'hex')
    const expBuf = Buffer.from(expected, 'hex')
    if (sigBuf.length !== expBuf.length) return null
    if (!timingSafeEqual(sigBuf, expBuf)) return null
    return restaurantId
  } catch {
    return null
  }
}

export function getStaffRestaurantId(): string | null {
  const token = cookies().get(COOKIE)?.value
  if (!token) return null
  return verifyStaffToken(token)
}

export function staffCookieOptions(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 12 * 60 * 60,
  }
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
