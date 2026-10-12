/**
 * Form rules shared by the browser and the Server Actions (PRD §D.10, §D.11, §D.13, §J.5).
 * Messages follow the design kit (ui_kits/website/kit-forms.jsx, kit-register.jsx).
 * Pure functions only, so the same code runs on both sides.
 */
import {
  BACHELOR_DEGREES,
  BLOOD_GROUPS,
  ENQUIRY_TYPES,
  EXPERIENCE_LEVELS,
  FEET,
  MASTER_DEGREES,
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
  school: 150,
  otherQualifications: 300,
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

/* ------------------------- Aadhaar, PAN and Player ID ------------------------- */

// Verhoeff tables: the check digit UIDAI uses on every Aadhaar number.
const VD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]
const VP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]
const verhoeff = (digits: string) =>
  digits
    .split('')
    .reverse()
    .reduce((c, d, i) => VD[c][VP[i % 8][Number(d)]], 0) === 0

/** Input mask: digits only, grouped 4-4-4 ("2345 6789 0124"). */
export const maskAadhaar = (raw: string) =>
  raw
    .replace(/\D/g, '')
    .slice(0, 12)
    .replace(/(\d{4})(?=\d)/g, '$1 ')

/** 12 digits, not starting with 0 or 1, with a valid Verhoeff check digit. */
export function isAadhaar(raw: string | null | undefined): boolean {
  const d = (raw ?? '').replace(/\s/g, '')
  return /^[2-9]\d{11}$/.test(d) && verhoeff(d)
}

/** Input mask: capitals and digits only, 10 characters ("ABCPE1234F"). */
export const maskPan = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10)

/** Five letters (the fourth is the holder type, P for a person), four digits, one letter. */
export const PAN_RE = /^[A-Z]{3}[ABCEFGHJLPT][A-Z]\d{4}[A-Z]$/
export const isPan = (raw: string | null | undefined) => PAN_RE.test((raw ?? '').trim().toUpperCase())

/** Club player number given at approval: "xfc-26-0001". */
export const PLAYER_ID_RE = /^xfc-\d{2}-\d{4,}$/
export const formatPlayerId = (year: number, serial: number) =>
  `xfc-${String(year % 100).padStart(2, '0')}-${String(serial).padStart(4, '0')}`

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
  if (blank(v.fullName) || v.fullName.trim().length < 2) e.fullName = 'Enter the player’s full name'
  dob(e, v, 'dateOfBirth', 'Enter the date of birth')
  const needPhone = !minor && !committee
  if (needPhone && blank(v.phone)) e.phone = 'Enter a mobile number for calls'
  else if (v.phone && !normalisePhone(v.phone)) e.phone = 'Enter a 10-digit mobile number, with optional +91 or 0'
  if (!isChecked(v.whatsappSame)) {
    if (needPhone && blank(v.whatsapp)) e.whatsapp = 'Enter a WhatsApp number, or tick “Same as calling number”'
    else if (v.whatsapp && !normalisePhone(v.whatsapp)) e.whatsapp = 'Enter a 10-digit mobile number, with optional +91 or 0'
  }
  if (blank(v.email)) e.email = 'Enter an email address'
  else if (!EMAIL_RE.test(v.email)) e.email = 'Enter an email like name@example.com'
  if (blank(v.bloodGroup)) e.bloodGroup = 'Choose a blood group, or “Unknown”'
  else if (!oneOf(BLOOD_GROUPS, v.bloodGroup)) e.bloodGroup = 'Choose a blood group from the list'
  if (blank(v.aadhaarNumber)) e.aadhaarNumber = 'Enter the 12-digit Aadhaar number'
  else if (!isAadhaar(v.aadhaarNumber)) e.aadhaarNumber = 'Enter a valid 12-digit Aadhaar number, like 2345 6789 0124'
  if (blank(v.aadhaarImage)) e.aadhaarImage = 'Add a photo or scan of the Aadhaar card'
  // Under-18s rarely have a PAN card, so it is required for adults only.
  if (!minor && blank(v.panNumber)) e.panNumber = 'Enter the 10-character PAN'
  else if (v.panNumber && !isPan(v.panNumber)) e.panNumber = 'Enter a PAN like ABCPE1234F: 5 letters, 4 digits, 1 letter'
  if (!minor && blank(v.panImage)) e.panImage = 'Add a photo or scan of the PAN card'
  if (v.panImage && blank(v.panNumber) && !e.panNumber) e.panNumber = 'Enter the PAN shown on the card'
  if (v.bachelorDegree && !oneOf(BACHELOR_DEGREES, v.bachelorDegree)) e.bachelorDegree = 'Choose a degree from the list'
  if (v.masterDegree && !oneOf(MASTER_DEGREES, v.masterDegree)) e.masterDegree = 'Choose a degree from the list'
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
  tooLong(e, v, 'email', LIMITS.email, 'Email')
  tooLong(e, v, 'schoolName', LIMITS.school, 'School name')
  tooLong(e, v, 'bachelorCollege', LIMITS.school, 'College name')
  tooLong(e, v, 'masterCollege', LIMITS.school, 'College name')
  tooLong(e, v, 'otherQualifications', LIMITS.otherQualifications, 'Other qualifications')
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
    'mode', 'fullName', 'dateOfBirth', 'phone', 'email', 'address',
    'guardianName', 'guardianPhone', 'guardianConsent', 'team', 'foot', 'position', 'secondPosition',
    'shirtNumber', 'previousClub', 'emergencyName', 'emergencyRelationship', 'emergencyPhone', 'medical',
    'confirm', 'consent', 'whatsapp', 'whatsappSame', 'bloodGroup', 'schoolName', 'bachelorDegree',
    'bachelorCollege', 'masterDegree', 'masterCollege', 'otherQualifications', 'aadhaarNumber', 'panNumber',
  ],
}

/** Name of the hidden honeypot field. Real people never fill it in. */
export const HONEYPOT = 'company_website'

/**
 * Registration images (player photo, Aadhaar and PAN). Vercel functions accept request bodies up
 * to 4.5 MB, so the browser shrinks each image before sending and the server caps the total.
 */
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
/** Largest file a person may pick, before the browser shrinks it. */
export const IMAGE_PICK_MAX_BYTES = 15 * 1024 * 1024
/** Largest image the server accepts, after shrinking. */
export const PHOTO_MAX_BYTES = 1.4 * 1024 * 1024
/** All registration images together. */
export const UPLOAD_TOTAL_MAX_BYTES = 4 * 1024 * 1024
/** File inputs on the Register form. Validation sees each as 'file' when one is attached. */
export const REGISTER_FILES = ['photo', 'aadhaarImage', 'panImage'] as const
