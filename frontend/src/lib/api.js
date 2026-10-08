// Data utility for VK_ETN — frontend only, no backend (browser database)
import { storage } from './storage'

export const TOKEN_KEY = 'vk_token'
export const USER_KEY = 'vk_user'

export const endpoints = {
  auth: '/api/auth',
  health: '/api/health',
  khqrCheck: '/api/khqr/check',
  reviews: '/api/reviews',
  store: '/api/store',
  storeKey: (key) => `/api/store/${encodeURIComponent(key)}`,
  users: '/api/users',
}

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

let unauthorizedHandler = null
/** Called when the server explicitly rejects our token (401) on an authenticated request. */
export function onUnauthorized(fn) {
  unauthorizedHandler = fn
}

export function getToken() {
  return storage.get(TOKEN_KEY, '')
}

/**
 * api('/api/store') · api('/api/reviews', { method: 'POST', body: {...} })
 * No backend: requests are answered by the shared browser database (public/vk/js/localdb.js).
 */
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const db = window.VK_DB
  if (!db) throw new ApiError('Browser database not loaded', 0)
  const token = getToken()
  const res = await db.request(path, { method, body, token: auth ? token : '' })
  const data = res.data
  if (res.status >= 400) {
    if (res.status === 401 && auth && token && token === getToken() && !path.startsWith(endpoints.auth)) {
      unauthorizedHandler?.()
    }
    throw new ApiError(data?.error || 'Request failed', res.status, data)
  }
  return data
}

/** Measure a local database round-trip (used by the Status page). */
export async function ping(path) {
  const start = performance.now()
  try {
    const res = await window.VK_DB.request(path, { token: getToken() })
    return { ok: res.status < 500, status: res.status, ms: Math.max(0, Math.round(performance.now() - start)) }
  } catch {
    return { ok: false, status: 0, ms: Math.round(performance.now() - start) }
  }
}
