import Link from 'next/link'
import type { Player, Staff } from '@/payload-types'
import { labelFor, POSITIONS } from '@/lib/constants'
import { asMedia } from '@/lib/media'
import { MediaImage } from './Basics'

export const positionLabel = (p: Player['position']) => labelFor(POSITIONS, p)

/** Player card (design.md §E.5): whole card is one link, named "Number 9, Name, Forward". */
export function PlayerCard({ player, compact }: { player: Player; compact?: boolean }) {
  const position = positionLabel(player.position)
  const photo = player.consentOnFile ? asMedia(player.photo) : null
  const name = [player.shirtNumber ? `Number ${player.shirtNumber}` : null, player.fullName, position]
    .filter(Boolean)
    .join(', ')
  return (
    <article className="player-card clip">
      <div className="player-card__media">
        <MediaImage
          media={photo}
          alt=""
          size="card"
          sizes={compact ? '220px' : '(min-width: 1024px) 296px, (min-width: 768px) 33vw, 50vw'}
        />
      </div>
      <div className="player-card__body">
        {player.shirtNumber ? (
          <span className="player-card__number" aria-hidden="true">
            {player.shirtNumber}
          </span>
        ) : null}
        <h3 className="player-card__name">
          <Link href={`/squad/${player.slug}`} aria-label={name}>
            {player.fullName}
          </Link>
        </h3>
        <span className="t-caption">{position}</span>
      </div>
    </article>
  )
}

export function StaffCard({ person }: { person: Staff }) {
  return (
    <article className="player-card player-card--static clip">
      <div className="player-card__media">
        <MediaImage media={asMedia(person.photo)} alt="" size="card" sizes="(min-width: 1024px) 296px, (min-width: 768px) 33vw, 50vw" />
      </div>
      <div className="player-card__body">
        <h3 className="player-card__name">{person.name}</h3>
        <span className="t-caption">{person.role}</span>
      </div>
    </article>
  )
}
