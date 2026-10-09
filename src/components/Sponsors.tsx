import Image from 'next/image'
import type { Sponsor } from '@/payload-types'
import { asMedia } from '@/lib/media'

/** Sponsor logos in original colours (design.md §E.11). Only sponsors with permission reach here. */
export function SponsorGrid({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <ul role="list" className="sponsor-grid">
      {sponsors.map((s) => {
        const logo = asMedia(s.logo)
        const inner = logo ? (
          <Image src={logo.url!} alt={s.name} width={logo.width || 600} height={logo.height || 300} sizes="(min-width: 1024px) 200px, 40vw" />
        ) : (
          <span className="t-h4">{s.name}</span>
        )
        return (
          <li key={s.id}>
            {s.url ? (
              <a className={`sponsor-cell${s.logoOnWhite ? ' sponsor-cell--white' : ''}`} href={s.url} target="_blank" rel="noopener noreferrer sponsored">
                {inner}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <div className={`sponsor-cell${s.logoOnWhite ? ' sponsor-cell--white' : ''}`}>{inner}</div>
            )}
            {s.tier && <p className="t-caption" style={{ textTransform: 'uppercase', marginTop: 8 }}>{s.tier}</p>}
          </li>
        )
      })}
    </ul>
  )
}
