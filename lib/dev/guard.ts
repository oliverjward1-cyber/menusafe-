import { NextResponse } from 'next/server'
import { getDevContext } from '@/lib/dev/context'

/**
 * Call at the top of any write handler (POST/PUT/PATCH/DELETE) in app/api.
 * Returns a 403 NextResponse if the current developer is impersonating
 * another role/restaurant, otherwise returns null and the handler proceeds.
 */
export async function blockIfImpersonating(): Promise<NextResponse | null> {
  const ctx = await getDevContext()
  if (ctx?.isImpersonating) {
    return NextResponse.json(
      { error: 'Read-only while viewing as another role/restaurant. Exit dev view to make changes.' },
      { status: 403 }
    )
  }
  return null
}
