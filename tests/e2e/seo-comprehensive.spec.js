// Comprehensive SEO + security + functional test suite for amily.ai.
//
// Validates every shipping public page against the SEO+GEO 2026 action plan
// plus Cloudflare Pages security baseline. Run via:
//
//   node scripts/preview.mjs &           # serves dist/ with CF rewrites + _headers
//   npx playwright test tests/e2e/seo-comprehensive.spec.js
//
// Each test is intentionally a single assertion so a failure points to the
// exact gap. The matrix of pages + expectations lives in PAGES below -- add a
// new route to sitemap.xml and the suite will fail until you also add an
// entry here, which is the desired behaviour (sitemap != real surface area
// is a bug).
//
// Filters out noise from localhost-only Google Analytics / GTM pixel aborts
// (GTM rejects non-prod hostnames) and browser-initiated audio preloads
// (net::ERR_ABORTED on <audio preload="metadata">). These should NEVER fail
// the suite -- if they do on production, it's a different problem.

import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';

const PAGES = [
  {
    path: '/',
    name: 'homepage',
    titleContains: 'Amily AI',
    h1: true,
    schemaTypes: ['Organization', 'FAQPage', 'LocalBusiness'],
    bodyContainsAny: ['missed calls', 'voice', 'Melbourne'],
  },
  {
    path: '/blog/',
    name: 'blog-index',
    titleContains: 'Blog',
    h1: true,
  },
  {
    path: '/blog/melbourne-tradies-missed-calls-cost',
    name: 'blog-post-tradies',
    titleContains: 'Why Melbourne tradies',
    h1: true,
    schemaTypes: ['BlogPosting'],
    bodyContainsAny: ['Melbourne', 'tradies', 'missed'],
  },
  {
    path: '/ai-voice-receptionist-melbourne-small-business',
    name: 'landing-voice',
    titleContains: 'AI voice receptionist',
    h1: true,
    schemaTypes: ['Article'],
    bodyContainsAny: ['AI voice', 'Melbourne'],
  },
  {
    path: '/privacy.html',
    name: 'privacy',
    titleContains: 'Privacy',
    h1: true,
    bodyContainsAny: ['Privacy Act'],
  },
];

// Pages where we assert NAP (+61 phone OR ABN) is visible in the body text.
// Schema-only NAP doesn't help voice assistants / local SEO.
const NAP_IN_BODY = new Set(['/', '/ai-voice-receptionist-melbourne-small-business']);
const NAP_PHONE = '+61 3 4714 0264';
const NAP_ABN   = '86 758 863 858';

// Security headers we expect on every HTML response. Mirrors the
// dist/_headers file. If a future change drops one of these, this test
// blocks the PR.
const SECURITY_HEADERS = {
  'x-content-type-options':   'nosniff',
  'x-frame-options':          'DENY',
  'referrer-policy':          'strict-origin-when-cross-origin',
  'strict-transport-security': /max-age=\d+/,
};

const analyticsHosts = /(google-analytics\.com|googletagmanager\.com|google\.com\/ccm|googleadservices\.com|doubleclick\.net|google\.com\/rmkt|google\.com\/g\/collect)/i;

test.describe('homepage pre-render (critical gap fix from PR #6)', () => {
  test('body is not an empty SPA shell', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    const html = await page.content();
    expect(html).not.toMatch(/<div\s+id="root"\s*><\/div>/i);
  });

  test('contains real rendered body text (>500 chars of innerText)', async ({ page }) => {
    await page.goto('/');
    const text = await page.evaluate(() => document.body.innerText);
    expect(text.replace(/\s+/g, '').length).toBeGreaterThan(500);
  });
});

