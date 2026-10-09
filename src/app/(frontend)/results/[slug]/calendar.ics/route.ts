import { getMatchBySlug } from '@/lib/queries'
import { matchTitle } from '@/lib/match'
import { siteUrl } from '@/lib/media'

export const revalidate = 600

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/** "Add to calendar" download for one match (US-05). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const match = await getMatchBySlug(slug)
  if (!match) return new Response('Not found', { status: 404 })

  const start = new Date(match.kickoffUtc)
  const end = new Date(start.getTime() + 2 * 3600_000)
  const url = `${siteUrl()}/results/${slug}`
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//XTREME CLUB//Fixtures//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:match-${match.id}@xtremeclub`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(matchTitle(match))}`,
    match.venueName ? `LOCATION:${esc(match.venueName)}` : null,
    `DESCRIPTION:${esc(`${match.competition ? `${match.competition}. ` : ''}${url}`)}`,
    `URL:${url}`,
    match.status === 'cancelled' ? 'STATUS:CANCELLED' : 'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="xtreme-club-${slug}.ics"`,
    },
  })
}
