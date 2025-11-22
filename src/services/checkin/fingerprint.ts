export async function computeDeviceFingerprint(): Promise<string> {
  try {
    const ua = navigator.userAgent
    const lang = navigator.language
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    const res = `${screen.width}x${screen.height}@${window.devicePixelRatio}`
    const canvas = document.createElement('canvas')
    canvas.width = 200; canvas.height = 50
    const ctx = canvas.getContext('2d')!
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(0, 0, 200, 50)
    ctx.fillStyle = '#000'
    ctx.fillText(`${ua}|${lang}|${tz}|${res}`, 4, 4)
    const data = canvas.toDataURL()
    const buffer = new TextEncoder().encode(`${ua}|${lang}|${tz}|${res}|${data}`)
    const digest = await crypto.subtle.digest('SHA-256', buffer)
    const bytes = Array.from(new Uint8Array(digest))
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return `${navigator.userAgent}|fallback`
  }
}