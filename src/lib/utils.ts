export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const cn = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(' ')

export const rupiah = (n: number) =>
  'Rp\u00a0' + Math.round(n || 0).toLocaleString('id-ID')

export const shortRupiah = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 1e9) return 'Rp\u00a0' + (n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M'
  if (abs >= 1e6) return 'Rp\u00a0' + (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt'
  return rupiah(n)
}

/** Today as YYYY-MM-DD in local time. */
export const todayISO = () => toISODate(new Date())

export const toISODate = (d: Date) => {
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const parseISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export const addDays = (iso: string, days: number) => {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Whole days from today until the given date (negative if past). */
export const daysUntil = (iso: string) => {
  const a = parseISODate(todayISO()).getTime()
  const b = parseISODate(iso).getTime()
  return Math.round((b - a) / 86400000)
}

export const fmtDate = (iso?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? parseISODate(iso).toLocaleDateString('id-ID', opts) : '-'

export const fmtLongDate = (iso?: string) =>
  fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const relDay = (iso: string) => {
  const d = daysUntil(iso)
  if (d === 0) return 'Hari ini'
  if (d === 1) return 'Besok'
  if (d === -1) return 'Kemarin'
  if (d < 0) return `${-d} hari lalu`
  return `${d} hari lagi`
}

/** Resize an image file and return a JPEG data URL (keeps storage small). */
export function compressImage(file: File, maxSize = 1400, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function downloadFile(name: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toCSV(rows: (string | number)[][]) {
  return rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

/** Normalise an Indonesian phone number into wa.me format (62xxxx). */
export const waNumber = (phone: string) => {
  let p = phone.replace(/[^\d]/g, '')
  if (p.startsWith('0')) p = '62' + p.slice(1)
  return p
}

export const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0)
