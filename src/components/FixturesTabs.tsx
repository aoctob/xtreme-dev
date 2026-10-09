'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

type Tab = 'upcoming' | 'results'
const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Results' },
]

/** Upcoming / Results tabs with state in ?tab= (PRD §D.6, design.md §E.8). */
export function FixturesTabs({ upcoming, results }: { upcoming: ReactNode; results: ReactNode }) {
  const [tab, setTab] = useState<Tab>('upcoming')
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({ upcoming: null, results: null })

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('tab')
    if (q === 'results') setTab('results')
  }, [])

  const select = (next: Tab, focus = false) => {
    setTab(next)
    const url = new URL(window.location.href)
    if (next === 'results') url.searchParams.set('tab', 'results')
    else url.searchParams.delete('tab')
    window.history.replaceState(null, '', url)
    if (focus) refs.current[next]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      const i = TABS.findIndex((t) => t.id === tab)
      const next =
        e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length
      select(TABS[next].id, true)
    }
  }

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Fixtures and results">
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el
            }}
            id={`tab-${t.id}`}
            className="tab"
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => select(t.id)}
            onKeyDown={onKeyDown}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id="panel-upcoming" role="tabpanel" aria-labelledby="tab-upcoming" hidden={tab !== 'upcoming'} tabIndex={0}>
        {upcoming}
      </div>
      <div id="panel-results" role="tabpanel" aria-labelledby="tab-results" hidden={tab !== 'results'} tabIndex={0}>
        {results}
      </div>
    </>
  )
}
