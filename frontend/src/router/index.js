import { createRouter, createWebHistory } from 'vue-router'
import { initAuth, useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { toast } from '@/lib/toast'
import AppLayout from '@/components/layout/AppLayout.vue'

const routes = [
  // ----- Auth UI (src/views/auth) -----
  { path: '/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { guest: true, title: 'login' } },
  { path: '/register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { guest: true, title: 'register' } },

  // ----- App shell -----
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: 'overview' } },
      { path: 'health', name: 'health', component: () => import('@/views/health/HealthView.vue'), meta: { title: 'health' } },
      { path: 'khqr/check', name: 'khqr-check', component: () => import('@/views/khqr/check/KhqrCheckView.vue'), meta: { title: 'khqrCheck' } },
      { path: 'reviews', name: 'reviews', component: () => import('@/views/reviews/ReviewsView.vue'), meta: { title: 'reviews' } },
      { path: 'store/:key', name: 'store', component: () => import('@/views/store/[key]/StoreKeyView.vue'), props: (route) => ({ collection: route.params.key }), meta: { title: 'store' } },
      { path: 'users', name: 'users', component: () => import('@/views/users/UsersView.vue'), meta: { admin: true, title: 'users' } },
      { path: 'profile', name: 'profile', component: () => import('@/views/users/ProfileView.vue'), meta: { auth: true, title: 'profile' } },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (to, from, saved) => saved || (to.path !== from.path ? { top: 0 } : false),
})

// Protected routes: wait for auth initialization -> allow / redirect (no loops)
router.beforeEach(async (to) => {
  await initAuth()
  const { isAuthenticated, isAdmin } = useAuth()

  if (to.meta.admin && !isAdmin.value) {
    toast(t('adminOnly'), 'info')
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.auth && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guest && isAuthenticated.value) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : ''
    if (redirect.startsWith('/users') && !isAdmin.value) return true // let a customer sign in as admin
    return redirect.startsWith('/') ? redirect : { name: 'home' }
  }
  return true
})

router.afterEach((to) => {
  document.title = (to.meta.title ? t(to.meta.title) + ' · ' : '') + 'VK_ETN'
})

export default router
