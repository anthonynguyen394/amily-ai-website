// Security test suite for amily.ai.
//
// Covers the OWASP-aligned baseline for a static site that is publicly hosted
// on Cloudflare Pages. Layered as follows:
//
//   1. HTTP security headers  (defence in depth — also asserted in
//                              seo-comprehensive.spec.js, kept here for the
//                              security-focused review pass)
//   2. Content-Security-Policy (CSP) — currently absent from the site; this
//                              test will fail and surface a real hardening
//                              opportunity (recommend a strict CSP via
//                              _headers once the GA + GTM allowlist is decided)
//   3. XSS attempts via URL params — must not execute
//   4. Open-redirect attempts — must not redirect off-domain
//   5. Mixed content — every same-origin / cross-origin asset URL must be HTTPS
//   6. Exposed sensitive files — /.env, /.git, /package.json, /_headers,
//                              /.DS_Store, /node_modules/, /wp-admin, etc.
//                              must return 404 (not 200, not 403-with-leak)
//   7. Clickjacking — page must refuse to be framed (X-Frame-Options: DENY)
//   8. Cookie hygiene — either no cookies set, or all are Secure + HttpOnly +
//                       SameSite=Lax/Strict
//
// Run:  node scripts/preview.mjs &  npx playwright test tests/e2e/security.spec.js

import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';

// Endpoints that must NOT be reachable on a public static site. If any of
// these return 200, the deployment is leaking server / source / build
// artefacts and the PR should be blocked.
const SENSITIVE_PATHS = [
  '/.env',
  '/.env.local',
  '/.env.production',
  '/.git',
  '/.git/config',
  '/.gitignore',
  '/.DS_Store',
  '/package.json',
  '/package-lock.json',
  '/node_modules/',
  '/_redirects',
  '/wrangler.toml',
  '/admin',
  '/login',
  '/wp-admin',
  '/wp-login.php',
  '/phpmyadmin',
  '/.vscode/',
  '/.idea/',
  '/vite.config.js',
  '/tailwind.config.js',
  '/scripts/',
  '/src/',
];
// Note: /_headers is intentionally NOT in this list. On Cloudflare Pages
// it is a public config file (read by the CDN), not a secret — blocking
// it on the test would catch nothing useful. Same for /_workers.

// Known cross-origin resources that legitimately appear in the page (Google
// Fonts, GA, GTM). Adding to this list means the site trusts that origin.
// If a future PR introduces a new third-party, add it here AND to the CSP
// allowlist (when we ship CSP).
const TRUSTED_CROSS_ORIGIN_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'googleads.g.doubleclick.net',
  'www.google.com',
  'ad.doubleclick.net',
  'www.googleadservices.com',
]);

// -----------------------------------------------------------------------
// 1. HTTP security headers
// -----------------------------------------------------------------------
test.describe('security headers — defence in depth', () => {
  for (const path of ['/', '/blog/', '/privacy.html', '/blog/melbourne-tradies-missed-calls-cost']) {
    test(`${path} has full security header set`, async ({ request }) => {
      const res = await request.get(BASE + path);
      expect(res.status()).toBe(200);
      const h = res.headers();
      expect(h['x-content-type-options'], 'nosniff missing').toBe('nosniff');
      expect(h['x-frame-options'],    'X-Frame-Options missing (clickjacking risk)').toBe('DENY');
      expect(h['referrer-policy'],    'Referrer-Policy missing').toBe('strict-origin-when-cross-origin');
      expect(h['strict-transport-security'], 'HSTS missing').toMatch(/max-age=\d+/);
    });
  }
});

// -----------------------------------------------------------------------
// 2. Content-Security-Policy (real gap — test fails until CSP is added)
// -----------------------------------------------------------------------
test.describe('content-security-policy', () => {
  test('homepage should have a Content-Security-Policy header (currently absent — see morning report)', async ({ request }) => {
    const res = await request.get(BASE + '/');
    const csp = res.headers()['content-security-policy'];
    if (!csp) {
      // Surface as a failing test, not silently skipped — this is a real gap.
      expect(csp, 'No CSP set. Recommend shipping via dist/_headers: '
        + "default-src 'self'; img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com; "
        + "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; "
        + "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        + "font-src 'self' https://fonts.gstatic.com; "
        + "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com; "
        + "frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
      ).toBeTruthy();
    } else {
      // CSP is present — sanity check it actually restricts frame-ancestors
      expect(csp).toMatch(/frame-ancestors\s+(?:'none'|'self')/i);
      expect(csp).toMatch(/default-src\s+/i);
    }
  });
});

// -----------------------------------------------------------------------
// 3. XSS attempts via URL params
// -----------------------------------------------------------------------
test.describe('XSS — reflected payload from URL must not execute', () => {
  const PAYLOADS = [
    '<script>window.__xss=1</script>',
    '"><img src=x onerror=window.__xss=1>',
    "javascript:window.__xss=1",
  ];

  for (const payload of PAYLOADS) {
    test(`payload "${payload.slice(0, 30)}..." does not execute`, async ({ page }) => {
      // The payload is reflected in the URL, not in the page (no search box),
      // but we still check that no inline script outside the React bundle
      // gets injected. Track window.__xss as a canary.
      await page.goto(`${BASE}/?q=${encodeURIComponent(payload)}`);
      const fired = await page.evaluate(() => window.__xss === 1);
      expect(fired, `XSS payload executed: ${payload}`).toBe(false);
    });
  }
});

