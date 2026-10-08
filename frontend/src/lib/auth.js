// Auth state composable (shares the same session keys as the main VK_ETN site)
import { reactive, computed, readonly } from 'vue'
import { api, endpoints, getToken, onUnauthorized, TOKEN_KEY, USER_KEY } from './api'
import { storage } from './storage'

const state = reactive({
  token: getToken(),
  user: getToken() ? storage.getJSON(USER_KEY) : null,
  ready: false,
})

function persist(user, token) {
  state.user = user
  state.token = token
  storage.setJSON(USER_KEY, user)
  storage.set(TOKEN_KEY, token)
}

export function logout() {
  state.user = null
  state.token = ''
  storage.remove(USER_KEY)
  storage.remove(TOKEN_KEY)
}

// server explicitly rejected the token -> genuine invalid session
onUnauthorized(() => logout())

async function verify() {
  const token = state.token
  if (!token) return
  try {
    const data = await api(endpoints.auth)
    if (token !== state.token || !data || typeof data !== 'object' || !('user' in data)) return
    if (data.user && data.user.id) persist(data.user, token)
    else if (data.user === null) logout() // explicit "not a valid session"
  } catch {
    // offline / server error: keep the stored session
  }
}

let initPromise = null
/** App start: restore -> verify once -> ready. The router awaits this before protected checks. */
export function initAuth() {
  if (!initPromise) initPromise = verify().finally(() => { state.ready = true })
  return initPromise
}

export async function login(email, password) {
  const r = await api(endpoints.auth, { method: 'POST', body: { action: 'login', email, password }, auth: false })
  persist(r.user, r.token)
  return r.user
}

export async function register({ name, email, phone, password }) {
  const r = await api(endpoints.auth, { method: 'POST', body: { action: 'register', name, email, phone, password }, auth: false })
  persist(r.user, r.token)
  return r.user
}

export async function updateProfile(patch) {
  const r = await api(endpoints.users, { method: 'PATCH', body: patch })
  if (r?.user) persist(r.user, state.token)
  return r?.user
}

export function useAuth() {
  return {
    state: readonly(state),
    user: computed(() => state.user),
    isAuthenticated: computed(() => !!state.user),
    isAdmin: computed(() => state.user?.role === 'admin'),
    login,
    register,
    logout,
    updateProfile,
  }
}
