// End-to-end validation of the blog system.
// Run:  npm run build && npx playwright test
// These checks mirror what a user would see so regressions caught here
// are real ones, not "the test was wrong".

import { test, expect } from '@playwright/test';

const POST_SLUG = 'melbourne-tradies-missed-calls-cost';
const LANDING_SLUG = 'ai-voice-receptionist-melbourne-small-business';

test.describe('blog index', () => {
  test('/blog resolves without trailing slash', async ({ page }) => {
    const res = await page.goto('/blog');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Blog \| Amily AI/);
    await expect(page.locator('h1.page-title')).toHaveText('Blog');
  });

  test('/blog/ resolves with trailing slash', async ({ page }) => {
    const res = await page.goto('/blog/');
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1.page-title')).toHaveText('Blog');
  });

  test('shows the published blog post as a card', async ({ page }) => {
    await page.goto('/blog');
    const card = page.locator('.post-card', {
      hasText: 'Why Melbourne tradies miss 22% of calls',
    });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('href', `/blog/${POST_SLUG}`);
  });

  test('lists both the blog post and the landing page', async ({ page }) => {
    await page.goto('/blog');
    const cards = page.locator('.post-card');
    await expect(cards).toHaveCount(2);
    // Landing page links to its root URL, not /blog/<slug>
    const landingCard = page.locator(`.post-card[href="/${LANDING_SLUG}"]`);
    await expect(landingCard).toBeVisible();
    // Blog post links under /blog/
    const postCard = page.locator(`.post-card[href="/blog/${POST_SLUG}"]`);
    await expect(postCard).toBeVisible();
  });

  test('clicking a card opens the right page for its layout', async ({ page }) => {
    await page.goto('/blog');
    await page.locator(`.post-card[href="/blog/${POST_SLUG}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/blog/${POST_SLUG}$`));
    await expect(page.locator('h1.page-title')).toBeVisible();
  });
});

test.describe('blog post (layout=post)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/blog/${POST_SLUG}`);
  });

  test('renders the meta strip above the H1', async ({ page }) => {
    // Visual regression from a recent session: the meta strip disappeared
    // on the landing page. Blog posts should always show date+read+tags.
    const meta = page.locator('article .post-meta').first();
    await expect(meta).toBeVisible();
    await expect(meta).toContainText('2026');
    await expect(meta).toContainText('min read');
    await expect(meta).toContainText('trades');
    await expect(meta).toContainText('missed-calls');
  });

  test('H1, subtitle, body and final CTA all render', async ({ page }) => {
    await expect(page.locator('h1.page-title')).toHaveText(
      'Why Melbourne tradies miss 22% of calls (and what it costs them)'
    );
    await expect(page.locator('p.page-subtitle')).toBeVisible();
    await expect(page.locator('article .post-body')).toBeVisible();
    await expect(page.locator('article .final-cta')).toBeVisible();
  });

  test('schema.org Article + FAQ JSON-LD are embedded', async ({ page }) => {
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.length).toBeGreaterThanOrEqual(2);
    expect(jsonLd.some((s) => s.includes('"@type": "Article"'))).toBe(true);
    expect(jsonLd.some((s) => s.includes('"@type": "FAQPage"'))).toBe(true);
  });

  test('back link goes to /blog (All posts), not /', async ({ page }) => {
    const back = page.locator('header .back-link');
    await expect(back).toHaveText(/All posts/);
    await expect(back).toHaveAttribute('href', '/blog');
  });

  test('GA4 gtag is present', async ({ page }) => {
    const html = await page.content();
    expect(html).toContain('gtag/js?id=G-Y45JQYP847');
  });
});

test.describe('landing page (layout=landing)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${LANDING_SLUG}`);
  });

  test('resolves at the site-root URL (not under /blog)', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`/${LANDING_SLUG}$`));
    await expect(page.locator('h1.page-title')).toBeVisible();
  });

  test('H1, subtitle, body and final CTA all render', async ({ page }) => {
    await expect(page.locator('h1.page-title')).toHaveText(
      'AI voice receptionist for Melbourne small business'
    );
    await expect(page.locator('p.page-subtitle')).toBeVisible();
    await expect(page.locator('article .post-body')).toBeVisible();
    await expect(page.locator('article .final-cta')).toBeVisible();
  });

  test('shows the same meta strip as blog posts (visual consistency)', async ({ page }) => {
    // Both page types share the same top strip so they feel like one site.
    const meta = page.locator('article .post-meta').first();
    await expect(meta).toBeVisible();
    await expect(meta).toContainText('2026');
    await expect(meta).toContainText('min read');
    await expect(meta).toContainText('melbourne');
  });

  test('back link goes to / (Back to home), not /blog', async ({ page }) => {
    const back = page.locator('header .back-link');
    await expect(back).toHaveText(/Back to home/);
    await expect(back).toHaveAttribute('href', '/');
  });

  test('industry grid renders with 4 cards', async ({ page }) => {
    const cards = page.locator('.post-body .industry-card');
    await expect(cards).toHaveCount(4);
    await expect(cards.nth(0)).toContainText('Trades and home services');
    await expect(cards.nth(2)).toContainText('Legal and immigration');
  });

  test('pricing and comparison tables render', async ({ page }) => {
    const tables = page.locator('.post-body table');
    await expect(tables).toHaveCount(2);
    // pricing table first
    await expect(tables.first()).toContainText('$149');
    await expect(tables.first()).toContainText('$249');
    await expect(tables.first()).toContainText('$399');
    // comparison table second
    await expect(tables.nth(1)).toContainText('24/7');
    await expect(tables.nth(1)).toContainText('Unlimited');
  });

  test('FAQ schema has all 10 questions', async ({ page }) => {
    // Playwright locator.filter({hasText}) does not search inside <script>
    // bodies (DOM hides script text), so read all JSON-LD blocks and parse.
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqBlock = blocks.find((s) => s.includes('"FAQPage"'));
    expect(faqBlock).toBeTruthy();
    const json = JSON.parse(faqBlock);
    expect(json.mainEntity).toHaveLength(10);
  });

  test('canonical URL points at the landing path, not /blog', async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`https://amily.ai/${LANDING_SLUG}`);
    expect(canonical).not.toContain('/blog/');
  });
});

test.describe('cross-page consistency', () => {
  test('header logo + Back link share the same shell on both page types', async ({ page }) => {
    await page.goto(`/blog/${POST_SLUG}`);
    const postLogo = await page.locator('header .logo-text').textContent();
    await page.goto(`/${LANDING_SLUG}`);
    const landingLogo = await page.locator('header .logo-text').textContent();
    expect(postLogo).toBe(landingLogo);
    expect(postLogo).toBe('amily.ai');
  });

  test('both pages use the same blog.css', async ({ page }) => {
    await page.goto(`/blog/${POST_SLUG}`);
    const postCss = await page.locator('link[rel="stylesheet"][href*="blog.css"]').count();
    await page.goto(`/${LANDING_SLUG}`);
    const landingCss = await page.locator('link[rel="stylesheet"][href*="blog.css"]').count();
    expect(postCss).toBe(1);
    expect(landingCss).toBe(1);
  });

  test('sitemap contains both the post and the landing page', async ({ page }) => {
    const res = await page.goto('/sitemap.xml');
    const xml = await res?.text();
    expect(xml).toContain(`/blog/${POST_SLUG}`);
    expect(xml).toContain(`/${LANDING_SLUG}`);
    expect(xml).toContain('/blog');
  });
});
