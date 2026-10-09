'use client'

import { useEffect, useState, type ReactNode } from 'react'

export type SquadGroup = { key: string; query: string; title: string; count: number; content: ReactNode }

/**
 * Instant client-side position filter with state in ?pos= (PRD §D.4, design.md §E.6).
 * Groups are rendered on the server; this only shows or hides them.
 */
export function SquadFilter({ groups }: { groups: SquadGroup[] }) {
  const [active, setActive] = useState<string>('all')

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('pos')
    if (q && groups.some((g) => g.query === q)) setActive(q)
  }, [groups])

  const choose = (q: string) => {
    setActive(q)
    const url = new URL(window.location.href)
    if (q === 'all') url.searchParams.delete('pos')
    else url.searchParams.set('pos', q)
    window.history.replaceState(null, '', url)
  }

  const visible = active === 'all' ? groups : groups.filter((g) => g.query === active)
  const shown = visible.reduce((n, g) => n + g.count, 0)

  return (
    <>
      <div className="filter-row">
        <ul role="list" aria-label="Filter by position">
          {[{ query: 'all', title: 'All' }, ...groups].map((g) => (
            <li key={g.query}>
              <button type="button" className="chip-btn" aria-pressed={active === g.query} onClick={() => choose(g.query)}>
                {g.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="sr-only" role="status">
        {shown} {shown === 1 ? 'person' : 'people'} shown
      </p>
      {visible.map((g) => (
        <section key={g.key} className="player-group" aria-labelledby={`group-${g.key}`}>
          <h3 id={`group-${g.key}`} className={active === 'all' ? 't-h3' : 'sr-only'}>
            {g.title}
          </h3>
          {g.count > 0 ? (
            g.content
          ) : (
            <p className="t-secondary">No players listed in this position yet.</p>
          )}
        </section>
      ))}
    </>
  )
}

