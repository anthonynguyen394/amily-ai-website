// Regression test suite for amily.ai.
//
// One test per shipped PR so a future change can be pinpointed: if the PR #2
// regression test fails, the robots.txt partition was broken. If the PR #3
// test fails, /llms.txt or FAQPage was lost. Et cetera.
//
// This is intentionally a "narrow" suite — the per-page SEO + functional +
// security specs cover the broad correctness checks. This file is the audit
// trail tying the live site back to the original PR history.
//
// PR history (ameet.ai-website, in deployment order):
//   #1  chore/migrate-to-pages             — Cloudflare Pages via GH Actions (CLOSED — superseded)
//   #2  fix/seo-sitemap-robots             — robots.txt 3-tier + sitemap trim
//   #3  feat/seo-llms-and-faq              — /llms.txt + FAQPage JSON-LD on home
//   #4  test/seo-validation                — initial Playwright harness (robots, sitemap, llms, FAQPage)
//   #5  fix/seo-nap-phone                  — align NAP with GBP — +61 3 4714 0264
//   #6  seo/homepage-prerender-schema      — pre-render homepage + Organization/BlogPosting + canonical + en-AU + CI install
//
// Run:  node scripts/preview.mjs &  npx playwright test tests/e2e/regression.spec.js

import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';

const NAP_PHONE = '+61 3 4714 0264';
const NAP_ABN   = '86 758 863 858';

// -----------------------------------------------------------------------
// PR #2 — robots.txt partition + sitemap trim
// -----------------------------------------------------------------------
test.describe('regression: PR #2 (robots.txt partition + sitemap)', () => {
  test('robots.txt 3-tier: traditional search allowed', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    for (const ua of ['Googlebot', 'Bingbot']) {
      expect(body, `expected Allow rule for ${ua}`).toMatch(new RegExp(`User-agent:\\s*${ua}\\s*Allow:\\s*/`, 'i'));
    }
  });

  test('robots.txt 3-tier: retrieval AI allowed', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    for (const ua of ['OAI-SearchBot', 'PerplexityBot', 'Claude-Web', 'ChatGPT-User']) {
      expect(body, `expected Allow rule for ${ua}`).toMatch(new RegExp(`User-agent:\\s*${ua}\\s*Allow:\\s*/`, 'i'));
    }
  });

  test('robots.txt 3-tier: extractive training bots blocked', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    for (const ua of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'Bytespider', 'Amazonbot']) {
      expect(body, `expected Disallow rule for ${ua}`).toMatch(new RegExp(`User-agent:\\s*${ua}\\s*Disallow:\\s*/`, 'i'));
    }
  });

  test('sitemap.xml excludes /privacy.html (PR #2 dropped it)', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text();
    expect(body, '/privacy.html should not be in sitemap (PR #2 dropped it in favour of /privacy)').not.toContain('/privacy.html');
    expect(body, '/privacy should be in sitemap (clean URL, no .html)').toContain('https://amily.ai/privacy');
  });

  test('sitemap.xml contains the canonical URLs with no duplicates', async ({ request }) => {
    // Written in the 5-URL era as an exact-set match; the sitemap now grows
    // with every post (18 URLs as of 2026-07). The regression this guards:
    // canonical pages never drop out, entries stay deduped, and every loc
    // is an https://amily.ai URL.
    const body = await (await request.get('/sitemap.xml')).text();
    const locs = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    const unique = new Set(locs);
    expect(locs.length).toBe(unique.size);
    expect(locs.length).toBeGreaterThanOrEqual(18);
    for (const canonical of [
      'https://amily.ai/',
      'https://amily.ai/ai-voice-receptionist-melbourne-small-business',
      'https://amily.ai/blog',
      'https://amily.ai/blog/melbourne-tradies-missed-calls-cost',
      'https://amily.ai/privacy',
    ]) {
      expect(unique.has(canonical), `missing canonical URL: ${canonical}`).toBe(true);
    }
    for (const loc of unique) {
      expect(loc.startsWith('https://amily.ai/'), `non-canonical loc: ${loc}`).toBe(true);
    }
  });
});

// -----------------------------------------------------------------------
// PR #3 — /llms.txt + FAQPage JSON-LD on homepage
// -----------------------------------------------------------------------
test.describe('regression: PR #3 (/llms.txt + FAQPage)', () => {
  test('/llms.txt is served as text/plain and contains Amily AI + ABN', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toContain('Amily AI');
    expect(body).toContain(NAP_ABN);
  });

  test('homepage FAQPage JSON-LD is present with at least 3 Q&As', async ({ page }) => {
    await page.goto(BASE + '/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = blocks.map((s) => { try { return JSON.parse(s); } catch { return null; } })
                     .find((j) => j && j['@type'] === 'FAQPage');
    expect(faq, 'FAQPage JSON-LD missing from homepage').toBeTruthy();
    expect(faq.mainEntity.length, 'expected at least 3 FAQ questions').toBeGreaterThanOrEqual(3);
    for (const q of faq.mainEntity) {
      expect(q['@type']).toBe('Question');
      expect(q.name).toBeTruthy();
      expect(q.acceptedAnswer['@type']).toBe('Answer');
      expect(q.acceptedAnswer.text).toBeTruthy();
    }
  });
});

