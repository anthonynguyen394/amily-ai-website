#!/usr/bin/env node
// Homepage pre-render for amily.ai.
//
// WHY: the homepage is a React SPA whose built dist/index.html ships an empty
// <div id="root"></div>. Googlebot executes JS and sees the content, but AI
// search crawlers (OAI-SearchBot, PerplexityBot, ClaudeBot, GPTBot) have
// limited/no JS execution and see an empty page — so the homepage is invisible
// to AI Overviews / ChatGPT Search / Perplexity. (Validated against the
// amily.ai SEO+GEO 2026 corpus: "client-only SPAs without prerender" are the
// named root cause; the fix is "static HTML or SSR".)
//
// HOW: after `vite build` + build-blog.mjs, this script serves dist/ locally,
// loads / in headless Chromium (Playwright), lets React mount and the GSAP
// scroll animations fire, strips transient hide-styles, then serializes the
// fully-rendered DOM back over dist/index.html.
//
// SAFE BY DESIGN: src/main.jsx uses createRoot().render() (client render), NOT
// hydrateRoot(). On a real browser React simply re-renders over the static
// markup — there is no hydration step and therefore no hydration-mismatch
// risk. The pre-rendered HTML exists purely for no-JS crawlers + first paint.
//
// Runs as the last step of `npm run build`.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const INDEX = path.join(DIST, 'index.html');

// Markers that MUST appear in the rendered HTML, else the pre-render failed and
// we refuse to overwrite (prevents shipping a broken/empty homepage). These are
// stable copy strings from the hero, FAQ section, and footer of src/App.jsx.
const REQUIRED_MARKERS = ['missed calls', 'Questions', 'amily.ai'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

// Minimal static file server over dist/. Falls back to index.html for unknown
// routes so SPA navigation resolves; assets are served verbatim with MIME types.
function startServer() {
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let filePath = path.join(DIST, urlPath);
      if (urlPath === '/' || urlPath.endsWith('/')) {
        filePath = path.join(DIST, urlPath, 'index.html');
      }
      if (!filePath.startsWith(DIST)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        // SPA fallback
        filePath = INDEX;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

// In-page: scroll through the full document so every ScrollTrigger fires and
// its `autoAlpha:0 -> 1` reveal completes, then return to top. Without this,
// below-the-fold sections remain visibility:hidden in the captured DOM.
async function revealAllSections(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.round(window.innerHeight * 0.8);
    const total = document.body.scrollHeight;
    for (let y = 0; y <= total; y += step) {
      window.scrollTo(0, y);
      await sleep(120);
    }
    window.scrollTo(0, total);
    await sleep(400);
    window.scrollTo(0, 0);
    await sleep(200);
  });
}

// In-page: strip transient hide-styles that animation libs leave behind, so no
// real content is shipped invisible. Safe because GSAP `.from()`/ScrollTrigger
// end states are the natural (visible) CSS state — we only clear the residue.
async function stripHideStyles(page) {
  await page.evaluate(() => {
    const els = document.querySelectorAll('[style]');
    for (const el of els) {
      const s = el.style;
      if (s.visibility === 'hidden') s.visibility = '';
      if (s.opacity === '0' || parseFloat(s.opacity) === 0) s.opacity = '';
      // GSAP leaves transform:translate(0px,0px) at end of .from() — harmless,
      // but clearing a fully-zeroed transform avoids noise in the static HTML.
      if (s.transform && /translate(3d)?\(\s*0px[,\s0pxdeg.]*\)/.test(s.transform)) {
        s.transform = '';
      }
      if (el.getAttribute('style') === '') el.removeAttribute('style');
    }
  });
}

async function main() {
  if (!fs.existsSync(INDEX)) {
    console.error('  prerender: dist/index.html not found — run `vite build` first.');
    process.exit(1);
  }

  const { server, port } = await startServer();
  const url = `http://127.0.0.1:${port}/`;
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
  try {
    const context = await browser.newContext({
      // Reduced motion -> hero renders the still PNG (with alt text) instead of
      // the video, and the app calms first-paint animations. Better for SEO.
      reducedMotion: 'reduce',
      viewport: { width: 1280, height: 1800 },
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // Wait for React to mount actual content into #root.
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.children.length > 0 && root.innerText.trim().length > 200;
      },
      { timeout: 30000 }
    );
    // Wait for web fonts so no layout-affecting reflow is mid-flight.
    await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});

    await revealAllSections(page);
    await stripHideStyles(page);

    // Serialize the full rendered document.
    let html = await page.evaluate(() => document.documentElement.outerHTML);
    if (!/^<!doctype/i.test(html)) html = '<!doctype html>\n' + html;

    // Guard: refuse to write a shell or a page missing key content.
    const missing = REQUIRED_MARKERS.filter((m) => !html.includes(m));
    if (html.includes('<div id="root"></div>')) {
      console.error('  prerender: rendered DOM still shows an empty #root — aborting, dist/index.html unchanged.');
      process.exit(1);
    }
    if (missing.length) {
      console.error(`  prerender: rendered DOM missing required markers [${missing.join(', ')}] — aborting.`);
      process.exit(1);
    }

    fs.writeFileSync(INDEX, html);
    const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
    console.log(`  prerender: dist/index.html rewritten with rendered DOM (${kb} KB)`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('  prerender: failed —', err);
  process.exit(1);
});
