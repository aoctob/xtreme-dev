import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { User } from '@/payload-types'
import { getPayloadClient } from './payload'

/** The signed-in user for this request (same cookie as /admin), or null. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: await headers() })
    if (!user || user.collection !== 'users' || user.accountStatus === 'disabled') return null
    return user as User
  } catch {
    return null
  }
})

/** For pages: signed-in user who passes `check`, else redirect to login or home. */
export async function requireUser(check: (u: User) => boolean = () => true, next = '/account'): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  if (!check(user)) redirect('/account?denied=1')
  return user
}
