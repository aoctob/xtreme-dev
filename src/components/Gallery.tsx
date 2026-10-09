'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Play, X } from 'lucide-react'
import { track } from '@/lib/analytics'
import { youtubeEmbed } from '@/lib/media'

export type GalleryItem = {
  id: number | string
  src: string
  thumb: string
  width: number
  height: number
  alt: string
  caption?: string | null
  credit?: string | null
  album?: string | null
  videoUrl?: string | null
}

const PAGE = 24

/**
 * Gallery tiles + accessible lightbox (PRD §D.9, US-11; design.md §E.10).
 * Album filter and "Load more" are optional (`filter`).
 */
export function Gallery({
  items,
  filter,
  limit,
  gridClass = 'gallery-grid',
}: {
  items: GalleryItem[]
  filter?: boolean
  limit?: number
  gridClass?: string
}) {
  const albums = useMemo(
    () => [...new Set(items.map((i) => i.album).filter((a): a is string => Boolean(a)))],
    [items],
  )
  const [album, setAlbum] = useState<string>('all')
  const [shown, setShown] = useState(limit ?? PAGE)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([])
  const dialogRef = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)

  const filtered = album === 'all' ? items : items.filter((i) => i.album === album)
  const visible = filtered.slice(0, limit ?? shown)
  const current = openIndex === null ? null : visible[openIndex]

  const close = useCallback(() => {
    const i = openIndex
    setOpenIndex(null)
    setPlaying(false)
    if (i !== null) tileRefs.current[i]?.focus()
  }, [openIndex])

  const go = useCallback(
    (delta: number) => {
      setPlaying(false)
      setOpenIndex((i) => (i === null ? i : (i + delta + visible.length) % visible.length))
    },
    [visible.length],
  )

  useEffect(() => {
    if (openIndex === null) return
    document.body.classList.add('no-scroll')
    dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], iframe')
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
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('no-scroll')
      document.removeEventListener('keydown', onKey)
    }
  }, [openIndex, close, go])

  // Preload neighbours.
  useEffect(() => {
    if (openIndex === null || visible.length < 2) return
    for (const d of [-1, 1]) {
      const n = visible[(openIndex + d + visible.length) % visible.length]
      const img = new window.Image()
      img.src = n.src
    }
  }, [openIndex, visible])

  const open = (i: number) => {
    setOpenIndex(i)
    track('gallery_open')
  }

  const embed = current ? youtubeEmbed(current.videoUrl) : null

  return (
    <>
      {filter && albums.length > 1 && (
        <div className="filter-row">
          <ul role="list" aria-label="Filter by album">
            {['all', ...albums].map((a) => (
              <li key={a}>
                <button
                  type="button"
                  className="chip-btn"
                  aria-pressed={album === a}
                  onClick={() => {
                    setAlbum(a)
                    setShown(PAGE)
                  }}
                >
                  {a === 'all' ? 'All' : a}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul role="list" className={gridClass}>
        {visible.map((item, i) => (
          <li key={item.id}>
            <button
              ref={(el) => {
                tileRefs.current[i] = el
              }}
              type="button"
              className="tile"
              onClick={() => open(i)}
              aria-label={`${item.alt}${item.videoUrl ? ' (play video)' : ' (open)'}`}
            >
              <Image src={item.thumb} alt="" width={480} height={480} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
              {item.videoUrl ? (
                <span className="tile__play" aria-hidden="true">
                  <span>
                    <Play size={24} fill="currentColor" />
                  </span>
                </span>
              ) : (
                <span className="tile__overlay" aria-hidden="true">
                  <Maximize2 size={24} />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {!limit && filtered.length > shown && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button type="button" className="btn btn--secondary" onClick={() => setShown((s) => s + PAGE)}>
            Load more photos
          </button>
        </div>
      )}

      {current && (
        <div
          ref={dialogRef}
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div className="lightbox__bar">
            <button type="button" className="icon-btn" aria-label="Close photo viewer" onClick={close} data-autofocus>
              <X size={24} aria-hidden="true" />
            </button>
          </div>
          <div
            className="lightbox__stage"
            onClick={(e) => {
              if (e.target === e.currentTarget) close()
            }}
            onTouchStart={(e) => {
              touchX.current = e.touches.length === 1 ? e.touches[0].clientX : null
            }}
            onTouchEnd={(e) => {
              if (touchX.current === null) return
              const dx = e.changedTouches[0].clientX - touchX.current
              touchX.current = null
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
            }}
          >
            {embed && playing ? (
              <iframe
                src={embed}
                title={current.alt}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              // Plain <img>: the lightbox shows the full image at its natural ratio.
              // eslint-disable-next-line @next/next/no-img-element
              <img key={current.src} src={current.src} alt={current.alt} width={current.width} height={current.height} />
            )}
            {visible.length > 1 && (
              <>
                <button type="button" className="icon-btn lightbox__nav lightbox__nav--prev" aria-label="Previous photo" onClick={() => go(-1)}>
                  <ChevronLeft size={28} aria-hidden="true" />
                </button>
                <button type="button" className="icon-btn lightbox__nav lightbox__nav--next" aria-label="Next photo" onClick={() => go(1)}>
                  <ChevronRight size={28} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
          <div className="lightbox__foot">
            {current.videoUrl && !playing && (
              embed ? (
                <button type="button" className="btn btn--primary btn--sm" onClick={() => setPlaying(true)}>
                  <Play size={16} aria-hidden="true" /> Play video
                </button>
              ) : (
                <a className="btn btn--primary btn--sm" href={current.videoUrl} target="_blank" rel="noopener noreferrer">
                  Watch video (opens in a new tab)
                </a>
              )
            )}
            {current.caption && <p className="t-small">{current.caption}</p>}
            {current.credit && <p className="t-caption t-muted">Photo: {current.credit}</p>}
            <p className="t-caption" aria-live="polite">
              {(openIndex ?? 0) + 1} / {visible.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