// -----------------------------------------------------------------------
// PR #4 — Playwright harness (this file is the harness; verify the
//         previous tests still pass by re-running a sample of them)
// -----------------------------------------------------------------------
test.describe('regression: PR #4 (test harness itself works)', () => {
  test('request fixture resolves the preview server', async ({ request }) => {
    const res = await request.get(BASE + '/');
    expect(res.status()).toBe(200);
  });

  test('page fixture renders a page (catches Playwright/browser regressions)', async ({ page }) => {
    await page.goto(BASE + '/');
    const title = await page.title();
    expect(title).toContain('Amily AI');
  });
});

// -----------------------------------------------------------------------
// PR #5 — NAP phone in JSON-LD matches +61 3 4714 0264
// -----------------------------------------------------------------------
test.describe('regression: PR #5 (NAP phone alignment)', () => {
  test('homepage LocalBusiness JSON-LD has the +61 phone', async ({ page }) => {
    await page.goto(BASE + '/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const lb = blocks.map((s) => { try { return JSON.parse(s); } catch { return null; } })
                    .find((j) => j && j['@type'] === 'LocalBusiness');
    expect(lb, 'LocalBusiness JSON-LD missing').toBeTruthy();
    expect(lb.telephone, `LocalBusiness.telephone should be ${NAP_PHONE}`).toBe(NAP_PHONE);
  });

  test('homepage JSON-LD (any type) carries the ABN', async ({ page }) => {
    // PR #6 added the ABN to the Organization JSON-LD (the LocalBusiness
    // schema doesn't currently have an identifier — that's a separate
    // NAP-consistency hardening item). Either block is acceptable for
    // local-SEO visibility; assert the ABN appears in at least one of
    // the homepage's structured-data blocks.
    await page.goto(BASE + '/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const all = blocks.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
    const abn = JSON.stringify(all).includes(NAP_ABN);
    expect(abn, `expected ABN ${NAP_ABN} in at least one homepage JSON-LD block`).toBe(true);
  });

  test('footer link tel: uses the +61 number (no spaces, E.164)', async ({ page }) => {
    await page.goto(BASE + '/');
    const href = await page.locator('a[href^="tel:"]').first().getAttribute('href');
    expect(href, 'expected tel: link to use +61 international format').toBe('tel:+61347140264');
  });
});

// -----------------------------------------------------------------------
// PR #6 — homepage pre-render + Organization schema + canonical + en-AU
// -----------------------------------------------------------------------
test.describe('regression: PR #6 (homepage pre-render + Organization + canonical + en-AU)', () => {
  test('homepage body is pre-rendered, not an empty <div id="root">', async ({ page }) => {
    const res = await page.goto(BASE + '/');
    expect(res.status()).toBe(200);
    const html = await page.content();
    expect(html, 'homepage is still the empty SPA shell — pre-render broke')
      .not.toMatch(/<div\s+id="root"\s*><\/div>/i);
  });

  test('homepage Organization JSON-LD is present and references NAP', async ({ page }) => {
    await page.goto(BASE + '/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const org = blocks.map((s) => { try { return JSON.parse(s); } catch { return null; } })
                     .find((j) => j && j['@type'] === 'Organization');
    expect(org, 'Organization JSON-LD missing from homepage').toBeTruthy();
    expect(org.name, 'Organization.name').toBe('Amily AI');
    expect(org.url, 'Organization.url').toBe('https://amily.ai/');
    expect(org.telephone, `Organization.telephone should be ${NAP_PHONE}`).toBe(NAP_PHONE);
  });

  test('homepage has self-referencing canonical to https://amily.ai/', async ({ page }) => {
    await page.goto(BASE + '/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical, 'homepage missing canonical link').toBe('https://amily.ai/');
  });

  test('homepage html lang is en-AU (not the default "en")', async ({ page }) => {
    await page.goto(BASE + '/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang, 'homepage html lang should be en-AU').toBe('en-AU');
  });

  test('pre-rendered HTML is significantly larger than the empty SPA shell (heuristic)', async ({ page }) => {
    // A successful pre-render produces a body >50 KB. A regression to the
    // empty shell produces <5 KB. This is a smoke test for "did the build
    // step actually run?"
    await page.goto(BASE + '/');
    const size = (await page.content()).length;
    expect(size, `homepage HTML is only ${size} bytes — pre-render likely skipped`)
      .toBeGreaterThan(50_000);
  });
});

// -----------------------------------------------------------------------
// PR #4+#6 — blog post uses BlogPosting (not Article) per PR #6 change
// -----------------------------------------------------------------------
test.describe('regression: PR #4+#6 (blog post schema type)', () => {
  test('/blog/melbourne-tradies-missed-calls-cost uses BlogPosting', async ({ page }) => {
    await page.goto(BASE + '/blog/melbourne-tradies-missed-calls-cost');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.map((s) => { try { return JSON.parse(s)['@type']; } catch { return null; } })
                       .filter(Boolean);
    expect(types, 'expected BlogPosting on blog post (PR #6 changed from Article)').toContain('BlogPosting');
  });

  test('/ai-voice-receptionist... still uses Article (landing page, not a post)', async ({ page }) => {
    await page.goto(BASE + '/ai-voice-receptionist-melbourne-small-business');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.map((s) => { try { return JSON.parse(s)['@type']; } catch { return null; } })
                       .filter(Boolean);
    expect(types, 'expected Article on landing page (not BlogPosting)').toContain('Article');
    expect(types, 'landing should not be BlogPosting').not.toContain('BlogPosting');
  });
});
