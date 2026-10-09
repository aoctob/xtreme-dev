import type { ReactElement } from 'react'

/** Simple outline marks for social networks (Lucide no longer ships brand icons). */
const paths: Record<string, ReactElement> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" />,
  youtube: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  x: <path d="M4 4l16 16M20 4 4 20" />,
  whatsapp: (
    <>
      <path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 7.7 19.5z" />
      <path d="M9 9.5c.5 2 2.5 4 4.5 4.5l1.2-1.2 2 1-.6 1.7c-3.3.3-7.4-3.8-7.1-7.1l1.7-.6 1 2z" />
    </>
  ),
}

export function SocialIcon({ network, size = 24 }: { network: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      {paths[network] ?? <circle cx="12" cy="12" r="9" />}
    </svg>
  )
}
