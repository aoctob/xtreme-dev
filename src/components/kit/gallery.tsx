'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { track } from '@/lib/analytics'
import type { MediaVM } from '@/lib/view'
import { Icon } from './Icon'
import { Reveal } from './motion'
import { Button, EmptyState, Ph } from './ui'

type Item = MediaVM & { tall?: boolean; wide?: boolean }

export function Tile({ item, onOpen, i = 0 }: { item: Item; onOpen: (el: HTMLButtonElement) => void; i?: number }) {
  return (
    <Reveal i={i} className={'tile-w' + (item.tall ? ' tall' : '') + (item.wide ? ' wide' : '')}>
      <button type="button" className="tile" onClick={(e) => onOpen(e.currentTarget)} aria-label={(item.alt || item.caption) + ' (open)'}>
        <Ph
          ratio="auto"
          clip={false}
          label={item.album}
          tone={i % 3 === 1 ? 'var(--color-surface-overlay)' : undefined}
          image={item.thumb ? { src: item.thumb, alt: '', width: 960, height: 960 } : null}
          sizes="(min-width:1024px) 25vw, 50vw"
          style={{ position: 'absolute', inset: 0 }}
        />
        {item.type === 'video' && (
          <span className="tile-play">
            <Icon name="play" color="#07140A" />
          </span>
        )}
        <span className="tile-ov">
          <Icon name="maximize" size={24} color="#F4F1E1" />
        </span>
      </button>
    </Reveal>
  )
}

function Lightbox({
  items,
  index,
  onClose,
  onNav,
}: {
  items: Item[]
  index: number
  onClose: () => void
  onNav: (d: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [leaving, setLeaving] = useState(false)
  const [dir, setDir] = useState(1)
  const [playing, setPlaying] = useState(false)
  const touch = useRef<number | null>(null)
  const close = () => {
    setLeaving(true)
    setTimeout(onClose, 150)
  }
  const nav = (d: number) => {
    setDir(d)
    setPlaying(false)
    onNav(d)
  }
  useEffect(() => {
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') nav(-1)
      if (e.key === 'ArrowRight') nav(1)
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, iframe, a')
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  const it = items[index]
  if (!it) return null
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={it.type === 'video' ? 'Video viewer' : 'Photo viewer'}
      className={'lbx' + (leaving ? ' out' : '')}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 50) nav(dx < 0 ? 1 : -1)
        touch.current = null
      }}
    >
      <div className="lbx-scrim" onClick={close} />
      <button ref={closeRef} type="button" aria-label="Close" className="lbx-btn lbx-close" onClick={close}>
        <Icon name="x" size={28} />
      </button>
      {items.length > 1 && (
        <button type="button" aria-label="Previous" className="lbx-btn lbx-prev" onClick={() => nav(-1)}>
          <Icon name="chevron-left" size={28} />
        </button>
      )}
      <figure className="lbx-fig">
        <div key={it.id} className={'lbx-img ' + (dir > 0 ? 'fwd' : 'back')}>
          {it.type === 'video' && playing ? (
            it.embed ? (
              <div className="lbx-embed has-video">
                <iframe src={it.embed} title={it.caption || 'Video'} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div className="lbx-embed">
                <a href={it.videoUrl || '#'} target="_blank" rel="noopener noreferrer">
                  Open the video <Icon name="arrow-up-right" size={14} />
                </a>
              </div>
            )
          ) : it.src && it.type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={it.src} alt={it.alt} width={it.width} height={it.height} className="lbx-photo" />
          ) : (
            <Ph
              ratio="3/2"
              clip="lg"
              label={it.type === 'video' ? 'Video poster' : 'Photo · ' + it.album}
              image={it.src ? { src: it.src, alt: it.alt, width: it.width, height: it.height } : null}
              sizes="100vw"
              style={{ width: '100%' }}
            >
              {it.type === 'video' && (
                <button type="button" className="lbx-playbtn" aria-label="Play video" onClick={() => setPlaying(true)}>
                  <Icon name="play" color="#07140A" size={28} />
                </button>
              )}
            </Ph>
          )}
        </div>
        <figcaption className="lbx-cap">
          <span>
            {it.caption}
            {it.credit && <span className="muted"> · {it.credit}</span>}
          </span>
          <span className="tnum muted">
            {index + 1} / {items.length}
          </span>
        </figcaption>
      </figure>
      {items.length > 1 && (
        <button type="button" aria-label="Next" className="lbx-btn lbx-next" onClick={() => nav(1)}>
          <Icon name="chevron-right" size={28} />
        </button>
      )}
    </div>
  )
}

