import { onBeforeUnmount, onMounted } from 'vue'

/** Calls `handler` when a pointer-down happens outside `elRef`. */
export function useClickOutside(elRef, handler) {
  const listener = (e) => {
    if (elRef.value && !elRef.value.contains(e.target)) handler(e)
  }
  onMounted(() => document.addEventListener('pointerdown', listener))
  onBeforeUnmount(() => document.removeEventListener('pointerdown', listener))
}
