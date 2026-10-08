import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const mainPublic = fileURLToPath(new URL('../public', import.meta.url))
const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css' }

// Dev only: serve the shared store files (/vk/img/*, /vk/data/seed.json) from ../public — no backend involved
function serveStoreFiles() {
  return {
    name: 'vk-serve-store-files',
    configureServer(server) {
      server.middlewares.use('/vk', (req, res, next) => {
        const file = path.join(mainPublic, 'vk', decodeURIComponent(req.url.split('?')[0]))
        if (!file.startsWith(path.join(mainPublic, 'vk')) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next()
        res.setHeader('Content-Type', types[path.extname(file).toLowerCase()] || 'application/octet-stream')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // App is served under /app/ (change with VITE_BASE, e.g. "/" when deployed on its own domain)
    base: env.VITE_BASE || '/app/',
    plugins: [vue(), serveStoreFiles()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { port: 5173, fs: { allow: ['..'] } },
    build: {
      outDir: env.VITE_OUT_DIR || '../public/app',
      emptyOutDir: true,
      chunkSizeWarningLimit: 700,
    },
  }
})
