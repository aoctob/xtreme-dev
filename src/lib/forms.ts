import type { FieldDef } from '@/components/forms/Form'
import {
  ENQUIRY_TYPES,
  EXPERIENCE_LEVELS,
  PREFERRED_POSITIONS,
  SPONSOR_INTERESTS,
} from './constants'
import { LIMITS } from './validation'

const opts = (list: readonly { label: string; value: string }[]) => list.map(({ label, value }) => ({ label, value }))

/** Join / trials form (PRD §D.10). Trial dates come from the Join page global. */
export const joinFields = (trialDates: string[]): FieldDef[] => [
  { name: 'fullName', label: 'Full name', type: 'text', required: true, autoComplete: 'name', maxLength: LIMITS.name },
  { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true, autoComplete: 'bday' },
  {
    name: 'phone',
    label: 'Phone number',
    type: 'tel',
    required: true,
    autoComplete: 'tel',
    inputMode: 'tel',
    help: '10-digit mobile number. +91 is optional.',
  },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', inputMode: 'email', maxLength: LIMITS.email },
  { name: 'preferredPosition', label: 'Preferred position', type: 'select', required: true, options: opts(PREFERRED_POSITIONS) },
  { name: 'experienceLevel', label: 'Experience level', type: 'select', required: true, options: opts(EXPERIENCE_LEVELS) },
  { name: 'previousClub', label: 'Previous club', type: 'text', maxLength: LIMITS.short },
  {
    name: 'preferredTrialDate',
    label: 'Preferred trial date',
    type: 'select',
    options: [...trialDates.map((d) => ({ label: d, value: d })), { label: 'Not sure', value: 'Not sure' }],
  },
  {
    name: 'guardianName',
    label: 'Parent or guardian name',
    type: 'text',
    minorOnly: true,
    autoComplete: 'off',
    maxLength: LIMITS.name,
    help: 'Needed because the applicant is under 18.',
  },
  {
    name: 'guardianPhone',
    label: 'Parent or guardian phone',
    type: 'tel',
    minorOnly: true,
    inputMode: 'tel',
    autoComplete: 'off',
  },
  { name: 'message', label: 'Message', type: 'textarea', maxLength: LIMITS.joinMessage },
  {
    name: 'consent',
    label: 'I agree (or, for under-18s, the parent or guardian agrees) to the club using these details as described in the',
    type: 'consent',
    required: true,
  },
]

export const sponsorFields: FieldDef[] = [
  { name: 'name', label: 'Your name', type: 'text', required: true, autoComplete: 'name', maxLength: LIMITS.name },
  { name: 'businessName', label: 'Business name', type: 'text', required: true, autoComplete: 'organization', maxLength: LIMITS.short },
  { name: 'phone', label: 'Phone number', type: 'tel', required: true, autoComplete: 'tel', inputMode: 'tel' },
  { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email', inputMode: 'email' },
  { name: 'interest', label: 'Interested in', type: 'select', required: true, options: opts(SPONSOR_INTERESTS), full: true },
  { name: 'message', label: 'Message', type: 'textarea', maxLength: LIMITS.sponsorMessage },
]

export const contactFields: FieldDef[] = [
  { name: 'type', label: 'Enquiry type', type: 'select', required: true, options: opts(ENQUIRY_TYPES), full: true },
  { name: 'name', label: 'Your name', type: 'text', required: true, autoComplete: 'name', maxLength: LIMITS.name, full: true },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
    inputMode: 'email',
    help: 'Give an email or a phone number so we can reply.',
  },
  { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
  { name: 'message', label: 'Message', type: 'textarea', required: true, maxLength: LIMITS.contactMessage },
]
