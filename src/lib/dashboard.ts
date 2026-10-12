import 'server-only'
import { redirect } from 'next/navigation'
import { APIError, ValidationError } from 'payload'
import { canUseDashboard } from '@/access/roles'
import type { User } from '@/payload-types'
import { requireUser } from './auth'
import { getPayloadClient } from './payload'

/**
 * Every dashboard read and write goes through the Local API *as the signed-in user*
 * (`overrideAccess: false`), so Payload's access rules decide what comes back and what
 * may change. Hidden buttons are convenience only; the server is the boundary (spec §9).
 */
export async function dashContext(path = '/dashboard') {
  const user = await requireUser(canUseDashboard, path)
  const payload = await getPayloadClient()
  return { user, payload, as: { user, overrideAccess: false } as const }
}

export function errorMessage(err: unknown): string {
  if (err instanceof ValidationError) {
    const first = err.data?.errors?.[0]
    return first ? `${first.label ?? first.path}: ${first.message}` : err.message
  }
  if (err instanceof APIError || err instanceof Error) {
    if (/forbidden|not allowed to perform/i.test(err.message)) return 'You do not have permission to do that.'
    return err.message
  }
  return 'Something went wrong.'
}

/** Only redirect back inside the dashboard or account area. */
export const safeBack = (v: FormDataEntryValue | null, fallback: string) => {
  const s = typeof v === 'string' ? v : ''
  return /^\/(dashboard|account)(\/|\?|$)/.test(s) ? s : fallback
}

/** Run a mutation and come back to `back` with `?ok=` or `?error=` for the page to show. */
export async function runAndReturn(back: string, fn: () => Promise<string | void>): Promise<never> {
  let ok = true
  let msg = 'Saved.'
  try {
    msg = (await fn()) || msg
  } catch (err) {
    ok = false
    msg = errorMessage(err)
  }
  const url = new URL(back, 'http://x')
  url.searchParams.delete('ok')
  url.searchParams.delete('error')
  url.searchParams.set(ok ? 'ok' : 'error', msg)
  redirect(url.pathname + url.search)
}

export const str = (fd: FormData, k: string, max = 4000) => {
  const v = fd.get(k)
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export const num = (fd: FormData, k: string): number | undefined => {
  const v = str(fd, k)
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export type DashUser = User
