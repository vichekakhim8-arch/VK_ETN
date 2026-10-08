<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLogo from '@/components/AppLogo.vue'
import LangSwitch from '@/components/ui/LangSwitch.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { storage } from '@/lib/storage'
import { useClickOutside } from '@/lib/useClickOutside'

const { t } = useI18n()
const { user, isAdmin, logout } = useAuth()
const route = useRoute()
const router = useRouter()

const collapsed = ref(storage.get('vk_fe_sidebar') === '1')
const mobileOpen = ref(false)
const menuOpen = ref(false)
const menuRef = ref(null)
useClickOutside(menuRef, () => (menuOpen.value = false))
watch(collapsed, (v) => storage.set('vk_fe_sidebar', v ? '1' : '0'))
watch(() => route.fullPath, () => { mobileOpen.value = false; menuOpen.value = false })

const nav = computed(() => [
  { to: '/', icon: 'fa-gauge-high', label: 'overview', exact: true },
  { to: '/health', icon: 'fa-heart-pulse', label: 'health' },
  { to: '/khqr/check', icon: 'fa-qrcode', label: 'khqrCheck' },
  { to: '/reviews', icon: 'fa-comments', label: 'reviews' },
  { to: '/store/products', icon: 'fa-database', label: 'store', match: '/store' },
  ...(isAdmin.value ? [{ to: '/users', icon: 'fa-users', label: 'users' }] : []),
])
const active = (item) => (item.exact ? route.path === item.to : route.path.startsWith(item.match || item.to))
const title = computed(() => t(route.meta.title || 'overview'))

function toggleSidebar() {
  if (window.innerWidth < 1024) mobileOpen.value = !mobileOpen.value
  else collapsed.value = !collapsed.value
}
function doLogout() {
  logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen">
    <Transition name="fade">
      <div v-if="mobileOpen" class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" @click="mobileOpen = false"></div>
    </Transition>

    <!-- Sidebar -->
    <aside
      class="sidebar fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      :class="[collapsed ? 'collapsed lg:w-[76px]' : '', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
    >
      <div class="flex h-16 items-center overflow-hidden border-b border-slate-200 px-4 dark:border-slate-800">
        <AppLogo size="sm" />
      </div>
      <nav class="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
        <p class="sidebar-label px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-slate-400">{{ t('modules') }}</p>
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :title="collapsed ? t(item.label) : ''"
          class="flex h-10 items-center gap-3 rounded px-3 text-[13.5px] font-medium transition"
          :class="active(item) ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800'"
        >
          <i class="fa-solid w-5 text-center" :class="item.icon"></i>
          <span class="sidebar-label">{{ t(item.label) }}</span>
        </RouterLink>
      </nav>
      <div class="border-t border-slate-200 p-3 dark:border-slate-800">
        <a href="/" class="flex h-10 items-center gap-3 rounded px-3 text-[13.5px] text-slate-600 transition hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-slate-800">
          <i class="fa-solid fa-store w-5 text-center"></i><span class="sidebar-label">{{ t('mainSite') }}</span>
        </a>
      </div>
    </aside>

    <!-- Main -->
    <div class="transition-[padding] duration-300" :class="collapsed ? 'lg:pl-[76px]' : 'lg:pl-[250px]'">
      <header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 sm:px-6">
        <button class="grid h-10 w-10 place-items-center rounded border border-slate-200 transition hover:border-brand-500 dark:border-slate-700" @click="toggleSidebar">
          <i class="fa-solid fa-bars-staggered"></i>
        </button>
        <h1 class="truncate text-base font-semibold sm:text-lg">{{ title }}</h1>
        <div class="ml-auto flex items-center gap-2">
          <LangSwitch />
          <ThemeToggle />
          <div v-if="user" ref="menuRef" class="relative">
            <button class="flex items-center gap-2 rounded border border-slate-200 p-1 pr-2.5 transition hover:border-brand-500 dark:border-slate-700" @click="menuOpen = !menuOpen">
              <img v-if="user.avatar" :src="user.avatar" class="h-8 w-8 rounded-full object-cover" alt="" />
              <span v-else class="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm text-white">{{ user.name?.[0] }}</span>
              <span class="hidden text-[13px] font-medium md:block">{{ user.name }}</span>
            </button>
            <Transition name="pop">
              <div v-if="menuOpen" class="absolute right-0 top-12 w-56 rounded border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div class="mb-1 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p class="truncate text-sm font-medium">{{ user.name }}</p>
                  <p class="truncate text-xs text-slate-500">{{ user.email }}</p>
                </div>
                <RouterLink to="/profile" class="flex items-center gap-3 rounded px-3 py-2 text-[13px] hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-regular fa-user w-4 text-brand-600"></i>{{ t('profile') }}</RouterLink>
                <button class="flex w-full items-center gap-3 rounded px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" @click="doLogout"><i class="fa-solid fa-arrow-right-from-bracket w-4"></i>{{ t('logout') }}</button>
              </div>
            </Transition>
          </div>
          <RouterLink v-else :to="{ name: 'login', query: { redirect: route.fullPath } }" class="btn-primary">{{ t('login') }}</RouterLink>
        </div>
      </header>
      <main class="p-4 sm:p-6 lg:p-8">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
