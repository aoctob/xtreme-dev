// Small mark in the admin nav, replacing the Payload icon.
export default function Icon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/emblem-96.webp"
      alt="Xtreme Club"
      width={28}
      height={28}
      style={{ display: 'block', borderRadius: '50%', objectFit: 'cover' }}
    />
  )
}
