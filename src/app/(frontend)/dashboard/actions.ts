'use server'

import { randomBytes } from 'crypto'
import type { InviteState } from '@/components/dash/client'
import { canCreateBasicAccounts, canManageMembers, canManagePlayers, idOf } from '@/access/roles'
import { writeAudit } from '@/hooks/audit'
import { REGISTRATION_STATUSES } from '@/lib/constants'
import { dashContext, errorMessage, num, runAndReturn, safeBack, str } from '@/lib/dashboard'
import { siteUrl } from '@/lib/media'
import { createLocalReq } from 'payload'
import type { Announcement, User } from '@/payload-types'

/*
 * Every action re-checks the signed-in user and writes through the Local API with
 * `overrideAccess: false`, so Payload's collection, field and hook rules apply exactly
 * as they do in /admin and on the REST/GraphQL APIs.
 */

const STATUS_VALUES = REGISTRATION_STATUSES.map((s) => s.value) as string[]

/* ------------------------------ Player records ------------------------------ */

export async function setApplicationStatus(fd: FormData) {
  const { payload, as } = await dashContext()
  const id = str(fd, 'id')
  const back = safeBack(fd.get('back'), `/dashboard/players/${id}`)
  await runAndReturn(back, async () => {
    const status = str(fd, 'status')
    if (!STATUS_VALUES.includes(status)) throw new Error('Unknown status.')
    const message = str(fd, 'message', 2000)
    const data: Record<string, unknown> = { applicationStatus: status }
    if (status === 'changes_requested') data.changesRequested = message
    if (status === 'rejected') data.rejectionReason = message
    await payload.update({
      collection: 'registrations',
      id,
      data,
      ...as,
      context: status === 'changes_requested' ? { auditReason: message } : {},
    })
    return `Status set to “${REGISTRATION_STATUSES.find((s) => s.value === status)?.label}”.`
  })
}

export async function saveReviewNotes(fd: FormData) {
  const { payload, as } = await dashContext()
  const id = str(fd, 'id')
  await runAndReturn(`/dashboard/players/${id}`, async () => {
    await payload.update({ collection: 'registrations', id, data: { reviewNotes: str(fd, 'reviewNotes', 4000) }, ...as })
    return 'Review notes saved.'
  })
}

export async function setArchived(fd: FormData) {
  const { payload, as } = await dashContext()
  const id = str(fd, 'id')
  const collection = str(fd, 'collection') === 'members' ? 'members' : 'registrations'
  const archived = str(fd, 'archived') === 'true'
  const back = safeBack(fd.get('back'), '/dashboard')
  await runAndReturn(back, async () => {
    await payload.update({ collection, id, data: { archived }, ...as })
    return archived ? 'Archived.' : 'Restored.'
  })
}

/** Create a draft public profile from an approved record (spec §5 step 4). */
export async function preparePublicProfile(fd: FormData) {
  const { payload, as } = await dashContext()
  const id = str(fd, 'id')
  await runAndReturn(`/dashboard/players/${id}`, async () => {
    const record = await payload.findByID({ collection: 'registrations', id, depth: 0, ...as })
    if (record.applicationStatus !== 'approved') throw new Error('Approve the registration first.')
    const position = str(fd, 'position')
    if (!['goalkeeper', 'defender', 'midfielder', 'forward'].includes(position)) throw new Error('Choose a playing position.')
    await payload.create({
      collection: 'players',
      data: {
        fullName: str(fd, 'fullName', 100) || record.fullName,
        position: position as 'forward',
        shirtNumber: num(fd, 'shirtNumber'),
        squadRole: 'squad',
        isActive: true,
        publicationStatus: 'draft',
        record: record.id,
      },
      ...as,
    })
    return 'Draft public profile created. Add the approved photo and bio, then publish it.'
  })
}

export async function setPublication(fd: FormData) {
  const { payload, as } = await dashContext()
  const id = str(fd, 'id')
  const status = str(fd, 'status')
  const back = safeBack(fd.get('back'), '/dashboard/players')
  await runAndReturn(back, async () => {
    if (!['draft', 'pending_publication', 'published', 'unpublished'].includes(status)) throw new Error('Unknown status.')
    await payload.update({ collection: 'players', id, data: { publicationStatus: status as 'draft' }, ...as })
    return status === 'published' ? 'Profile published on the Squad page.' : 'Publication status updated.'
  })
}

/**
 * Give a player or member a login: link an existing Player/Member account with the same
 * email, or create one, then return a one-time set-password link for the Secretary to
 * pass on (also emailed when email is configured). No password is ever shown.
 */
