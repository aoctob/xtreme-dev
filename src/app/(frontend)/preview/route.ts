import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'

/**
 * Draft preview for Matches (PRD §J.4). Only signed-in staff can enable it:
 * the Payload session cookie is checked before Draft Mode is turned on.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const path = url.searchParams.get('path') ?? '/'
  if (!/^\/results\/[a-z0-9-]+$/.test(path)) {
    return new Response('Invalid preview path', { status: 400 })
  }
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return new Response('Sign in to the admin to preview drafts.', { status: 401 })

  ;(await draftMode()).enable()
  redirect(path)
}
