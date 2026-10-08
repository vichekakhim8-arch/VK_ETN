import { reactive } from 'vue'

export const toasts = reactive([])
let id = 0

export function toast(message, type = 'success', ms = 3000) {
  const item = { id: ++id, message, type }
  toasts.push(item)
  setTimeout(() => {
    const i = toasts.indexOf(item)
    if (i > -1) toasts.splice(i, 1)
  }, ms)
}
