<script setup>
import { computed } from 'vue'

const props = defineProps({ status: { type: String, default: '' } })

const styles = {
  ok: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  operational: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  completed: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  paid: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  admin: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  processing: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  degraded: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  down: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
}
const cls = computed(() => styles[String(props.status).toLowerCase()] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')
</script>

<template>
  <span class="chip" :class="cls"><slot>{{ status }}</slot></span>
</template>