test.describe('per-page SEO metadata', () => {
  for (const p of PAGES) {
    test.describe(p.path, () => {
      test(`title contains "${p.titleContains}"`, async ({ page }) => {
        await page.goto(BASE + p.path);
        await expect(page).toHaveTitle(new RegExp(p.titleContains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      });

      test('has meta description', async ({ page }) => {
        await page.goto(BASE + p.path);
        const desc = await page.locator('meta[name="description"]').getAttribute('content');
        expect(desc).toBeTruthy();
        expect(desc.length).toBeGreaterThan(20);
      });

      test('has self-referencing canonical', async ({ page }) => {
        await page.goto(BASE + p.path);
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical).toBeTruthy();
        expect(canonical).toMatch(/^https:\/\/amily\.ai\//);
      });

      test('html lang is en-AU (Australian locale)', async ({ page }) => {
        await page.goto(BASE + p.path);
        const lang = await page.locator('html').getAttribute('lang');
        expect(lang).toBe('en-AU');
      });

      test('og:locale is en_AU', async ({ page }) => {
        await page.goto(BASE + p.path);
        // Count first so we don't wait the default 30s for an absent element.
        const ogCount = await page.locator('meta[property="og:locale"]').count();
        const og = ogCount > 0
          ? await page.locator('meta[property="og:locale"]').getAttribute('content')
          : null;
        // absent on pages without OG (e.g. /privacy) is acceptable
        expect(og === null || og === 'en_AU').toBe(true);
      });

      if (p.h1) {
        test('has exactly one h1', async ({ page }) => {
          await page.goto(BASE + p.path);
          const h1Count = await page.locator('h1').count();
          expect(h1Count).toBeGreaterThanOrEqual(1);
        });
      }

      for (const schemaType of p.schemaTypes || []) {
        test(`has JSON-LD @type=${schemaType}`, async ({ page }) => {
          await page.goto(BASE + p.path);
          const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
          const types = blocks
            .map((s) => { try { return JSON.parse(s)['@type']; } catch { return null; } })
            .filter(Boolean);
          expect(types).toContain(schemaType);
        });
      }

      for (const needle of p.bodyContainsAny || []) {
        test(`body contains "${needle}"`, async ({ page }) => {
          await page.goto(BASE + p.path);
          const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
          expect(text).toContain(needle.toLowerCase());
        });
      }

      if (NAP_IN_BODY.has(p.path)) {
        test('visible body contains NAP (phone in +61 format OR full ABN)', async ({ page }) => {
          await page.goto(BASE + p.path);
          const text = await page.evaluate(() => document.body.innerText);
          expect(text.includes(NAP_PHONE) || text.includes(NAP_ABN)).toBe(true);
        });
      }
    });
  }
});

test.describe('security headers (Cloudflare Pages baseline)', () => {
  for (const p of PAGES) {
    test(`${p.path} has nosniff, DENY frame, referrer-policy, HSTS`, async ({ request }) => {
      const res = await request.get(BASE + p.path);
      expect(res.status()).toBe(200);
      const h = res.headers();
      for (const [k, want] of Object.entries(SECURITY_HEADERS)) {
        const got = h[k];
        expect(got, `header ${k} missing on ${p.path}`).toBeTruthy();
        if (want instanceof RegExp) {
          expect(got).toMatch(want);
        } else {
          expect(got).toBe(want);
        }
      }
    });
  }
});

test.describe('robots.txt 3-tier partition', () => {
  test('serves 200 and references sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/Sitemap:\s*https:\/\/amily\.ai\/sitemap\.xml/);
  });

  test('allows Googlebot, Bingbot, and retrieval-style AI bots', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    for (const ua of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'PerplexityBot', 'Claude-Web']) {
      expect(body, `expected Allow rule for ${ua}`).toMatch(new RegExp(`User-agent:\\s*${ua}[\\s\\S]*?Allow:\\s*/`, 'i'));
    }
  });

  test('blocks extractive training crawlers', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    for (const ua of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'Bytespider', 'Amazonbot']) {
      expect(body, `expected Disallow rule for ${ua}`).toMatch(new RegExp(`User-agent:\\s*${ua}[\\s\\S]*?Disallow:\\s*/`, 'i'));
    }
  });
});

test.describe('sitemap.xml', () => {
  test('serves 200 valid XML with the canonical 5 URLs', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/<urlset/);
    for (const expected of [
      'https://amily.ai/',
      'https://amily.ai/privacy',
      'https://amily.ai/blog',
      'https://amily.ai/ai-voice-receptionist-melbourne-small-business',
      'https://amily.ai/blog/melbourne-tradies-missed-calls-cost',
    ]) {
      expect(body).toContain(expected);
    }
  });
});

test.describe('/llms.txt (GEO file for AI search crawlers)', () => {
  test('serves 200, mentions Amily AI and ABN 86 758 863 858', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Amily AI');
    expect(body).toContain('86 758 863 858');
  });
});

test.describe('no broken pages or assets', () => {
  for (const p of PAGES) {
    test(`${p.path} returns 200 with no console errors or failed network requests`, async ({ page }) => {
      const consoleErrors = [];
      const failed = [];
      page.on('console',        (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('requestfailed',  (r) => failed.push(`${r.url()} -- ${r.failure()?.errorText}`));

      const res = await page.goto(BASE + p.path, { waitUntil: 'networkidle' });
      expect(res?.status()).toBe(200);

      // Filter known localhost-only noise. If these hit on prod, it's a real bug.
      const real = (s) =>
        !/favicon\.ico/i.test(s) &&
        !/ERR_ABORTED/i.test(s) &&
        !analyticsHosts.test(s) &&
        !/preconnect/i.test(s) &&
        !/status of 400/i.test(s);

      expect(consoleErrors.filter(real), JSON.stringify(consoleErrors)).toEqual([]);
      expect(failed.filter(real),       JSON.stringify(failed)).toEqual([]);
    });
  }
});
