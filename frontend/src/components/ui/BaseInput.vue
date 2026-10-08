<script setup>
import { computed, ref } from 'vue'

const model = defineModel({ type: [String, Number], default: '' })
const props = defineProps({
  label: { type: String, default: '' },
  icon: { type: String, default: '' }, // Font Awesome name, e.g. "fa-envelope"
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  autocomplete: { type: String, default: undefined },
})

const focused = ref(false)
const reveal = ref(false)
const inputType = computed(() => (props.type === 'password' && reveal.value ? 'text' : props.type))
const filled = computed(() => model.value !== '' && model.value !== null && model.value !== undefined)
</script>

<template>
  <label class="block">
    <span v-if="label" class="label">{{ label }}<span v-if="required" class="text-red-500"> *</span></span>
    <span class="relative flex items-center">
      <i
        v-if="icon"
        class="fa-solid pointer-events-none absolute left-3 w-4 text-center text-[13px] transition-colors"
        :class="[icon, focused ? 'text-brand-600 dark:text-brand-400' : filled ? 'text-brand-500/80' : 'text-slate-400']"
      ></i>
      <input
        v-model="model"
        :type="inputType"
        :placeholder="placeholder"
        :required="required"
        :autocomplete="autocomplete"
        class="input"
        :class="[icon ? 'pl-9' : '', type === 'password' ? 'pr-10' : '']"
        @focus="focused = true"
        @blur="focused = false"
      />
      <button
        v-if="type === 'password'"
        type="button"
        tabindex="-1"
        class="absolute right-1.5 grid h-8 w-8 place-items-center rounded text-slate-400 transition hover:text-brand-600"
        @click="reveal = !reveal"
      >
        <i class="fa-regular text-[13px]" :class="reveal ? 'fa-eye-slash' : 'fa-eye'"></i>
      </button>
    </span>
  </label>
</template>
