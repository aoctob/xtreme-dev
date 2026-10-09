'use server'

import { createHash } from 'crypto'
import { headers } from 'next/headers'
import type { Payload } from 'payload'
import {
  COMMITTEE_ROLES,
  ENQUIRY_TYPES,
  EXPERIENCE_LEVELS,
  FEET,
  labelFor,
  PREFERRED_POSITIONS,
  SPONSOR_INTERESTS,
  TEAMS,
} from '@/lib/constants'
import { getPayloadClient } from '@/lib/payload'
import {
  FORM_FIELDS,
  HONEYPOT,
  isChecked,
  isMinor,
  normalisePhone,
  PHOTO_MAX_BYTES,
  PHOTO_TYPES,
  validate,
  type Errors,
  type FormKind,
  type Values,
} from '@/lib/validation'

export type FormResult =
  | { status: 'success' }
  | { status: 'invalid'; errors: Errors }
  | { status: 'error'; message: string }

const RATE_LIMIT = 5 // submissions per IP per hour (PRD §D.10)
const HOUR = 3600_000
const DEDUPE_WINDOW = 60_000 // identical submissions within 60 s create one record (US-07 #7)

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

async function clientKey(kind: FormKind): Promise<string> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  // Store only a salted hash, never the raw IP.
  return sha256(`${process.env.PAYLOAD_SECRET}:${kind}:${ip}`)
}

async function isRateLimited(payload: Payload, key: string): Promise<boolean> {
  const since = new Date(Date.now() - HOUR).toISOString()
  const { totalDocs } = await payload.count({
    collection: 'rate-limits',
    where: { and: [{ key: { equals: key } }, { createdAt: { greater_than: since } }] },
    overrideAccess: true,
  })
  return totalDocs >= RATE_LIMIT
}

async function recordHit(payload: Payload, key: string) {
  await payload.create({ collection: 'rate-limits', data: { key }, overrideAccess: true })
  // Housekeeping: drop counters older than a day so the table stays tiny.
  await payload
    .delete({
      collection: 'rate-limits',
      where: { createdAt: { less_than: new Date(Date.now() - 24 * HOUR).toISOString() } },
      overrideAccess: true,
    })
    .catch(() => undefined)
}

type InboxCollection = 'applications' | 'enquiries' | 'registrations'

async function isDuplicate(payload: Payload, collection: InboxCollection, fingerprint: string) {
  const { totalDocs } = await payload.count({
    collection,
    where: {
      and: [
        { fingerprint: { equals: fingerprint } },
        { createdAt: { greater_than: new Date(Date.now() - DEDUPE_WINDOW).toISOString() } },
      ],
    },
    overrideAccess: true,
  })
  return totalDocs > 0
}

async function notifyClub(payload: Payload, subject: string, lines: [string, string | undefined | null][]) {
  try {
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const to = settings.notificationEmail || process.env.CLUB_INBOX_EMAIL
    if (!to) {
      payload.logger.warn('No notification email set (Site settings → Contact). Skipping email.')
      return
    }
    const admin = `${(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')}/admin`
    const text = [
      ...lines.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
      '',
      `Open the inbox: ${admin}`,
    ].join('\n')
    await payload.sendEmail({ to, subject, text })
  } catch (err) {
    // The record is saved; a failed email must not fail the submission.
    payload.logger.error(`Notification email failed: ${(err as Error).message}`)
  }
}

function readValues(kind: FormKind, formData: FormData): Values {
  const values: Values = {}
  for (const name of FORM_FIELDS[kind]) {
    const v = formData.get(name)
    values[name] = typeof v === 'string' ? v.trim().slice(0, 2000) : ''
  }
  return values
}

const phoneOrRaw = (v: string) => (v ? (normalisePhone(v) ?? v) : undefined)

/** Optional registration photo: images only, under the Vercel body limit. */
function readPhoto(formData: FormData): File | null | 'invalid' {
  const file = formData.get('photo')
  if (!file || typeof file === 'string' || file.size === 0) return null
  if (!PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX_BYTES) return 'invalid'
  return file
}

/**
 * Handles the Join, Register, Sponsor and Contact forms (PRD §J.5):
 * honeypot → server-side validation → de-duplication → rate limit → insert → email.
 */