// -----------------------------------------------------------------------
// 4. Open redirect attempts
// -----------------------------------------------------------------------
test.describe('open redirect — query params must not redirect off-domain', () => {
  const REDIRECT_PARAMS = ['redirect', 'url', 'next', 'return', 'goto', 'returnTo'];
  for (const param of REDIRECT_PARAMS) {
    test(`?${param}=https://evil.example/ does not redirect off-domain`, async ({ page }) => {
      const resp = await page.goto(`${BASE}/?${param}=${encodeURIComponent('https://evil.example/')}`);
      // The page should still be on our origin, not redirected to evil.example
      expect(page.url()).toMatch(new RegExp(`^${BASE.replace(/\//g, '\\/')}/`));
      // And it should be a 200, not a 3xx
      expect(resp?.status(), 'should not return a redirect status').toBe(200);
    });
  }
});

// -----------------------------------------------------------------------
// 5. Mixed content
// -----------------------------------------------------------------------
test.describe('mixed content — every asset URL is HTTPS', () => {
  for (const path of ['/', '/blog/', '/blog/melbourne-tradies-missed-calls-cost', '/ai-voice-receptionist-melbourne-small-business', '/privacy.html']) {
    test(`${path} loads no http:// resources (only https: or data: or relative)`, async ({ page }) => {
      const insecure = [];
      page.on('response', (res) => {
        const url = res.url();
        if (url.startsWith('http://') && !url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) {
          insecure.push(url);
        }
        if (url.startsWith('http://127.0.0.1')) {
          // fine — local preview, not mixed content
        }
      });
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      expect(insecure, `insecure URLs: ${insecure.join(', ')}`).toEqual([]);
    });
  }

  test('all <img>, <script>, <link href>, <source> use https or relative', async ({ page }) => {
    await page.goto(BASE + '/');
    const httpUrls = await page.evaluate(() => {
      const out = [];
      const sel = ['img[src]', 'script[src]', 'link[href]', 'source[src]', 'audio[src]', 'video[src]'];
      for (const s of sel) {
        for (const el of document.querySelectorAll(s)) {
          const u = el.getAttribute('src') || el.getAttribute('href');
          if (u && /^http:\/\//.test(u)) out.push(u);
        }
      }
      return out;
    });
    expect(httpUrls, `mixed-content URLs: ${httpUrls.join(', ')}`).toEqual([]);
  });
});

// -----------------------------------------------------------------------
// 6. Exposed sensitive files / paths
// -----------------------------------------------------------------------
test.describe('sensitive paths return 404 (not 200, not 403 with leak)', () => {
  for (const p of SENSITIVE_PATHS) {
    test(`${p} → 404`, async ({ request }) => {
      const res = await request.get(BASE + p);
      expect(res.status(), `${p} returned ${res.status()} — leaking source/build/state`).toBe(404);
      // Also assert the body is the generic error page, not a file dump
      const body = await res.text();
      expect(body.toLowerCase()).not.toMatch(/(\bpassword\b|\bsecret\b|\bapi[_-]?key\b|\bdb_password\b|root:.*:)/i);
    });
  }
});

// -----------------------------------------------------------------------
// 7. Clickjacking
// -----------------------------------------------------------------------
test.describe('clickjacking — page refuses to be framed', () => {
  for (const path of ['/', '/blog/', '/privacy.html']) {
    test(`${path} sets X-Frame-Options: DENY`, async ({ request }) => {
      const res = await request.get(BASE + path);
      expect(res.headers()['x-frame-options']).toBe('DENY');
    });
  }
});

// -----------------------------------------------------------------------
// 8. Cookie hygiene
// -----------------------------------------------------------------------
test.describe('cookie hygiene', () => {
  for (const path of ['/', '/blog/', '/privacy.html']) {
    test(`${path} sets no cookies (static site) OR all are Secure + HttpOnly + SameSite`, async ({ request }) => {
      const res = await request.get(BASE + path);
      const setCookies = res.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
      if (setCookies.length === 0) return; // no cookies set — fine
      for (const c of setCookies) {
        const v = c.value.toLowerCase();
        expect(v, `cookie missing Secure: ${c.value}`).toMatch(/;\s*secure/);
        expect(v, `cookie missing HttpOnly: ${c.value}`).toMatch(/;\s*httponly/);
        expect(v, `cookie missing SameSite: ${c.value}`).toMatch(/;\s*samesite=(lax|strict)/);
      }
    });
  }
});

// -----------------------------------------------------------------------
// 9. robots.txt does not allow sensitive paths
// -----------------------------------------------------------------------
test.describe('robots.txt does not explicitly allow /admin or /api', () => {
  test('no "Allow: /admin" or "Allow: /api" rules', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body, 'robots.txt leaks an Allow rule for a sensitive path')
      .not.toMatch(/Allow:\s*\/(admin|api|login|wp-admin)/i);
  });
});
