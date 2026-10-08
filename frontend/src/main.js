// Shared browser database (no backend). Same file the main storefront uses.
import '../../public/vk/js/localdb.js'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initI18n } from './lib/i18n'
import './style.css'

// 1. restore saved language (before first render -> no English-first flash)
initI18n()

// 2. create the app + router (the router waits for auth initialization in its guard)
const app = createApp(App)
app.use(router)

// 3. mount once the first navigation (incl. auth check) is resolved
router.isReady().then(() => app.mount('#app'))