export async function submitForm(kind: FormKind, formData: FormData): Promise<FormResult> {
  if (!['join', 'sponsor', 'contact', 'register'].includes(kind)) return { status: 'error', message: 'Unknown form.' }

  // Bots fill every field; pretend it worked and store nothing.
  if (String(formData.get(HONEYPOT) ?? '').length > 0) return { status: 'success' }

  const values = readValues(kind, formData)
  const errors = validate(kind, values)
  const photo = kind === 'register' ? readPhoto(formData) : null
  if (photo === 'invalid') errors.photo = 'Use a JPG, PNG or WebP image under 4 MB'
  if (Object.keys(errors).length > 0) return { status: 'invalid', errors }

  try {
    const payload = await getPayloadClient()
    const collection: InboxCollection =
      kind === 'join' ? 'applications' : kind === 'register' ? 'registrations' : 'enquiries'
    const fingerprint = sha256(`${kind}:${JSON.stringify(values)}`)

    if (await isDuplicate(payload, collection, fingerprint)) return { status: 'success' }

    const key = await clientKey(kind)
    if (await isRateLimited(payload, key)) {
      return {
        status: 'error',
        message: 'Too many submissions from your connection. Please try again in an hour.',
      }
    }
    await recordHit(payload, key)

    if (kind === 'join') {
      const minor = isMinor(values.dateOfBirth)
      await payload.create({
        collection: 'applications',
        overrideAccess: true,
        data: {
          status: 'new',
          fullName: values.fullName,
          dateOfBirth: new Date(values.dateOfBirth).toISOString(),
          phone: normalisePhone(values.phone) ?? values.phone,
          email: values.email || undefined,
          preferredPosition: values.preferredPosition as 'gk',
          experienceLevel: values.experienceLevel as 'beginner',
          previousClub: values.previousClub || undefined,
          preferredTrialDate: values.preferredTrialDate || undefined,
          message: values.message || undefined,
          guardian: minor
            ? { name: values.guardianName, phone: normalisePhone(values.guardianPhone) ?? values.guardianPhone }
            : undefined,
          isMinor: minor,
          guardianConsent: minor ? isChecked(values.guardianConsent) : undefined,
          consent: true,
          fingerprint,
        },
      })
      await notifyClub(payload, `New trial application: ${values.fullName}`, [
        ['Name', values.fullName],
        ['Date of birth', values.dateOfBirth],
        ['Under 18', minor ? 'Yes' : 'No'],
        ['Phone', values.phone],
        ['Email', values.email],
        ['Position', labelFor(PREFERRED_POSITIONS, values.preferredPosition)],
        ['Experience', labelFor(EXPERIENCE_LEVELS, values.experienceLevel)],
        ['Previous club', values.previousClub],
        ['Preferred trial date', values.preferredTrialDate],
        ['Guardian', minor ? `${values.guardianName} (${values.guardianPhone})` : null],
        ['Message', values.message],
      ])
    } else if (kind === 'register') {
      const minor = isMinor(values.dateOfBirth)
      const committee = values.mode === 'committee'
      let photoId: number | undefined
      if (photo && photo !== 'invalid') {
        const doc = await payload.create({
          collection: 'registration-photos',
          overrideAccess: true,
          data: { alt: `Registration photo: ${values.fullName}` },
          file: {
            data: Buffer.from(await photo.arrayBuffer()),
            mimetype: photo.type,
            name: photo.name.replace(/[^\w.-]+/g, '-').slice(-80) || 'photo.jpg',
            size: photo.size,
          },
        })
        photoId = doc.id
      }
      await payload.create({
        collection: 'registrations',
        overrideAccess: true,
        data: {
          status: 'new',
          mode: committee ? 'committee' : 'player',
          registeredBy: committee
            ? { name: values.regName, role: (values.regRole || 'other') as 'other', phone: phoneOrRaw(values.regPhone) }
            : undefined,
          fullName: values.fullName,
          dateOfBirth: new Date(values.dateOfBirth).toISOString(),
          phone: phoneOrRaw(values.phone),
          email: values.email || undefined,
          address: values.address,
          photo: photoId,
          guardian: minor ? { name: values.guardianName, phone: phoneOrRaw(values.guardianPhone) } : undefined,
          team: (values.team || 'unassigned') as 'unassigned',
          foot: (values.foot || 'right') as 'right',
          position: (values.position || 'not-sure') as 'not-sure',
          secondPosition: values.secondPosition && values.secondPosition !== 'none' ? (values.secondPosition as 'gk') : undefined,
          shirtNumber: values.shirtNumber ? Number(values.shirtNumber) : undefined,
          previousClub: values.previousClub || undefined,
          emergency: {
            name: values.emergencyName,
            relationship: values.emergencyRelationship,
            phone: phoneOrRaw(values.emergencyPhone),
          },
          medical: values.medical || undefined,
          isMinor: minor,
          guardianConsent: minor ? isChecked(values.guardianConsent) : undefined,
          committeeConfirmed: committee ? isChecked(values.confirm) : undefined,
          consent: true,
          fingerprint,
        },
      })
      // The email leaves out address and medical notes; staff read those in the admin.
      await notifyClub(payload, `New player registration: ${values.fullName}`, [
        ['Player', values.fullName],
        ['Date of birth', values.dateOfBirth],
        ['Under 18', minor ? 'Yes' : 'No'],
        ['Team', labelFor(TEAMS, values.team)],
        ['Position', labelFor(PREFERRED_POSITIONS, values.position)],
        ['Preferred foot', labelFor(FEET, values.foot)],
        ['Registered by', committee ? `${values.regName} (${labelFor(COMMITTEE_ROLES, values.regRole)})` : 'The player'],
        ['Photo', photoId ? 'Attached' : null],
      ])
    } else {
      const type = kind === 'sponsor' ? 'sponsor' : values.type || 'general'
      await payload.create({
        collection: 'enquiries',
        overrideAccess: true,
        data: {
          status: 'new',
          type: type as 'general',
          name: values.name,
          businessName: values.businessName || undefined,
          email: values.email || undefined,
          phone: values.phone ? (normalisePhone(values.phone) ?? values.phone) : undefined,
          interest: kind === 'sponsor' ? (values.interest as 'shirt') : undefined,
          message: values.message || undefined,
          fingerprint,
        },
      })
      await notifyClub(payload, `New ${labelFor(ENQUIRY_TYPES, type).toLowerCase()} enquiry: ${values.name}`, [
        ['Type', labelFor(ENQUIRY_TYPES, type)],
        ['Name', values.name],
        ['Business', values.businessName],
        ['Interest', kind === 'sponsor' ? labelFor(SPONSOR_INTERESTS, values.interest) : null],
        ['Email', values.email],
        ['Phone', values.phone],
        ['Message', values.message],
      ])
    }
    return { status: 'success' }
  } catch (err) {
    console.error(`[forms] ${kind} submission failed:`, (err as Error).message)
    return { status: 'error', message: 'The server could not save your message.' }
  }
}
