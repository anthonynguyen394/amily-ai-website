import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cloudflare Pages serves the headers in public/_headers and returns
// public/404.html (status 404) for unknown paths. `vite preview` does
// neither, which made every header/404 e2e test fail locally and in CI.
// The config below makes preview emulate the edge so the test suite
// exercises the same contract the production site serves.

// Parse the `/*` block of public/_headers (Cloudflare Pages format).
function edgeHeaders() {
  const raw = fs.readFileSync(path.resolve(import.meta.dirname, 'public/_headers'), 'utf8')
  const headers = {}
  let inCatchAll = false
  for (const line of raw.split('\n')) {
    if (!/^\s/.test(line)) {
      inCatchAll = line.trim() === '/*'
      continue
    }
    if (!inCatchAll) continue
    const idx = line.indexOf(':')
    if (idx > 0) headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }
  return headers
}

// Serve dist/404.html with a real 404 status for paths that resolve to no
// file in dist, like Cloudflare Pages does once a 404.html ships. Runs as a
// pre-middleware with an explicit existence check (mirroring the resolution
// vite's static server applies: exact file, +.html, directory index.html)
// because vite 8's post-middleware hook ordering intercepts static serving.
function previewNotFound() {
  const dist = path.resolve(import.meta.dirname, 'dist')
  const isFile = (p) => {
    try {
      return fs.statSync(p).isFile()
    } catch {
      return false
    }
  }
  return {
    name: 'preview-404',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '/').split('?')[0])
        const base = path.join(dist, url)
        const candidates = url.endsWith('/')
          ? [path.join(base, 'index.html')]
          : [base, base + '.html', path.join(base, 'index.html')]
        if (candidates.some(isFile)) return next()
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(fs.readFileSync(path.join(dist, '404.html')))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), previewNotFound()],
  // 'mpa' disables the SPA history fallback in dev/preview — every published
  // route is a real HTML file in dist, and the fallback was masking 404s
  appType: 'mpa',
  preview: {
    headers: edgeHeaders(),
  },
})
