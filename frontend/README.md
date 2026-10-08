# VK_ETN Frontend — Vue 3 + Vite + Tailwind CSS

Client-side only web application built with **Vue 3 (Composition API, `<script setup>`)**, **JavaScript**, **Tailwind CSS + custom CSS** and **Vite**.
There is **no backend**. All data (products, orders, users, reviews, settings) is stored in the **browser** (IndexedDB) by
`public/vk/js/localdb.js`, which is shared with the main storefront. Store images are plain files in `public/vk/img/`.

## 1. Folder structure

```
frontend/
├── public/                         # static assets (copied as-is)
│   ├── favicon.svg
│   └── images/
│       ├── auth.jpg
│       └── hero.jpg
├── src/
│   ├── main.js                     # app entry: i18n → router (auth init) → mount
│   ├── App.vue                     # root component (RouterView + toasts)
│   ├── style.css                   # Tailwind layers + custom CSS
│   ├── router/
│   │   └── index.js                # routes + auth guard (waits for auth init)
│   ├── components/
│   │   ├── AppLogo.vue
│   │   ├── auth/AuthShell.vue      # split layout: image left, form right
│   │   ├── khqr/KhqrCard.vue       # KHQR card UI
│   │   ├── layout/AppLayout.vue    # collapsible sidebar + header
│   │   └── ui/                     # BaseInput, LangSwitch, ThemeToggle, StatusBadge, EmptyState, ToastHost
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── NotFoundView.vue
│   │   ├── auth/                   # Auth UI pages
│   │   │   ├── LoginView.vue
│   │   │   └── RegisterView.vue
│   │   ├── health/                 # System status / health UI
│   │   │   └── HealthView.vue
│   │   ├── khqr/
│   │   │   └── check/              # KHQR payment check UI
│   │   │       └── KhqrCheckView.vue
│   │   ├── reviews/                # Reviews UI
│   │   │   └── ReviewsView.vue
│   │   ├── store/
│   │   │   └── [key]/              # Dynamic store page  → /store/:key
│   │   │       └── StoreKeyView.vue
│   │   └── users/                  # Users list / profile UI
│   │       ├── UsersView.vue
│   │       └── ProfileView.vue
│   └── lib/                        # helpers / API fetch utilities
│       ├── api.js                  # data access via the browser DB (localdb.js), ApiError, ping()
│       ├── auth.js                 # auth state composable (login/register/logout/initAuth)
│       ├── i18n.js                 # English / Khmer reactive translations
│       ├── khqr.js                 # KHQR (EMVCo) builder + PNG download
│       ├── format.js               # money, dates, file download
│       ├── storage.js              # safe localStorage
│       ├── toast.js                # toast notifications
│       ├── useAsync.js             # async data composable
│       └── useClickOutside.js
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── .env.example
```

| Route | View | Browser DB data |
|---|---|---|
| `/login`, `/register` | `views/auth/*` | `POST /api/auth` |
| `/health` | `views/health/HealthView.vue` | `GET /api/health`, `/api/store`, `/api/auth` |
| `/khqr/check` | `views/khqr/check/KhqrCheckView.vue` | `POST /api/khqr/check` |
| `/reviews` | `views/reviews/ReviewsView.vue` | `GET /api/store`, `POST/DELETE /api/reviews` |
| `/store/:key` | `views/store/[key]/StoreKeyView.vue` | `GET /api/store` |
| `/users` (admin) | `views/users/UsersView.vue` | `GET/DELETE /api/users` |
| `/profile` | `views/users/ProfileView.vue` | `PATCH /api/users` |

## 2. Setup & installation

Requirements: **Node.js 18+** and npm (or pnpm).

```bash
# 1) go to the frontend folder
cd frontend

# 2) install dependencies
npm install          # or: pnpm install

# 3) (optional) configure environment
cp .env.example .env # optional: change base path / output folder

# 4) start the dev server  → http://localhost:5173/app/
npm run dev          # or: pnpm dev

# 5) lint
npm run lint

# 6) production build (static files → ../public/app, served at /app)
npm run build
npm run preview
```

### Creating the same stack from scratch

```bash
npm create vite@latest my-app -- --template vue
cd my-app
npm install
npm install vue-router
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p      # creates tailwind.config.js + postcss.config.js
```

Then set `content: ['./index.html', './src/**/*.{vue,js}']` in `tailwind.config.js` and put the three `@tailwind` directives at the top of `src/style.css` (see this project).

## 3. Tailwind integration (where to look)

- `src/main.js` imports `./style.css` once.
- `src/style.css` contains `@tailwind base; @tailwind components; @tailwind utilities;`, reusable classes built with `@apply` (`.btn-primary`, `.input`, `.card` …) and plain custom CSS (transitions, KHQR card).
- `tailwind.config.js` defines the brand colour palette, fonts (Inter + Kantumruy Pro for Khmer), dark mode (`class`) and the 5px border radius.

## 4. Sample single-file component

`src/components/ui/BaseInput.vue` — a `<script setup>` component using `defineModel`, `defineProps`, computed state and Tailwind utilities (icon that becomes active on focus, password reveal). Used like:

```vue
<BaseInput v-model="form.email" type="email" icon="fa-envelope" label="Email" required />
```

## 5. Notes

- Same browser database and session keys as the main site (`vk_token`, `vk_user`, `vk_lang`, `vk_theme`), so data, login and language are shared.
- KHQR payment check runs in demo mode (real Bakong verification needs a server).
- Auth is initialised once at startup; the router waits for it before checking protected routes (no false redirects to `/login`).
- Language switching (English ↔ ខ្មែរ) is instant and never reloads the page.
