/**
 * Cookieless analytics events (PRD §G.9). Sends to Umami when its script is loaded
 * (NEXT_PUBLIC_UMAMI_WEBSITE_ID), otherwise does nothing. Never pass personal data.
 */
type Props = Record<string, string | number>

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Props) => void }
  }
}

export function track(event: string, props?: Props) {
  if (typeof window === 'undefined') return
  try {
    window.umami?.track(event, props)
  } catch {
    // Analytics must never break the page.
  }
}
