'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Badge } from './Basics'
import { SocialIcon } from './SocialIcon'

export type NavItem = { href: string; label: string }
export type Social = { network: string; url: string; label: string }

const isCurrent = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

/** Sticky header with desktop links and the mobile drawer (design.md §E.1, §E.2). */
export function Header({ items, socials }: { items: NavItem[]; socials: Social[] }) {
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  // Close the drawer on navigation.
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    document.body.classList.add('no-scroll')
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('no-scroll')
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Xtreme FC home">
          <Badge size={56} priority />
        </Link>
        <nav className="nav-desktop" aria-label="Main">
          <ul role="list">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  className="nav-link"
                  href={item.href}
                  aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          <Link
            className="btn btn--primary btn--sm header-join"
            href="/join"
            data-track="join_cta_click"
            data-track-location="header"
            aria-current={pathname === '/join' ? 'page' : undefined}
          >
            Join
          </Link>
          <button
            ref={triggerRef}
            type="button"
            className="icon-btn menu-btn"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={24} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="drawer" id="mobile-nav" hidden={!open}>
        <div className="drawer__scrim" onClick={close} aria-hidden="true" />
        <div ref={panelRef} className="drawer__panel" role="dialog" aria-modal="true" aria-label="Site menu">
          <div className="drawer__top">
            <Link href="/" className="brand" aria-label="Xtreme FC home" onClick={() => setOpen(false)}>
              <Badge size={48} />
            </Link>
            <button ref={closeRef} type="button" className="icon-btn" aria-label="Close menu" onClick={close}>
              <X size={24} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile">
            <ul role="list" className="drawer__links">
              {[...items, { href: '/contact', label: 'Contact' }].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="drawer__bottom">
            <Link
              className="btn btn--primary btn--lg"
              href="/join"
              onClick={() => setOpen(false)}
              data-track="join_cta_click"
              data-track-location="drawer"
            >
              Join the club
            </Link>
            {socials.length > 0 && (
              <ul role="list" className="social-list">
                {socials.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" data-social={s.network}>
                      <SocialIcon network={s.network} />
                      <span className="sr-only">{s.label} (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
