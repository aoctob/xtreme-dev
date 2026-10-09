'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { GuestVM, PlayerVM, StaffVM } from '@/lib/view'
import { Reveal } from './motion'
import { EmptyState, PlayerCard } from './ui'

/* -------------------------------- Accordion ------------------------------- */

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(-1)
  return (
    <div className="acc">
      {items.map((it, i) => {
        const o = open === i
        return (
          <Reveal i={i} key={i} className="acc-item">
            <button type="button" aria-expanded={o} aria-controls={'acc-' + i} className="acc-q" onClick={() => setOpen(o ? -1 : i)}>
              <span>{it.q}</span>
              <span className={'pm' + (o ? ' o' : '')} aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
            <div id={'acc-' + i} role="region" className={'acc-a' + (o ? ' o' : '')}>
              <div>
                <p style={{ whiteSpace: 'pre-line' }}>{it.a}</p>
              </div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

/* ---------------------------- About: club timeline ------------------------ */

export function Timeline({ entries }: { entries: { year: string; title: string; text: string }[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)
  useEffect(() => {
    const f = () => {
      if (!ref.current) return
      const r = ref.current.getBoundingClientRect()
      setP(Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / r.height)))
    }
    f()
    addEventListener('scroll', f, { passive: true })
    return () => removeEventListener('scroll', f)
  }, [])
  return (
    <div ref={ref} className="tl">
      <div className="tl-line">
        <span style={{ transform: `scaleY(${p})` }} />
      </div>
      {entries.map((e, i) => (
        <Reveal key={i} className={'tl-i ' + (i % 2 ? 'r' : 'l')}>
          <span className="tl-dot" />
          <div className="tl-y">{e.year}</div>
          <h3 className="h4">{e.title}</h3>
          {e.text && <p>{e.text}</p>}
        </Reveal>
      ))}
    </div>
  )
}

/* ----------------------- Privacy: scroll-tracked contents ------------------ */

export function PrivacyToc({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id)
  useEffect(() => {
    const f = () => {
      let cur = sections[0]?.id
      sections.forEach(({ id }) => {
        const el = document.getElementById('pv-' + id)
        if (el && el.getBoundingClientRect().top < 160) cur = id
      })
      setActive(cur)
    }
    addEventListener('scroll', f, { passive: true })
    return () => removeEventListener('scroll', f)
  }, [sections])
  return (
    <nav className="priv-toc" aria-label="On this page">
      <div className="eyebrow">On this page</div>
      {sections.map(({ id, title }) => (
        <a
          key={id}
          href={'#pv-' + id}
          className={active === id ? 'on' : ''}
          onClick={(e) => {
            const el = document.getElementById('pv-' + id)
            if (!el) return
            e.preventDefault()
            window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 96, behavior: 'smooth' })
          }}
        >
          {title}
        </a>
      ))}
    </nav>
  )
}

/* ------------------------------ Squad filter ------------------------------ */

const FILTERS: Record<string, string> = {
  All: 'all',
  Goalkeepers: 'goalkeepers',
  Defenders: 'defenders',
  Midfielders: 'midfielders',
  Forwards: 'forwards',
  'Guest players': 'guests',
  Staff: 'staff',
}

/** Position chips + player grid, filtered in the browser (kit-club.jsx Squad). */
export function SquadView({ players, guests, staff }: { players: PlayerVM[]; guests: GuestVM[]; staff: StaffVM[] }) {
  const params = useSearchParams()
  const router = useRouter()
  const key = Object.values(FILTERS).includes(params.get('pos') ?? '') ? (params.get('pos') as string) : 'all'
  const label = Object.keys(FILTERS).find((l) => FILTERS[l] === key) || 'All'
  const setFilter = (l: string) => router.replace('/squad' + (FILTERS[l] === 'all' ? '' : '?pos=' + FILTERS[l]), { scroll: false })
  const list = key === 'staff' || key === 'guests' ? [] : players.filter((p) => key === 'all' || p.positionKey === key)
  const showStaff = (key === 'all' && staff.length > 0) || key === 'staff'
  const showGuests = (key === 'all' || key === 'guests') && guests.length > 0
  return (
    <>
      <div className="filterbar">
        <div className="wrap">
          <div className="chips" role="group" aria-label="Filter by position">
            {Object.keys(FILTERS).map((o) => (
              <button key={o} type="button" className="chip" aria-pressed={o === label} onClick={() => setFilter(o)}>
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>
      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap">
          {key !== 'staff' &&
            key !== 'guests' &&
            (list.length ? (
              <div className="grid-squad" key={key}>
                {list.map((p, i) => (
                  <div key={p.slug} className="pop" style={{ animationDelay: Math.min(i, 11) * 35 + 'ms' }}>
                    <PlayerCard name={p.name} number={p.number} position={p.position} photo={p.photo} href={`/squad/${p.slug}`} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="users" title="No players listed" description="No players listed in this position yet." />
            ))}
          {showGuests && (
            <div style={{ marginTop: key === 'guests' ? 0 : 64 }}>
              {key === 'all' && (
                <h2 className="h3" style={{ marginBottom: 8 }}>
                  Guest players
                </h2>
              )}
              <p className="muted" style={{ margin: '0 0 24px', maxWidth: 560 }}>
                Players who have featured for the club in selected tournaments without joining the permanent squad.
              </p>
              <div className="grid-squad" key={'g' + key}>
                {guests.map((g, i) => (
                  <div key={g.slug} className="pop" style={{ animationDelay: i * 35 + 'ms', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <PlayerCard name={g.name} position={g.position} />
                    {(g.apps !== null || g.event) && (
                      <div className="caption" style={{ color: 'var(--color-text-secondary)' }}>
                        {g.apps !== null && (
                          <>
                            <span className="tnum">{g.apps}</span> {g.apps === 1 ? 'appearance' : 'appearances'}
                          </>
                        )}
                        {g.apps !== null && g.event && ' · '}
                        {g.event}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {key === 'guests' && !guests.length && (
            <EmptyState icon="users" title="No guest players listed" description="No guest players listed yet." />
          )}
          {showStaff && staff.length > 0 && (
            <div style={{ marginTop: key === 'staff' ? 0 : 64 }}>
              {key === 'all' && (
                <h2 className="h3" style={{ marginBottom: 24 }}>
                  Staff
                </h2>
              )}
              <div className="grid-squad" key={'s' + key}>
                {staff.map((s, i) => (
                  <div key={s.id} className="pop" style={{ animationDelay: i * 35 + 'ms' }}>
                    <PlayerCard variant="staff" name={s.name} position={s.role} photo={s.photo} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {key === 'staff' && !staff.length && <EmptyState icon="users" title="No staff listed" description="No staff listed yet." />}
        </div>
      </section>
    </>
  )
}
