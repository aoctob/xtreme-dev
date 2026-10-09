import type { JoinPage, SiteSetting } from '@/payload-types'

/** How people can reach the club, for form error banners. */
export const contactLine = (s: SiteSetting | null) =>
  [s?.email, s?.phone].filter(Boolean).join(' or ') || '[CLUB TO SUPPLY: email/phone]'

/** "within 3 days", for success messages. */
export const responseTime = (j: JoinPage | null) => j?.responseTime || 'within [CLUB TO SUPPLY: response time]'

export const socialUrl = (s: SiteSetting | null, network: string) =>
  s?.socials?.find((x) => x.network === network)?.url ?? null
