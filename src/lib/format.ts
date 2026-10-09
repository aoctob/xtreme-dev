import { TIME_ZONE } from './constants'

/** All match times are stored in UTC and shown in IST (PRD §D.6). */
const fmt = (opts: Intl.DateTimeFormatOptions, locale = 'en-GB') =>
  new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, ...opts })

// Same formats as the design kit: "Sat 10 Oct", "6:00 PM", "October 2026".
const dayFmt = fmt({ weekday: 'short', day: 'numeric', month: 'short' })
const timeFmt = fmt({ hour: 'numeric', minute: '2-digit', hour12: true }, 'en-US')
const longDateFmt = fmt({ day: 'numeric', month: 'short', year: 'numeric' })
const monthFmt = fmt({ month: 'long', year: 'numeric' })
const fullFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "Sat 24 Oct" */
export const formatDay = (iso: string) => dayFmt.format(new Date(iso)).replace(',', '')
/** "6:00 PM" */
export const formatTime = (iso: string) => timeFmt.format(new Date(iso)).toUpperCase()
/** "Sat 24 Oct · 6:00 PM IST" */
export const formatKickoff = (iso: string) => `${formatDay(iso)} · ${formatTime(iso)} IST`
/** "24 Oct 2026" */
export const formatLongDate = (iso: string) => longDateFmt.format(new Date(iso))
/** "Saturday 24 October 2026" */
export const formatFullDate = (iso: string) => fullFmt.format(new Date(iso))
/** "October 2026" */
export const formatMonth = (iso: string) => monthFmt.format(new Date(iso))

export function ageFrom(dateOfBirth: string | Date, now = new Date()): number {
  const dob = new Date(dateOfBirth)
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}

/** "Sat 17 Oct 2026, 7:00 AM" (trial dates) */
export const formatDateTime = (iso: string) =>
  `${formatDay(iso)} ${new Date(iso).toLocaleDateString('en-GB', { timeZone: TIME_ZONE, year: 'numeric' })}, ${formatTime(iso)}`

export function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    map.set(k, [...(map.get(k) ?? []), item])
  }
  return [...map.entries()]
}
