'use client'

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

/* One shared in-view watcher (scroll + a light poll), as in kit-core.jsx. */
type Pending = { el: Element; cb: () => void }
const pending = new Set<Pending>()
let started = false

function checkInView() {
  const vh = window.innerHeight
  pending.forEach((p) => {
    if (!p.el.isConnected) {
      pending.delete(p)
      return
    }
    if (p.el.getBoundingClientRect().top < vh * 0.9) {
      pending.delete(p)
      p.cb()
    }
  })
}

export function onInView(el: Element, cb: () => void): () => void {
  if (!started) {
    started = true
    setInterval(checkInView, 250)
    window.addEventListener('scroll', checkInView, { passive: true })
    window.addEventListener('resize', checkInView)
  }
  const p = { el, cb }
  pending.add(p)
  requestAnimationFrame(checkInView)
  setTimeout(checkInView, 30)
  return () => {
    pending.delete(p)
  }
}

type RevealProps = {
  i?: number
  as?: ElementType
  className?: string
  style?: CSSProperties
  children?: ReactNode
  [key: string]: unknown
}

/** Fade-up once when scrolled into view, staggered 60 ms (design.md §G). */
export function Reveal({ i = 0, as: Tag = 'div', className = '', style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => (ref.current ? onInView(ref.current, () => setVis(true)) : undefined), [])
  return (
    <Tag
      ref={ref}
      className={'rv ' + (vis ? 'in ' : '') + className}
      style={{ transitionDelay: vis ? Math.min(i, 5) * 60 + 'ms' : '0ms', ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** 800 ms one-time count-up; screen readers get the final value. */
export function CountUp({ value, dur = 800 }: { value: number; dur?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [v, setV] = useState(0)
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined
    const off = ref.current
      ? onInView(ref.current, () => {
          if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setV(value)
            return
          }
          const t0 = Date.now()
          iv = setInterval(() => {
            const p = Math.min(1, (Date.now() - t0) / dur)
            setV(Math.round(value * (1 - Math.pow(1 - p, 3))))
            if (p >= 1) clearInterval(iv)
          }, 16)
        })
      : undefined
    return () => {
      off?.()
      clearInterval(iv)
    }
  }, [value, dur])
  return (
    <span ref={ref}>
      <span aria-hidden="true">{v}</span>
      <span className="sr">{value}</span>
    </span>
  )
}

/** A digit that rolls in when it changes. */
export function Roll({ v }: { v: string | number }) {
  return (
    <span className="roll-w" aria-hidden="true">
      <span key={String(v)} className="roll">
        {v}
      </span>
    </span>
  )
}

/** Current time, refreshed every `ms`. Starts at 0 on the server to avoid hydration drift. */
export function useNow(ms = 1000): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(Date.now())
    const t = setInterval(() => setN(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return n
}
