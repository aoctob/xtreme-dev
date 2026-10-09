'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { track } from '@/lib/analytics'

/** Web Share API with a copy-link fallback (PRD §D.5, §F.8). */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    track('share_click')
    const url = window.location.href.split('?')[0]
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 3000)
    } catch {
      // User cancelled the share sheet.
    }
  }
  return (
    <>
      <button type="button" className="btn btn--secondary btn--sm" onClick={share}>
        <Share2 size={16} aria-hidden="true" />
        Share
      </button>
      <span role="status" className="t-caption">
        {copied ? 'Link copied' : ''}
      </span>
    </>
  )
}
