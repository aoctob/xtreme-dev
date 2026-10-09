'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { track } from '@/lib/analytics'
import { Icon, type IconName } from './Icon'
import { Button } from './ui'

type Toast = { id: number; msg: string; icon: IconName }
const ToastCtx = createContext<(msg: string, icon?: IconName) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

/** Bottom-centre toasts (kit-app.jsx). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((msg: string, icon: IconName = 'check') => {
    const id = Math.random()
    setToasts((ts) => [...ts.slice(-2), { id, msg, icon }])
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 2600)
  }, [])
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className="toast">
            <Icon name={x.icon} size={18} color="var(--color-primary-ink)" />
            <span>{x.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/** Native share on touch devices, otherwise copy the link. */
export function ShareButton({ title, label = 'Share' }: { title: string; label?: string }) {
  const toast = useToast()
  const share = () => {
    track('share_click')
    const url = location.href
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      navigator.share({ title, url }).catch(() => {})
      return
    }
    navigator.clipboard?.writeText(url).catch(() => {})
    toast('Link copied', 'check')
  }
  return (
    <Button variant="secondary" icon="share-2" iconPosition="left" onClick={share}>
      {label}
    </Button>
  )
}

/** A link-style button that also shows a toast, e.g. the .ics download. */
export function ToastLink({
  href,
  toastText,
  toastIcon = 'check',
  event,
  variant = 'tertiary',
  icon,
  iconPosition,
  download,
  children,
}: {
  href: string
  toastText: string
  toastIcon?: IconName
  event?: string
  variant?: 'primary' | 'secondary' | 'tertiary'
  icon?: IconName
  iconPosition?: 'left' | 'right'
  download?: boolean
  children: ReactNode
}) {
  const toast = useToast()
  return (
    <Button
      variant={variant}
      href={href}
      download={download}
      icon={icon}
      iconPosition={iconPosition}
      onClick={(e) => {
        e.stopPropagation()
        if (event) track(event)
        toast(toastText, toastIcon)
      }}
    >
      {children}
    </Button>
  )
}
