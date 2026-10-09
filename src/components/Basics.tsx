import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { AlertCircle, ArrowRight } from 'lucide-react'
import type { Media } from '@/payload-types'

/** The club badge, used exactly as supplied (design.md §A.6). */
export function Badge({
  size,
  priority,
  alt = '',
}: {
  size: number
  priority?: boolean
  alt?: string
}) {
  const src =
    size <= 48 ? '/brand/badge-96.webp' : size <= 80 ? '/brand/badge-160.webp' : size <= 120 ? '/brand/badge-240.webp' : '/brand/badge-512.webp'
  return <Image src={src} width={size} height={size} alt={alt} priority={priority} unoptimized />
}

/** Marks content the club still has to provide (PRD constraint C2). */
export function Supply({ what }: { what: string }) {
  return <em className="placeholder">[CLUB TO SUPPLY: {what}]</em>
}

/** Text from the CMS, or a visible placeholder when empty. */
export function OrSupply({ value, what }: { value?: string | number | null; what: string }) {
  return value || value === 0 ? <>{value}</> : <Supply what={what} />
}

/** Image from the media collection, or the badge placeholder (design.md §A.5). */
export function MediaImage({
  media,
  sizes,
  priority,
  alt,
  size = 'card',
}: {
  media: Media | null | undefined
  sizes: string
  priority?: boolean
  alt?: string
  size?: 'thumb' | 'card' | 'large'
}) {
  if (!media?.url) {
    return (
      <div className="media-placeholder" aria-hidden="true">
        <Badge size={120} />
      </div>
    )
  }
  const variant = media.sizes?.[size]
  const src = (variant?.url as string | undefined) || media.url
  const width = (variant?.width as number | undefined) || media.width || 1200
  const height = (variant?.height as number | undefined) || media.height || 800
  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt ?? media.alt ?? ''}
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? 'high' : undefined}
    />
  )
}

export function SectionHead({
  eyebrow,
  title,
  id,
  link,
  level = 2,
}: {
  eyebrow?: string
  title: ReactNode
  id?: string
  link?: { href: string; label: string }
  level?: 2 | 3
}) {
  const H = level === 2 ? 'h2' : 'h3'
  return (
    <div className="section__head">
      <div>
        {eyebrow && <span className="eyebrow eyebrow--rule">{eyebrow}</span>}
        <H id={id} className={level === 2 ? 't-h2' : 't-h3'}>
          {title}
        </H>
      </div>
      {link && <TextLink href={link.href}>{link.label}</TextLink>}
    </div>
  )
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="link" href={href}>
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  )
}

export function PageHero({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <header className="page-hero">
      <div className="container">
        <h1>{title}</h1>
        {description && <p className="t-lead measure">{description}</p>}
      </div>
    </header>
  )
}

export function Breadcrumb({ trail }: { trail: { href?: string; label: string }[] }) {
  const parent = trail[trail.length - 2]
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb container">
      <ol className="breadcrumb__full">
        {trail.map((c, i) => (
          <li key={i}>
            {c.href && i < trail.length - 1 ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
      {parent?.href && (
        <Link className="breadcrumb__back" href={parent.href}>
          ← {parent.label}
        </Link>
      )}
    </nav>
  )
}

export function JoinCta({ text }: { text?: string | null }) {
  return (
    <section className="cta-band" aria-labelledby="join-cta-title">
      <div className="container">
        <h2 id="join-cta-title">Ready to play for Xtreme FC?</h2>
        {text ? <p>{text}</p> : <p>Trials are open to new players. Tell us about yourself and we&apos;ll be in touch.</p>}
        <Link className="btn btn--dark btn--lg" href="/join" data-track="join_cta_click" data-track-location="cta-band">
          Apply for trials
        </Link>
      </div>
    </section>
  )
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children?: ReactNode
}) {
  return (
    <div className="empty">
      {icon}
      <h3 className="t-h4">{title}</h3>
      {children}
    </div>
  )
}

export function ErrorBox({ what, href }: { what: string; href?: string }) {
  return (
    <div className="error-box" role="alert">
      <h3>
        <AlertCircle size={20} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-3px', color: 'var(--color-error)', marginRight: 8 }} />
        Something went wrong
      </h3>
      <p className="t-small t-secondary">{what} could not be loaded.</p>
      <a className="btn btn--primary btn--sm" href={href ?? ''}>
        Try again
      </a>
    </div>
  )
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
