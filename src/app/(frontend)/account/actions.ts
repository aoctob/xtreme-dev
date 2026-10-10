'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { canUseDashboard, sameId } from '@/access/roles'
import { getCurrentUser } from '@/lib/auth'
import { errorMessage, runAndReturn, str } from '@/lib/dashboard'
import { getPayloadClient } from '@/lib/payload'
import { EMAIL_RE, normalisePhone } from '@/lib/validation'

/** Same cookie Payload's admin uses, so one sign-in covers /account, /dashboard and /admin. */
async function setSession(token: string, exp?: number) {
  const payload = await getPayloadClient()
  ;(await cookies()).set(`${payload.config.cookiePrefix}-token`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(exp ? { expires: new Date(exp * 1000) } : {}),
  })
}

const safeNext = (v: string) => (/^\/(?!\/)/.test(v) && !v.startsWith('/login') ? v : '')

export async function login(fd: FormData) {
  const email = str(fd, 'email', 254).toLowerCase()
  const password = str(fd, 'password', 200)
  const next = safeNext(str(fd, 'next', 300))
  let dest = ''
  try {
    const payload = await getPayloadClient()
    const res = await payload.login({ collection: 'users', data: { email, password } })
    if (!res.token) throw new Error('Sign-in failed.')
    await setSession(res.token, res.exp)
    dest = next || (canUseDashboard(res.user) ? '/dashboard' : '/account')
  } catch (err) {
    const msg = /locked/i.test(errorMessage(err))
      ? 'Too many attempts. This account is locked for 15 minutes.'
      : /disabled/i.test(errorMessage(err))
        ? 'This account is disabled. Contact the club secretary.'
        : 'The email or password is wrong.'
    redirect(`/login?error=${encodeURIComponent(msg)}${next ? `&next=${encodeURIComponent(next)}` : ''}`)
  }
  redirect(dest)
}

export async function logout() {
  const payload = await getPayloadClient()
  ;(await cookies()).delete(`${payload.config.cookiePrefix}-token`)
  redirect('/login?ok=' + encodeURIComponent('You are signed out.'))
}

/** Always answers the same way, so the form can't be used to discover accounts. */
export async function requestReset(fd: FormData) {
  const email = str(fd, 'email', 254).toLowerCase()
  if (EMAIL_RE.test(email)) {
    try {
      const payload = await getPayloadClient()
      await payload.forgotPassword({ collection: 'users', data: { email }, disableEmail: !process.env.RESEND_API_KEY })
    } catch {
      // Unknown email or mail failure: same answer either way.
    }
  }
  redirect('/account/forgot?ok=' + encodeURIComponent('If that email has an account, a link to set a new password is on its way.'))
}

export async function resetPassword(fd: FormData) {
  const token = str(fd, 'token', 200)
  const password = str(fd, 'password', 200)
  const confirm = str(fd, 'confirm', 200)
  const back = (m: string) => `/account/reset?token=${encodeURIComponent(token)}&error=${encodeURIComponent(m)}`
  if (password.length < 10) redirect(back('Use at least 10 characters.'))
  if (password !== confirm) redirect(back('The two passwords do not match.'))
  try {
    const payload = await getPayloadClient()
    const res = await payload.resetPassword({ collection: 'users', data: { token, password }, overrideAccess: true })
    if (res.token) await setSession(res.token)
  } catch {
    redirect(back('This link has expired or was already used. Ask for a new one.'))
  }
  redirect('/account?ok=' + encodeURIComponent('Your password is set.'))
}

/**
 * The player's answer to a correction request (spec §5 step 3). Only their own record,
 * only while it is "Changes requested", and only these fields: no general profile editing.
 */
export async function resubmitRegistration(fd: FormData) {
  const me = await getCurrentUser()
  if (!me) redirect('/login?next=/account')
  const id = str(fd, 'id')
  await runAndReturn('/account', async () => {
    const payload = await getPayloadClient()
    const record = await payload.findByID({ collection: 'registrations', id, depth: 0, user: me, overrideAccess: false })
    if (!sameId(record.user, me)) throw new Error('This is not your registration.')
    if (record.applicationStatus !== 'changes_requested') throw new Error('This registration is not waiting for changes.')
    const response = str(fd, 'playerResponse', 2000)
    if (!response) throw new Error('Tell the club what you changed or answer their question.')
    const phone = str(fd, 'phone', 30)
    const email = str(fd, 'email', 254)
    if (phone && !normalisePhone(phone)) throw new Error('Enter a 10-digit mobile number.')
    if (email && !EMAIL_RE.test(email)) throw new Error('Enter a valid email address.')
    const address = str(fd, 'address', 300)
    await payload.update({
      collection: 'registrations',
      id,
      overrideAccess: true,
      user: me,
      context: { resubmission: true },
      data: {
        applicationStatus: 'pending',
        playerResponse: response,
        ...(phone ? { phone: normalisePhone(phone) ?? phone } : {}),
        ...(email ? { email } : {}),
        ...(address ? { address } : {}),
      },
    })
    return 'Sent. The club will review your registration again.'
  })
}
