// Shown on /admin/login (and other unauthenticated admin screens) in place of the Payload logo.
export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/emblem-160.webp"
        alt=""
        width={56}
        height={56}
        style={{ display: 'block', borderRadius: '50%', objectFit: 'cover' }}
      />
      <span
        style={{
          fontWeight: 800,
          fontSize: 22,
          lineHeight: 1,
          letterSpacing: '.01em',
          color: 'var(--theme-text)',
          whiteSpace: 'nowrap',
        }}
      >
        Xtreme Club
      </span>
    </div>
  )
}
