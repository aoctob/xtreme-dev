/**
 * Form rules shared by the browser and the Server Actions (PRD §D.10, §D.11, §D.13, §J.5).
 * Pure functions only, so the same code runs on both sides.
 */
import {
  ENQUIRY_TYPES,
  EXPERIENCE_LEVELS,
  PREFERRED_POSITIONS,
  SPONSOR_INTERESTS,
} from './constants'
import { ageFrom } from './format'

export type FormKind = 'join' | 'sponsor' | 'contact'
export type Values = Record<string, string>
export type Errors = Record<string, string>

export const LIMITS = {
  name: 100,
  short: 120,
  email: 254,
  joinMessage: 500,
  sponsorMessage: 1000,
  contactMessage: 1000,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** 10-digit Indian mobile number with optional +91 or 0 prefix (US-07 #3). */
export function normalisePhone(raw: string): string | null {
  const compact = raw.replace(/[\s\-().]/g, '')
  const m = compact.match(/^(?:\+91|0091|91(?=\d{10}$)|0)?([6-9]\d{9})$/)
  return m ? `+91${m[1]}` : null
}

export const isMinor = (dateOfBirth: string): boolean => {
  if (!dateOfBirth) return false
  const d = new Date(dateOfBirth)
  return !Number.isNaN(d.getTime()) && ageFrom(d) < 18
}

const oneOf = (list: readonly { value: string }[], v: string) => list.some((o) => o.value === v)

function required(errors: Errors, values: Values, field: string, message: string) {
  if (!values[field]?.trim()) errors[field] = message
}

function maxLen(errors: Errors, values: Values, field: string, max: number, label: string) {
  if (!errors[field] && (values[field] ?? '').length > max)
    errors[field] = `${label} must be ${max} characters or fewer.`
}

function phone(errors: Errors, values: Values, field: string, isRequired: boolean, label = 'phone number') {
  const v = values[field]?.trim() ?? ''
  if (!v) {
    if (isRequired) errors[field] = `Enter your ${label}.`
    return
  }
  if (!normalisePhone(v))
    errors[field] = 'Enter a 10-digit Indian mobile number, for example 98765 43210 or +91 98765 43210.'
}

function email(errors: Errors, values: Values, field: string, isRequired: boolean) {
  const v = values[field]?.trim() ?? ''
  if (!v) {
    if (isRequired) errors[field] = 'Enter your email address.'
    return
  }
  if (!EMAIL_RE.test(v) || v.length > LIMITS.email)
    errors[field] = 'Enter an email address like name@example.com.'
}

function validateJoin(v: Values): Errors {
  const e: Errors = {}
  required(e, v, 'fullName', 'Enter your full name.')
  maxLen(e, v, 'fullName', LIMITS.name, 'Name')

  if (!v.dateOfBirth) e.dateOfBirth = 'Enter your date of birth.'
  else {
    const d = new Date(v.dateOfBirth)
    const age = Number.isNaN(d.getTime()) ? -1 : ageFrom(d)
    if (age < 4 || age > 80) e.dateOfBirth = 'Enter a valid date of birth.'
  }

  phone(e, v, 'phone', true)
  email(e, v, 'email', false)
  if (v.preferredPosition && !oneOf(PREFERRED_POSITIONS, v.preferredPosition))
    e.preferredPosition = 'Choose a position from the list.'
  if (!v.preferredPosition) e.preferredPosition = 'Choose a preferred position, or "Not sure".'
  if (!v.experienceLevel) e.experienceLevel = 'Choose your experience level.'
  else if (!oneOf(EXPERIENCE_LEVELS, v.experienceLevel))
    e.experienceLevel = 'Choose an experience level from the list.'
  maxLen(e, v, 'previousClub', LIMITS.short, 'Previous club')
  maxLen(e, v, 'preferredTrialDate', LIMITS.short, 'Trial date')
  maxLen(e, v, 'message', LIMITS.joinMessage, 'Message')

  if (isMinor(v.dateOfBirth)) {
    required(e, v, 'guardianName', "Enter the parent or guardian's name.")
    maxLen(e, v, 'guardianName', LIMITS.name, 'Name')
    phone(e, v, 'guardianPhone', true, "parent or guardian's phone number")
  }
  if (v.consent !== 'on' && v.consent !== 'true')
    e.consent = isMinor(v.dateOfBirth)
      ? 'A parent or guardian must agree to the Privacy Policy to continue.'
      : 'You must agree to the Privacy Policy to continue.'
  return e
}

function validateSponsor(v: Values): Errors {
  const e: Errors = {}
  required(e, v, 'name', 'Enter your name.')
  maxLen(e, v, 'name', LIMITS.name, 'Name')
  required(e, v, 'businessName', 'Enter your business name.')
  maxLen(e, v, 'businessName', LIMITS.short, 'Business name')
  phone(e, v, 'phone', true)
  email(e, v, 'email', true)
  if (!v.interest) e.interest = 'Choose what you are interested in.'
  else if (!oneOf(SPONSOR_INTERESTS, v.interest)) e.interest = 'Choose an option from the list.'
  maxLen(e, v, 'message', LIMITS.sponsorMessage, 'Message')
  return e
}

function validateContact(v: Values): Errors {
  const e: Errors = {}
  if (!v.type) e.type = 'Choose an enquiry type.'
  else if (!oneOf(ENQUIRY_TYPES, v.type)) e.type = 'Choose an enquiry type from the list.'
  required(e, v, 'name', 'Enter your name.')
  maxLen(e, v, 'name', LIMITS.name, 'Name')
  email(e, v, 'email', false)
  phone(e, v, 'phone', false)
  if (!v.email?.trim() && !v.phone?.trim()) {
    e.email = 'Enter an email address or a phone number so we can reply.'
  }
  required(e, v, 'message', 'Enter your message.')
  maxLen(e, v, 'message', LIMITS.contactMessage, 'Message')
  return e
}

export function validate(kind: FormKind, values: Values): Errors {
  switch (kind) {
    case 'join':
      return validateJoin(values)
    case 'sponsor':
      return validateSponsor(values)
    case 'contact':
      return validateContact(values)
  }
}

/** Every field name a form may submit, so the server ignores anything else. */
export const FORM_FIELDS: Record<FormKind, string[]> = {
  join: [
    'fullName',
    'dateOfBirth',
    'phone',
    'email',
    'preferredPosition',
    'experienceLevel',
    'previousClub',
    'preferredTrialDate',
    'message',
    'guardianName',
    'guardianPhone',
    'consent',
  ],
  sponsor: ['name', 'businessName', 'phone', 'email', 'interest', 'message'],
  contact: ['type', 'name', 'email', 'phone', 'message'],
}

/** Name of the hidden honeypot field. Real people never fill it in. */
export const HONEYPOT = 'company_website'
