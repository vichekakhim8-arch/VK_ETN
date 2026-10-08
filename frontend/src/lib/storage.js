// Safe localStorage wrapper (falls back to memory when storage is blocked)
const memory = new Map()

function available() {
  try {
    const k = '__vk_test'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

const ok = typeof window !== 'undefined' && available()

export const storage = {
  get(key, fallback = null) {
    const v = ok ? window.localStorage.getItem(key) : memory.get(key)
    return v === null || v === undefined ? fallback : v
  },
  set(key, value) {
    if (ok) window.localStorage.setItem(key, String(value))
    else memory.set(key, String(value))
  },
  remove(key) {
    if (ok) window.localStorage.removeItem(key)
    else memory.delete(key)
  },
  getJSON(key, fallback = null) {
    try {
      const v = this.get(key)
      return v ? JSON.parse(v) : fallback
    } catch {
      return fallback
    }
  },
  setJSON(key, value) {
    this.set(key, JSON.stringify(value))
  },
}
