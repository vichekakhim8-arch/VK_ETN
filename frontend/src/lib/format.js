import { lang } from './i18n'

export const money = (n, currency = 'USD') =>
  currency === 'KHR'
    ? Math.round(Number(n || 0)).toLocaleString('en-US') + ' ៛'
    : '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const date = (d, withTime = false) =>
  new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) })

export function timeAgo(d) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(d)) / 1000))
  const km = lang.value === 'km'
  const units = [[31536000, km ? 'ឆ្នាំ' : 'y'], [2592000, km ? 'ខែ' : 'mo'], [86400, km ? 'ថ្ងៃ' : 'd'], [3600, km ? 'ម៉ោង' : 'h'], [60, km ? 'នាទី' : 'min']]
  for (const [sec, u] of units) if (s >= sec) return Math.floor(s / sec) + (km ? ' ' + u + 'មុន' : u + ' ago')
  return km ? 'ឥឡូវនេះ' : 'just now'
}

/** Localised field: "text" or { en, km } */
export const loc = (v) => (!v ? '' : typeof v === 'string' ? v : v[lang.value] || v.en || '')

export function downloadFile(name, content, type = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
