// SEO validation: robots.txt partition, sitemap canonicalisation,
// llms.txt presence, FAQPage JSON-LD on homepage. These cover the
// 2026-05-11 SEO+GEO action plan items shipped on `main`.

import { test, expect } from '@playwright/test';

test.describe('robots.txt — partitioned 2026-05-11', () => {
  let body;

  test.beforeAll(async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    body = await res.text();
  });

  test('declares Sitemap', () => {
    expect(body).toMatch(/Sitemap:\s*https:\/\/amily\.ai\/sitemap\.xml/);
  });

  test('explicitly allows retrieval-style AI bots', () => {
    for (const bot of ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-Web']) {
      const re = new RegExp(`User-agent:\\s*${bot}\\s*\\nAllow:\\s*/`, 'i');
      expect(body, `Expected Allow rule for ${bot}`).toMatch(re);
    }
  });

  test('explicitly blocks extractive training crawlers', () => {
    for (const bot of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'Meta-ExternalAgent']) {
      const re = new RegExp(`User-agent:\\s*${bot}\\s*\\nDisallow:\\s*/`, 'i');
      expect(body, `Expected Disallow rule for ${bot}`).toMatch(re);
    }
  });

  test('keeps default User-agent: * permissive', () => {
    expect(body).toMatch(/User-agent:\s*\*\s*\nAllow:\s*\//);
  });

  test('does not contain old generic-only policy', () => {
    // Old policy was three lines total: "User-agent: *\nAllow: /\n\nSitemap:..."
    const lineCount = body.split('\n').filter((l) => l.trim()).length;
    expect(lineCount).toBeGreaterThan(10);
  });
});

test.describe('sitemap.xml — canonical URLs only', () => {
  let xml;

  test.beforeAll(async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    xml = await res.text();
  });

  test('contains canonical /privacy (no .html extension)', () => {
    expect(xml).toContain('<loc>https://amily.ai/privacy</loc>');
    expect(xml).not.toContain('<loc>https://amily.ai/privacy.html</loc>');
  });

  test('lists all 5 canonical URLs', () => {
    for (const path of [
      '/',
      '/privacy',
      '/blog',
      '/ai-voice-receptionist-melbourne-small-business',
      '/blog/melbourne-tradies-missed-calls-cost',
    ]) {
      expect(xml, `missing ${path}`).toContain(`<loc>https://amily.ai${path}</loc>`);
    }
  });

  test('every URL in sitemap returns 200 with no redirect', async ({ request }) => {
    // Parse <loc> entries. The preview server is at baseURL; rewrite host.
    const locs = [...xml.matchAll(/<loc>https:\/\/amily\.ai(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const path of locs) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(
        [200, 304].includes(res.status()),
        `${path} returned ${res.status()} — sitemap URLs must not redirect`,
      ).toBe(true);
    }
  });
});

test.describe('llms.txt — site root', () => {
  test('served as text/plain with real content', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] || '';
    expect(ct).toContain('text/plain');
    const body = await res.text();
    // Must be the real file, not the SPA fallback
    expect(body).not.toContain('<!doctype html>');
    expect(body).toMatch(/^# Amily AI/);
    expect(body).toContain('Privacy Act 1988');
    expect(body).toContain('https://amily.ai/');
  });
});

test.describe('homepage SEO signals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('serves FAQPage JSON-LD with all 6 questions', async ({ page }) => {
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqBlock = blocks.find((s) => s.includes('"FAQPage"'));
    expect(faqBlock, 'homepage missing FAQPage JSON-LD').toBeTruthy();
    const json = JSON.parse(faqBlock);
    expect(json['@type']).toBe('FAQPage');
    expect(json.mainEntity).toHaveLength(6);
    // Sanity check — first question wording stays in sync with App.jsx FAQ component
    expect(json.mainEntity[0].name).toContain('tech skills');
  });

  test('keeps LocalBusiness JSON-LD intact', async ({ page }) => {
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const local = blocks.find((s) => s.includes('"LocalBusiness"'));
    expect(local).toBeTruthy();
    expect(local).toContain('Melbourne');
  });

  test('og:locale is en_AU', async ({ page }) => {
    const ogLocale = await page.locator('meta[property="og:locale"]').getAttribute('content');
    expect(ogLocale).toBe('en_AU');
  });
});

test.describe('privacy page canonicalisation', () => {
  test('/privacy resolves with no redirect', async ({ request }) => {
    const res = await request.get('/privacy', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  test('no internal links point at /privacy.html', async ({ page, request }) => {
    // Check the three pre-rendered pages — homepage is SPA, skip
    const paths = [
      '/blog',
      '/blog/melbourne-tradies-missed-calls-cost',
      '/ai-voice-receptionist-melbourne-small-business',
    ];
    for (const path of paths) {
      await page.goto(path);
      const html = await page.content();
      expect(html, `${path} still links to /privacy.html`).not.toContain('href="/privacy.html"');
    }
  });
});