/** Lightbox controller: keeps the index and returns focus to the tile that opened it. */
export function useLightbox(items: Item[]): [(i: number, el: HTMLElement) => void, ReactNode] {
  const [idx, setIdx] = useState<number | null>(null)
  const origin = useRef<HTMLElement | null>(null)
  const open = (i: number, el: HTMLElement) => {
    origin.current = el
    setIdx(i)
    track('gallery_open')
  }
  const node =
    idx !== null ? (
      <Lightbox
        items={items}
        index={idx}
        onClose={() => {
          setIdx(null)
          origin.current?.focus()
        }}
        onNav={(d) => setIdx((x) => ((x ?? 0) + d + items.length) % items.length)}
      />
    ) : null
  return [open, node]
}

/** A fixed grid of square tiles with a lightbox (home, player, match pages). */
export function TileGrid({ items, className = 'grid-gal6' }: { items: MediaVM[]; className?: string }) {
  const [open, lightbox] = useLightbox(items)
  return (
    <>
      <div className={className}>
        {items.map((p, i) => (
          <Tile key={p.id} item={p} i={i} onOpen={(el) => open(i, el)} />
        ))}
      </div>
      {lightbox}
    </>
  )
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Gallery page body: album chips, masonry grid, load more, lightbox (kit-media.jsx). */
export function GalleryBrowser({ media }: { media: MediaVM[] }) {
  const params = useSearchParams()
  const router = useRouter()
  const [shown, setShown] = useState(24)
  // Albums in the order they were started (media arrives newest first).
  const albums = ['All', ...Array.from(new Set([...media].reverse().map((m) => m.album).filter(Boolean)))]
  const label = albums.find((a) => slugify(a) === params.get('album')) || 'All'
  const items: Item[] = media
    .filter((m) => label === 'All' || m.album === label)
    .map((m, i) => ({ ...m, tall: i % 5 === 1, wide: i % 9 === 4 }))
  const vis = items.slice(0, shown)
  const [openLb, lightbox] = useLightbox(items)
  return (
    <>
      <div className="filterbar">
        <div className="wrap">
          <div className="chips" role="group" aria-label="Filter by album">
            {albums.map((a) => (
              <button
                key={a}
                type="button"
                className="chip"
                aria-pressed={a === label}
                onClick={() => {
                  setShown(24)
                  router.replace('/gallery' + (a === 'All' ? '' : '?album=' + slugify(a)), { scroll: false })
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap">
          {!items.length ? (
            <EmptyState icon="maximize" title="Photos coming soon" description="Photos coming soon." />
          ) : (
            <>
              <div className="grid-gal" key={label}>
                {vis.map((m, i) => (
                  <Tile key={m.id} item={m} i={i % 6} onOpen={(el) => openLb(items.indexOf(m), el)} />
                ))}
              </div>
              <div className="gal-foot">
                <span className="caption tnum">
                  Showing {vis.length} of {items.length}
                </span>
                {shown < items.length && (
                  <Button variant="secondary" onClick={() => setShown((s) => s + 24)}>
                    Load more
                  </Button>
                )}
              </div>
            </>
          )}
          {lightbox}
        </div>
      </section>
    </>
  )
}
