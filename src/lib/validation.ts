/**
 * Form rules shared by the browser and the Server Actions (PRD §D.10, §D.11, §D.13, §J.5).
 * Messages follow the design kit (ui_kits/website/kit-forms.jsx, kit-register.jsx).
 * Pure functions only, so the same code runs on both sides.
 */
import {
  COMMITTEE_ROLES,
  ENQUIRY_TYPES,
  EXPERIENCE_LEVELS,
  FEET,
  PREFERRED_POSITIONS,
  SPONSOR_INTERESTS,
  TEAMS,
} from './constants'
import { ageFrom } from './format'

export type FormKind = 'join' | 'sponsor' | 'contact' | 'register'
export type Values = Record<string, string>
export type Errors = Record<string, string>

export const LIMITS = {
  name: 100,
  short: 120,
  email: 254,
  address: 300,
  joinMessage: 500,
  medical: 500,
  sponsorMessage: 1000,
  contactMessage: 1000,
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** 10-digit Indian mobile number with optional +91 or 0 prefix (US-07 #3). */
export function normalisePhone(raw: string): string | null {
  const compact = raw.replace(/[\s\-().]/g, '')
  const m = compact.match(/^(?:\+91|0091|91(?=\d{10}$)|0)?([6-9]\d{9})$/)
  return m ? `+91${m[1]}` : null
}

/** Age in whole years, or null for an empty or impossible date. */
export function ageOf(dateOfBirth: string | undefined): number | null {
  if (!dateOfBirth) return null
  const d = new Date(dateOfBirth)
  return Number.isNaN(d.getTime()) ? null : ageFrom(d)
}

/** Under 18 (and a plausible age), which switches on the guardian section. */
export const isMinor = (dateOfBirth: string | undefined): boolean => {
  const age = ageOf(dateOfBirth)
  return age !== null && age >= 4 && age < 18
}

export const isChecked = (v: string | undefined) => v === 'true' || v === 'on'

const oneOf = (list: readonly { value: string }[], v: string | undefined) => list.some((o) => o.value === v)
const blank = (v: string | undefined) => !v || !v.trim()

function tooLong(e: Errors, v: Values, field: string, max: number, label: string) {
  if (!e[field] && (v[field] ?? '').length > max) e[field] = `${label} must be ${max} characters or fewer`
}

function dob(e: Errors, v: Values, field: string, emptyMsg: string) {
  const age = ageOf(v[field])
  if (blank(v[field])) e[field] = emptyMsg
  else if (age === null || age < 4 || age > 80) e[field] = 'Enter a real date of birth'
}

function validateJoin(v: Values): Errors {
  const e: Errors = {}
  if (blank(v.fullName) || v.fullName.trim().length < 2) e.fullName = 'Enter your full name'
  tooLong(e, v, 'fullName', LIMITS.name, 'Name')
  dob(e, v, 'dateOfBirth', 'Enter your date of birth')
  if (blank(v.phone)) e.phone = 'Enter a mobile number'
  else if (!normalisePhone(v.phone)) e.phone = 'Enter a 10-digit mobile number, with optional +91 or 0'
  if (v.email && !EMAIL_RE.test(v.email)) e.email = 'Enter an email like name@example.com'
  if (isMinor(v.dateOfBirth)) {
    if (blank(v.guardianName)) e.guardianName = 'Enter the parent or guardian’s name'
    if (blank(v.guardianPhone)) e.guardianPhone = 'Enter the parent or guardian’s mobile number'
    else if (!normalisePhone(v.guardianPhone)) e.guardianPhone = 'Enter a 10-digit mobile number'
    if (!isChecked(v.guardianConsent)) e.guardianConsent = 'A parent or guardian must give consent'
  }
  if (!isChecked(v.consent)) e.consent = 'You must agree to the Privacy Policy'
  // Lists come from fixed options; anything else is tampering.
  if (v.preferredPosition && !oneOf(PREFERRED_POSITIONS, v.preferredPosition)) e.preferredPosition = 'Choose a position from the list'
  if (v.experienceLevel && !oneOf(EXPERIENCE_LEVELS, v.experienceLevel)) e.experienceLevel = 'Choose a level from the list'
  tooLong(e, v, 'previousClub', LIMITS.short, 'Previous club')
  tooLong(e, v, 'preferredTrialDate', LIMITS.short, 'Trial date')
  tooLong(e, v, 'message', LIMITS.joinMessage, 'Message')
  return e
}

function validateSponsor(v: Values): Errors {
  const e: Errors = {}
  if (blank(v.name)) e.name = 'Enter your name'
  if (blank(v.businessName)) e.businessName = 'Enter your business name'
  if (!normalisePhone(v.phone ?? '')) e.phone = 'Enter a 10-digit mobile number'
  if (v.email && !EMAIL_RE.test(v.email)) e.email = 'Enter a valid email'
  if (!isChecked(v.consent)) e.consent = 'You must agree to the Privacy Policy'
  if (v.interest && !oneOf(SPONSOR_INTERESTS, v.interest)) e.interest = 'Choose an option from the list'
  tooLong(e, v, 'name', LIMITS.name, 'Name')
  tooLong(e, v, 'businessName', LIMITS.short, 'Business name')
  tooLong(e, v, 'message', LIMITS.sponsorMessage, 'Message')
  return e
}

function validateContact(v: Values): Errors {
  const e: Errors = {}
  if (blank(v.name)) e.name = 'Enter your name'
  if (blank(v.email) && blank(v.phone)) e.email = 'Give an email address or a phone number'
  else {
    if (v.email && !EMAIL_RE.test(v.email)) e.email = 'Enter a valid email'
    if (v.phone && !normalisePhone(v.phone)) e.phone = 'Enter a 10-digit mobile number'
  }
  if (blank(v.message)) e.message = 'Enter a message'
  if (v.type && !oneOf(ENQUIRY_TYPES, v.type)) e.type = 'Choose an enquiry type from the list'
  tooLong(e, v, 'name', LIMITS.name, 'Name')
  tooLong(e, v, 'message', LIMITS.contactMessage, 'Message')
  return e
}

function validateRegister(v: Values): Errors {
  const e: Errors = {}
  const committee = v.mode === 'committee'
  const minor = isMinor(v.dateOfBirth)
  if (committee) {
    if (blank(v.regName)) e.regName = 'Enter your name'
    if (!normalisePhone(v.regPhone ?? '')) e.regPhone = 'Enter a 10-digit mobile number'
    if (v.regRole && !oneOf(COMMITTEE_ROLES, v.regRole)) e.regRole = 'Choose a role from the list'
  }
  if (blank(v.fullName) || v.fullName.trim().length < 2) e.fullName = 'Enter the player’s full name'
  dob(e, v, 'dateOfBirth', 'Enter the date of birth')
  if (!minor && !committee && blank(v.phone)) e.phone = 'Enter a mobile number'
  else if (v.phone && !normalisePhone(v.phone)) e.phone = 'Enter a 10-digit mobile number, with optional +91 or 0'
  if (v.email && !EMAIL_RE.test(v.email)) e.email = 'Enter an email like name@example.com'
  if (blank(v.address)) e.address = 'Enter a home address'
  if (minor) {
    if (blank(v.guardianName)) e.guardianName = 'Enter the parent or guardian’s name'
    if (!normalisePhone(v.guardianPhone ?? '')) e.guardianPhone = 'Enter a 10-digit mobile number'
    if (!isChecked(v.guardianConsent)) e.guardianConsent = 'A parent or guardian must give consent'
  }
  if (v.shirtNumber && (!/^\d{1,2}$/.test(v.shirtNumber) || Number(v.shirtNumber) < 1))
    e.shirtNumber = 'Enter a number from 1 to 99'
  if (blank(v.emergencyName)) e.emergencyName = 'Enter an emergency contact'
  if (blank(v.emergencyRelationship)) e.emergencyRelationship = 'Enter how they are related to the player'
  if (!normalisePhone(v.emergencyPhone ?? '')) e.emergencyPhone = 'Enter a 10-digit mobile number'
  if (committee && !isChecked(v.confirm)) e.confirm = 'Confirm the player or guardian agreed to registration'
  if (!isChecked(v.consent)) e.consent = 'You must agree to the Privacy Policy'
  if (v.team && !oneOf(TEAMS, v.team)) e.team = 'Choose a team from the list'
  if (v.foot && !oneOf(FEET, v.foot)) e.foot = 'Choose from the list'
  if (v.position && !oneOf(PREFERRED_POSITIONS, v.position)) e.position = 'Choose a position from the list'
  if (v.secondPosition && v.secondPosition !== 'none' && !oneOf(PREFERRED_POSITIONS, v.secondPosition))
    e.secondPosition = 'Choose a position from the list'
  tooLong(e, v, 'fullName', LIMITS.name, 'Name')
  tooLong(e, v, 'address', LIMITS.address, 'Address')
  tooLong(e, v, 'previousClub', LIMITS.short, 'Previous club')
  tooLong(e, v, 'medical', LIMITS.medical, 'Medical notes')
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
    case 'register':
      return validateRegister(values)
  }
}

/** Every field name a form may submit, so the server ignores anything else. */
export const FORM_FIELDS: Record<FormKind, string[]> = {
  join: [
    'fullName', 'dateOfBirth', 'phone', 'email', 'preferredPosition', 'experienceLevel', 'previousClub',
    'preferredTrialDate', 'message', 'guardianName', 'guardianPhone', 'guardianConsent', 'consent',
  ],
  sponsor: ['name', 'businessName', 'phone', 'email', 'interest', 'message', 'consent'],
  contact: ['type', 'name', 'email', 'phone', 'message'],
  register: [
    'mode', 'regName', 'regRole', 'regPhone', 'fullName', 'dateOfBirth', 'phone', 'email', 'address',
    'guardianName', 'guardianPhone', 'guardianConsent', 'team', 'foot', 'position', 'secondPosition',
    'shirtNumber', 'previousClub', 'emergencyName', 'emergencyRelationship', 'emergencyPhone', 'medical',
    'confirm', 'consent',
  ],
}

/** Name of the hidden honeypot field. Real people never fill it in. */
export const HONEYPOT = 'company_website'

/** Registration photo limits (Vercel functions accept bodies up to 4.5 MB). */
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
