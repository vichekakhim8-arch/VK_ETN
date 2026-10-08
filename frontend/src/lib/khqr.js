// KHQR (EMVCo merchant-presented QR, Bakong) helpers — pure client-side
import QRCode from 'qrcode'

const tlv = (tag, value) => tag + String(String(value).length).padStart(2, '0') + value

export function crc16(str) {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    crc &= 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function buildKhqr({ accountId = 'vk_etn@aclb', merchantName = 'VK ETN', city = 'Phnom Penh', currency = 'USD', amount = 0, billNumber = '', storeLabel = 'VK_ETN' } = {}) {
  const cur = currency === 'KHR' ? '116' : '840'
  const amt = currency === 'KHR' ? String(Math.round(amount)) : Number(amount).toFixed(2)
  let s = tlv('00', '01') + tlv('01', amount ? '12' : '11')
  s += tlv('29', tlv('00', String(accountId).slice(0, 32)))
  s += tlv('52', '5999') + tlv('53', cur)
  if (amount) s += tlv('54', amt)
  s += tlv('58', 'KH') + tlv('59', String(merchantName).slice(0, 25)) + tlv('60', String(city).slice(0, 15))
  let add = ''
  if (billNumber) add += tlv('01', String(billNumber).slice(0, 25))
  if (storeLabel) add += tlv('03', String(storeLabel).slice(0, 25))
  if (add) s += tlv('62', add)
  s += tlv('99', tlv('00', String(Date.now())))
  s += '6304'
  return s + crc16(s)
}

export const qrDataUrl = (text) => QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 0, width: 480 })

/** Render the full KHQR card to a PNG and download it. */
export function downloadKhqrPng({ payload, merchantName, amount, currency, fileName = 'KHQR.png' }) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' })
  const n = qr.modules.size
  const W = 600
  const cell = Math.floor(470 / n)
  const size = cell * n
  const H = 300 + size + 70
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath() }
  g.fillStyle = '#fff'; rr(0, 0, W, H, 30); g.fill()
  g.save(); rr(0, 0, W, H, 30); g.clip()
  g.fillStyle = '#E1232E'; g.fillRect(0, 0, W, 110)
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(W, 62); g.lineTo(W, 111); g.lineTo(W - 49, 111); g.closePath(); g.fill()
  g.restore()
  g.fillStyle = '#fff'; g.font = '700 44px Inter, Arial'; g.textAlign = 'center'; g.fillText('KHQR', W / 2, 72)
  const amt = currency === 'KHR' ? Math.round(amount).toLocaleString('en-US') : Number(amount).toFixed(2)
  g.textAlign = 'left'; g.fillStyle = '#222'; g.font = '400 26px Inter, Arial'; g.fillText(merchantName, 50, 165)
  g.fillStyle = '#000'; g.font = '600 46px Inter, Arial'; g.fillText(amt, 50, 225)
  const aw = g.measureText(amt).width
  g.font = '500 24px Inter, Arial'; g.fillText(currency, 62 + aw, 225)
  g.strokeStyle = 'rgba(0,0,0,.2)'; g.setLineDash([10, 8]); g.lineWidth = 3; g.beginPath(); g.moveTo(0, 262); g.lineTo(W, 262); g.stroke(); g.setLineDash([])
  const ox = (W - size) / 2, oy = 290
  g.fillStyle = '#000'
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (qr.modules.get(r, col)) g.fillRect(ox + col * cell, oy + r * cell, cell, cell)
  g.beginPath(); g.arc(W / 2, oy + size / 2, 34, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill()
  g.beginPath(); g.arc(W / 2, oy + size / 2, 27, 0, Math.PI * 2); g.fillStyle = '#000'; g.fill()
  g.fillStyle = '#fff'; g.font = '600 30px Inter, Arial'; g.textAlign = 'center'; g.fillText(currency === 'KHR' ? '៛' : '$', W / 2, oy + size / 2 + 11)
  return new Promise((resolve) => {
    c.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      resolve()
    }, 'image/png')
  })
}
