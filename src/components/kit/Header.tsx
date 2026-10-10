'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CLUB_NAME } from '@/lib/constants'
import { Icon } from './Icon'
import { Button, LOGO } from './ui'

export const NAV = [
  { href: '/squad', label: 'Squad' },
  { href: '/results', label: 'Results' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
  { href: '/sponsors', label: 'Sponsors' },
]

const isCurrent = (path: string, href: string) => path === href || path.startsWith(href + '/')

/** Utility bar + floating glass bar (components/navigation/Header.jsx). */
export function Header({ announcement }: { announcement?: string | null }) {
  const path = usePathname() || '/'
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setOpen(false), [path])

  return (
    <header className={'xh' + (scrolled ? ' scrolled' : '')} style={announcement ? undefined : { top: 0 }}>
      {announcement && (
        <div className="xh-util">
          <span />
          <p>
            <span>{announcement}</span>
            <Link href="/join" className="xh-join" data-track="join_cta_click" data-track-location="header">
              Join
            </Link>
          </p>
          <div className="xh-util-r xh-desk">
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      )}
      <div className="xh-outer">
        <div className="xh-bar">
          <Link href="/" aria-label={`${CLUB_NAME} home`} className="xh-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="" width={40} height={40} />
            <span className="xh-name">Xtreme Club</span>
          </Link>
          <nav className="xh-nav xh-desk" aria-label="Main">
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className="xh-link" aria-current={isCurrent(path, l.href) ? 'page' : undefined}>
                {l.label}
                <span />
              </Link>
            ))}
          </nav>
          <div className="xh-right">
            <form action="/search" role="search" className="xh-search xh-desk">
              <Icon name="search" size={18} />
              <input type="search" name="q" placeholder="Search" aria-label="Search the site" />
            </form>
            <Link href="/search" className="xh-search-btn xh-desk" aria-label="Search the site">
              <Icon name="search" size={18} />
            </Link>
            <div className="xh-desk">
              <Button size="small" href="/join" data-track="join_cta_click" data-track-location="header">
                Join
              </Button>
            </div>
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen(true)}
              className="xh-menu"
            >
              <Icon name="menu" size={24} />
            </button>
          </div>
        </div>
      </div>
      {open && <MobileDrawer path={path} onClose={() => setOpen(false)} />}
    </header>
  )
}

function MobileDrawer({ path, onClose }: { path: string; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return (
    <div id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="md-scrim" onClick={onClose} />
      <div className="md-panel">
        <div className="md-close">
          <button type="button" aria-label="Close menu" onClick={onClose} autoFocus>
            <Icon name="x" size={24} />
          </button>
        </div>
        <nav aria-label="Main">
          {[...NAV, { href: '/contact', label: 'Contact' }].map((l) => (
            <Link key={l.href} href={l.href} aria-current={isCurrent(path, l.href) ? 'page' : undefined} onClick={onClose}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="md-foot">
          <form action="/search" role="search" className="xh-search" style={{ width: '100%', display: 'flex' }}>
            <Icon name="search" size={18} />
            <input type="search" name="q" placeholder="Search" aria-label="Search the site" style={{ display: 'block' }} />
          </form>
          <Button size="large" fullWidth href="/join" data-track="join_cta_click" data-track-location="drawer">
            Join
          </Button>
        </div>
      </div>
    </div>
  )
}
