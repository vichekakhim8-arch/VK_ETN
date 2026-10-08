<script setup>
import { reactive, ref } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { toast } from '@/lib/toast'

const { t } = useI18n()
const { user, updateProfile } = useAuth()

const form = reactive({ name: user.value.name, email: user.value.email, phone: user.value.phone || '', password: '', confirm: '' })
const saving = ref(false)

function resize(file, max = 320) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, max / img.width)
      const c = Object.assign(document.createElement('canvas'), { width: img.width * s, height: img.height * s })
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

async function changePhoto(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  try {
    await updateProfile({ avatar: await resize(file) })
    toast(t('saved'))
  } catch (err) {
    toast(err.message, 'error')
  }
}

async function save() {
  if (form.password && form.password.length < 6) return toast(t('passShort'), 'error')
  if (form.password !== form.confirm) return toast(t('passMismatch'), 'error')
  saving.value = true
  try {
    await updateProfile({ name: form.name, email: form.email, phone: form.phone, password: form.password || undefined })
    form.password = form.confirm = ''
    toast(t('saved'))
  } catch (e) {
    toast(e.status === 409 ? t('emailExists') : e.message, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="card card-pad mx-auto max-w-3xl space-y-6" @submit.prevent="save">
    <div class="flex flex-wrap items-center gap-4">
      <div class="relative">
        <img v-if="user.avatar" :src="user.avatar" class="h-20 w-20 rounded-full object-cover ring-4 ring-brand-100 dark:ring-brand-900" alt="" />
        <span v-else class="grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-2xl text-white ring-4 ring-brand-100 dark:ring-brand-900">{{ user.name[0] }}</span>
        <label class="absolute bottom-0 right-0 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white text-brand-600 shadow dark:bg-slate-800" :title="t('changePhoto')">
          <i class="fa-solid fa-camera text-xs"></i><input type="file" accept="image/*" class="hidden" @change="changePhoto" />
        </label>
      </div>
      <div>
        <p class="text-lg font-semibold">{{ user.name }}</p>
        <p class="text-sm muted">{{ user.email }}</p>
        <span class="chip mt-1 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">{{ user.role }}</span>
      </div>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <BaseInput v-model="form.name" icon="fa-user" :label="t('name')" required />
      <BaseInput v-model="form.email" type="email" icon="fa-envelope" :label="t('email')" required />
      <BaseInput v-model="form.phone" icon="fa-phone" :label="t('phone')" />
      <div class="hidden sm:block"></div>
      <BaseInput v-model="form.password" type="password" icon="fa-lock" :label="t('newPassword')" :placeholder="t('leaveBlank')" autocomplete="new-password" />
      <BaseInput v-model="form.confirm" type="password" icon="fa-shield-halved" :label="t('confirmPassword')" autocomplete="new-password" />
    </div>
    <button class="btn-primary" :disabled="saving"><i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>{{ t('updateProfile') }}</button>
  </form>
</template>
