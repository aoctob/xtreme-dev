/**
 * Browser only. Re-encodes a photo as a JPEG no wider or taller than `maxSide`, so three
 * phone-camera images fit in one request under Vercel's 4.5 MB body limit. Card text stays
 * readable at 1600 px. Returns the original file when it is already small enough.
 */
export async function shrinkImage(file: File, { maxSide = 1600, maxBytes = 1.2 * 1024 * 1024, quality = 0.85 } = {}): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size <= maxBytes) {
    bitmap.close()
    return file
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available')
  // White behind transparent PNGs, which JPEG would otherwise turn black.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  let q = quality
  let blob: Blob | null = null
  while (q >= 0.5) {
    blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', q))
    if (blob && blob.size <= maxBytes) break
    q -= 0.1
  }
  if (!blob) throw new Error('Could not read the image')
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
}
