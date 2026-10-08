import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'

// Replaces the old Next.js hosting layer:
//   /                     -> store SPA (index.html, copy of public/vk/index.html)
//   /app, /app/*          -> dashboard SPA (public/app/index.html)
//   any extensionless URL -> store SPA deep link (/shop, /product/1, /admin/...)
//   GET /api/health       -> { ok: true, backend: false } (compat probe, no backend)
// Static assets under /vk/* and /app/* keep working via the public/ directory.
function spaHost() {
  const sendJson = (res, status, body) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.end(JSON.stringify(body))
  }

  const rewrite = (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    const url = (req.url || '/').split('?')[0]

    if (url === '/api/health') return sendJson(res, 200, { ok: true, backend: false })
    if (url.startsWith('/api/')) return sendJson(res, 404, { error: 'Not found' })

    // Vite's own module URLs (/@vite/client, /@vite/env, /@id/*, /@fs/*, ...) have no
    // extension — never rewrite them, or index.html gets fed to JS import-analysis.
    if (url.startsWith('/@')) return next()

    // A script request must never be answered with the HTML shell either.
    if (req.headers['sec-fetch-dest'] === 'script') return next()

    // Real files (assets, html, json, images ...) are served as-is.
    if (path.posix.extname(url)) return next()

    if (url === '/app' || url.startsWith('/app/')) {
      req.url = '/app/index.html'
      return next()
    }

    // Storefront SPA route (deep links) — served from the root index.html.
    req.url = '/index.html'
    next()
  }

  return {
    name: 'vk-spa-host',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

export default defineConfig({
  plugins: [spaHost()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./public/vk', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    host: true,
    fs: { allow: ['.'] },
  },
  preview: {
    port: 4173,
    host: true,
  },
})
