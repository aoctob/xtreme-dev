/**
 * Design-system primitives from components/*.jsx in the Claude Design project,
 * rebuilt as server-safe React with the styles moved to ds.css.
 */
import Image from 'next/image'
import Link from 'next/link'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { CLUB_NAME } from '@/lib/constants'
import { formatDay, formatTime } from '@/lib/format'
import type { ImageVM, MatchVM, SideVM, SponsorVM } from '@/lib/view'
import { Icon, type IconName } from './Icon'
import { Reveal } from './motion'

export const LOGO = '/brand/emblem-240.webp'

/* --------------------------------- Button --------------------------------- */

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'tertiary'
  size?: 'small' | 'medium' | 'large'
  icon?: IconName
  iconPosition?: 'left' | 'right'
  href?: string
  external?: boolean
  download?: boolean
  fullWidth?: boolean
  loading?: boolean
  className?: string
  children?: ReactNode
  style?: CSSProperties
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style' | 'children'> & {
    [key: `data-${string}`]: string | undefined
  }

export function Button({
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'right',
  href,
  external,
  download,
  fullWidth,
  loading,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'small' && variant !== 'tertiary' ? 'btn-sm' : '',
    size === 'large' && variant !== 'tertiary' ? 'btn-lg' : '',
    fullWidth ? 'btn-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const inner = (
    <>
      {iconPosition === 'left' && icon && <Icon name={icon} size={16} />}
      {loading ? 'Sending…' : children}
      {iconPosition === 'right' && icon && <Icon name={icon} size={16} />}
    </>
  )
  if (href) {
    const { onClick, style, ...data } = rest
    const dataAttrs = Object.fromEntries(Object.entries(data).filter(([k]) => k.startsWith('data-') || k.startsWith('aria-')))
    if (external || download || /^(https?:|mailto:|tel:)/.test(href))
      return (
        <a
          href={href}
          className={cls}
          style={style}
          onClick={onClick as never}
          download={download || undefined}
          {...(external || /^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          {...dataAttrs}
        >
          {inner}
        </a>
      )
    return (
      <Link href={href} className={cls} style={style} onClick={onClick as never} {...dataAttrs}>
        {inner}
      </Link>
    )
  }
  return (
    <button type={type} className={cls} aria-busy={loading || undefined} {...rest}>
      {inner}
    </button>
  )
}

/* ---------------------------------- Badge --------------------------------- */

export type BadgeStatus = 'scheduled' | 'live' | 'fulltime' | 'postponed' | 'cancelled' | 'win' | 'draw' | 'loss'
const BADGES: Record<BadgeStatus, { label: string; icon?: IconName }> = {
  scheduled: { label: 'Upcoming' },
  live: { label: 'Live' },
  fulltime: { label: 'Full time', icon: 'check' },
  postponed: { label: 'Postponed', icon: 'clock' },
  cancelled: { label: 'Cancelled', icon: 'x-circle' },
  win: { label: 'W' },
  draw: { label: 'D' },
  loss: { label: 'L' },
}
const RESULT_WORD = { win: 'Win', draw: 'Draw', loss: 'Loss' } as const

export function Badge({ status = 'scheduled' }: { status?: BadgeStatus }) {
  const b = BADGES[status] ?? BADGES.scheduled
  const word = status === 'win' || status === 'draw' || status === 'loss' ? RESULT_WORD[status] : null
  return (
    <span className={`badge badge-${status}`} title={word ?? undefined}>
      {b.icon && <Icon name={b.icon} size={12} />}
      {status === 'live' && <i />}
      <span aria-hidden={word ? true : undefined}>{b.label}</span>
      {word && <span className="sr">{word}</span>}
    </span>
  )
}

/* ------------------------------- Breadcrumbs ------------------------------ */

export type Crumb = { label: string; href?: string }
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {items.map((it, i) => (
          <li key={it.label + i}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page">{it.label}</span>
            ) : (
              <Link href={it.href || '/'}>{it.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* -------------------------------- Feedback -------------------------------- */

export function Skeleton({ width = '100%', height = 16 }: { width?: number | string; height?: number | string }) {
  return <div className="skel" style={{ width, height }} />
}

export function EmptyState({ icon = 'clock', title, description }: { icon?: IconName; title: string; description: string }) {
  return (
    <div className="empty">
      <div className="empty-ic">
        <Icon name={icon} size={40} />
      </div>
      <div className="empty-t">{title}</div>
      <p>{description}</p>
    </div>
  )
}

export function ErrorState({ title, description, retryHref }: { title: string; description: string; retryHref?: string }) {
  return (
    <div className="errstate" role="alert">
      <div className="errstate-h">
        <Icon name="alert-circle" size={20} />
        <span>{title}</span>
      </div>
      <p>{description}</p>
      {retryHref && (
        <Button size="small" href={retryHref}>
          Try again
        </Button>
      )}
    </div>
  )
}

/* ------------------------------- Placeholder ------------------------------ */

/** Photo slot: the real image when there is one, else the kit's badge watermark + label. */
export function Ph({
  ratio = '4/5',
  label,
  clip = 'card',
  tone,
  image,
  sizes = '(min-width:1024px) 40vw, 100vw',
  priority,
  className = '',
  style,
  children,
}: {
  ratio?: string
  label?: string
  clip?: 'card' | 'lg' | false
  tone?: string
  image?: ImageVM | null
  sizes?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  const cp = clip === 'lg' ? 'var(--clip-card-lg)' : clip ? 'var(--clip-card)' : undefined
  return (
    <div
      className={'ph ' + className}
      style={{ aspectRatio: ratio, clipPath: cp, background: tone || 'var(--color-surface-raised)', ...style }}
    >
      {image ? (
        <Image src={image.src} alt={image.alt} fill sizes={sizes} className="ph-photo" priority={priority} />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="" className="ph-badge" />
          {label && <span className="ph-label">{label}</span>}
        </>
      )}
      {children}
    </div>
  )
}

/* ----------------------------- Section helpers ---------------------------- */

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>
}

export function SectionHead({
  eyebrow,
  title,
  more,
  moreHref,
  id,
}: {
  eyebrow: string
  title: string
  more?: string
  moreHref?: string
  id?: string
}) {
  return (
    <div className="shead">
      <Reveal>
        <span className="accent-rule" />
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id={id} className="h2">
          {title}
        </h2>
      </Reveal>
      {more && moreHref && (
        <div className="shead-more">
          <Button variant="tertiary" icon="arrow-right" href={moreHref}>
            {more}
          </Button>
        </div>
      )}
    </div>
  )
}

/** Page section. `alt` flips it to the off-white light band. */
export function Sec({
  alt,
  children,
  id,
  className = '',
  style,
}: {
  alt?: boolean
  children: ReactNode
  id?: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <section
      id={id}
      className={'sec ' + (alt ? 'theme-light ' : '') + className}
      style={{ background: alt ? 'var(--color-surface)' : 'var(--color-background)', ...style }}
    >
      <div className="wrap">{children}</div>
    </section>
  )
}

export function PageHero({
  title,
  desc,
  crumbs,
  children,
}: {
  title: string
  desc?: string
  crumbs?: Crumb[]
  children?: ReactNode
}) {
  return (
    <section className="phero">
      <div className="phero-lines" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="wrap phero-in">
        {crumbs && (
          <div className="phero-crumbs">
            <Breadcrumbs items={crumbs} />
          </div>
        )}
        <h1 className="h1 phero-title">
          <span>{title}</span>
        </h1>
        {desc && <p className="phero-desc">{desc}</p>}
        {children}
      </div>
      <div className="phero-bar" />
    </section>
  )
}

/** Neon "Apply for trials" band at the foot of most pages. */
export function JoinBand({ text }: { text?: string | null }) {
  return (
    <section className="joinband">
      <div className="jb-marquee" aria-hidden="true">
        <div>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i}>Join {CLUB_NAME}</span>
          ))}
        </div>
      </div>
      <div className="wrap jb-in">
        <Reveal>
          <h2 className="h2" style={{ color: '#07140A' }}>
            Ready to play for {CLUB_NAME}?
          </h2>
        </Reveal>
        <p style={{ color: '#07140A', margin: '12px 0 28px', fontSize: 17 }}>
          {text || '[CLUB TO APPROVE copy, trial date if known]'}
        </p>
        <div className="jb-btn">
          <Button size="large" icon="arrow-right" href="/join" className="btn-ink" data-track="join_cta_click" data-track-location="join_band">
            Apply for trials
          </Button>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------- Cards --------------------------------- */

export function PlayerCard({
  name,
  number,
  position,
  photo,
  href,
  variant = 'standard',
}: {
  name: string
  number?: number | null
  position: string
  photo?: ImageVM | null
  href?: string
  variant?: 'standard' | 'compact' | 'staff'
}) {
  const staff = variant === 'staff'
  const label = staff ? `${name}, ${position}` : `${number ? `Number ${number}, ` : ''}${name}, ${position}`
  const body = (
    <>
      {photo ? (
        <Image src={photo.src} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="pc-img" />
      ) : (
        <div className="pc-ph">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="" />
        </div>
      )}
      <div className="pc-shade" />
      {!staff && number ? <div className="pc-num tnum">{number}</div> : null}
      <div className="pc-txt">
        <div className="pc-name">{name}</div>
        <div className="pc-pos">{position}</div>
      </div>
    </>
  )
  const cls = 'pc' + (variant === 'compact' ? ' pc-compact' : '')
  return href ? (
    <Link href={href} className={cls} aria-label={label}>
      {body}
    </Link>
  ) : (
    <div className={cls} role="img" aria-label={label}>
      {body}
    </div>
  )
}

/**
 * Club crest. Without an uploaded crest the home strip shows initials (kit-home.jsx Crest);
 * cards and the scoreboard show a plain disc, as in MatchCard.jsx / Scoreboard.jsx.
 */
export function Crest({
  side,
  size = 52,
  className = 'crest',
  initials = className === 'crest',
}: {
  side: SideVM
  size?: number
  className?: string
  initials?: boolean
}) {
  if (side.crest)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={side.crest} alt="" className={className} style={{ width: size, height: size }} />
  if (!initials) return <span className={className} style={{ width: size, height: size, display: 'block' }} aria-hidden="true" />
  return (
    <span className={`${className} crest-o`} style={{ width: size, height: size }} aria-hidden="true">
      {side.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)}
    </span>
  )
}

export function scoreText(m: MatchVM) {
  return `${m.home.score ?? 0} – ${m.away.score ?? 0}`
}

/** Fixture/result card body (components/cards/MatchCard.jsx). Actions are passed in. */
export function MatchCard({ m, actions }: { m: MatchVM; actions?: ReactNode }) {
  const result = m.hasScore && (m.status === 'fulltime' || m.status === 'live')
  const date = formatDay(m.kickoff) + (m.status === 'fulltime' ? '' : ` · ${formatTime(m.kickoff)} IST`)
  return (
    <div className="mcard">
      <div className="mcard-top">
        <span>{m.competition}</span>
        <Badge status={m.status} />
      </div>
      <div className="mcard-row">
        <div className="mcard-side">
          <Crest side={m.home} size={32} className="mcard-crest" />
          <span>{m.home.name}</span>
        </div>
        <div className={'mcard-mid tnum' + (result ? ' res' : '')}>{result ? scoreText(m) : formatTime(m.kickoff)}</div>
        <div className="mcard-side r">
          <span>{m.away.name}</span>
          <Crest side={m.away} size={32} className="mcard-crest" />
        </div>
      </div>
      <div className="mcard-meta">
        {date} · {m.venue} ({m.isHome ? 'H' : 'A'})
      </div>
      {actions && <div className="mcard-acts">{actions}</div>}
    </div>
  )
}

export function Scoreboard({
  m,
  score,
  countdown,
}: {
  m: MatchVM
  score?: ReactNode
  countdown?: [string, string][]
}) {
  return (
    <div className="sboard">
      <div className="sboard-side">
        <Crest side={m.home} size={72} className="sboard-crest" />
        <span>{m.home.name}</span>
      </div>
      <div className="sboard-mid">
        <Badge status={m.status} />
        {countdown ? (
          <div className="sboard-cd tnum">
            {countdown.map(([v, l]) => (
              <div key={l}>
                {v}
                <span>{l}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="sboard-score">{score}</div>
        )}
      </div>
      <div className="sboard-side">
        <Crest side={m.away} size={72} className="sboard-crest" />
        <span>{m.away.name}</span>
      </div>
    </div>
  )
}

export function SponsorLogo({ s }: { s: SponsorVM }) {
  const inner = s.logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={s.logo} alt="" />
  ) : (
    <span>{s.name}</span>
  )
  const cls = 'slogo' + (s.onWhite ? ' white' : '')
  return s.url ? (
    <a href={s.url} className={cls} aria-label={s.name} target="_blank" rel="noopener noreferrer sponsored">
      {inner}
    </a>
  ) : (
    <div className={cls} role="img" aria-label={s.name}>
      {inner}
    </div>
  )
}
