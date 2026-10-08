import { ref, shallowRef } from 'vue'

/** const { data, error, loading, run } = useAsync(() => api('/api/store')) */
export function useAsync(fn, { immediate = true, initial = null } = {}) {
  const data = shallowRef(initial)
  const error = ref(null)
  const loading = ref(false)

  async function run(...args) {
    loading.value = true
    error.value = null
    try {
      data.value = await fn(...args)
      return data.value
    } catch (e) {
      error.value = e
      return null
    } finally {
      loading.value = false
    }
  }

  if (immediate) run()
  return { data, error, loading, run }
}