export async function inviteLogin(kind: 'registrations' | 'members', id: string, _prev: InviteState, _fd: FormData): Promise<InviteState> {
  try {
    const { payload, user, as } = await dashContext()
    if (!canCreateBasicAccounts(user) || !(kind === 'members' ? canManageMembers(user) : canManagePlayers(user)))
      return { status: 'error', message: 'You do not have permission to do that.' }
    const record = await payload.findByID({ collection: kind, id, depth: 0, ...as })
    const email = record.email?.toLowerCase()
    if (!email) return { status: 'error', message: 'Add an email address to the record first.' }
    if (idOf(record.user)) return { status: 'error', message: 'This record already has a login.' }
    const role: 'member' | 'player' = kind === 'members' ? 'member' : 'player'

    const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, ...as })
    let account = existing.docs[0]
    if (account) {
      if (!(account.roles ?? []).includes(role))
        account = await payload.update({ collection: 'users', id: account.id, data: { roles: [...new Set([...(account.roles ?? []), role])] as NonNullable<User['roles']> }, ...as })
    } else {
      account = await payload.create({
        collection: 'users',
        data: { email, name: record.fullName, roles: [role], accountStatus: 'active', password: randomBytes(24).toString('base64url') },
        ...as,
      })
    }
    await payload.update({ collection: kind, id, data: { user: account.id }, ...as })

    const req = await createLocalReq({ user }, payload)
    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email },
      disableEmail: !payload.email || !process.env.RESEND_API_KEY,
      expiration: 7 * 24 * 3600_000,
      req,
    })
    await writeAudit(req, { action: 'invite', collection: kind, recordId: id, recordLabel: record.fullName, summary: `Login ${email}` })
    return {
      status: 'ok',
      message: `Login ready for ${email}. Send them this link to set a password (valid for 7 days):`,
      link: `${siteUrl()}/account/reset?token=${encodeURIComponent(String(token))}`,
    }
  } catch (err) {
    return { status: 'error', message: errorMessage(err) }
  }
}

/* -------------------------------- Appointments ------------------------------- */

export async function endAppointment(fd: FormData) {
  const { payload, as } = await dashContext()
  const collection = str(fd, 'collection') as 'committee-members' | 'conservators' | 'mentors'
  const id = str(fd, 'id')
  await runAndReturn('/dashboard/appointments', async () => {
    if (!['committee-members', 'conservators', 'mentors'].includes(collection)) throw new Error('Unknown appointment.')
    const reason = str(fd, 'reason', 500)
    await payload.update({
      collection,
      id,
      data: { status: 'ended', endDate: new Date().toISOString(), ...(reason ? { handoverNotes: reason } : {}) },
      ...as,
      context: { auditReason: reason || undefined },
    })
    return 'Appointment ended. Its permissions were removed.'
  })
}

/* ------------------------------- Announcements ------------------------------- */

export async function saveAnnouncement(fd: FormData) {
  const { payload, as } = await dashContext()
  const id = str(fd, 'id')
  const intent = str(fd, 'intent')
  await runAndReturn(id ? `/dashboard/announcements/${id}` : '/dashboard/announcements', async () => {
    const expires = str(fd, 'expiresAt')
    const status: Announcement['status'] | undefined =
      intent === 'publish' ? 'published' : intent === 'unpublish' ? 'unpublished' : undefined
    const data = {
      title: str(fd, 'title', 140),
      content: str(fd, 'content', 4000),
      category: (str(fd, 'category') || 'club') as Announcement['category'],
      // The form sends club time (IST) without an offset.
      expiresAt: expires ? new Date(/[zZ+]/.test(expires.slice(16)) ? expires : `${expires.slice(0, 16)}:00+05:30`).toISOString() : null,
      ...(status ? { status } : {}),
    }
    if (id) await payload.update({ collection: 'announcements', id, data, ...as })
    else await payload.create({ collection: 'announcements', data: { ...data, status: status ?? 'draft' }, ...as })
    return intent === 'publish' ? 'Announcement published.' : intent === 'unpublish' ? 'Announcement unpublished.' : 'Draft saved.'
  })
}

export async function deleteAnnouncement(fd: FormData) {
  const { payload, as } = await dashContext()
  await runAndReturn('/dashboard/announcements', async () => {
    await payload.delete({ collection: 'announcements', id: str(fd, 'id'), ...as })
    return 'Announcement deleted.'
  })
}

/* ---------------------------------- Finance ---------------------------------- */

export async function saveFinance(fd: FormData) {
  const { payload, as } = await dashContext()
  const id = str(fd, 'id')
  await runAndReturn(id ? `/dashboard/finance/${id}` : '/dashboard/finance', async () => {
    const data = {
      period: str(fd, 'period', 120),
      periodStart: str(fd, 'periodStart'),
      periodEnd: str(fd, 'periodEnd'),
      openingBalance: num(fd, 'openingBalance') ?? 0,
      totalIncome: num(fd, 'totalIncome') ?? 0,
      totalExpenses: num(fd, 'totalExpenses') ?? 0,
      closingBalance: num(fd, 'closingBalance') ?? 0,
      notes: str(fd, 'notes', 2000),
      supportingReference: str(fd, 'supportingReference', 200),
    }
    if (id) await payload.update({ collection: 'financial-summaries', id, data, ...as })
    else await payload.create({ collection: 'financial-summaries', data, ...as })
    return 'Financial summary saved.'
  })
}
