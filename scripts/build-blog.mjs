#!/usr/bin/env node
// Markdown -> static HTML blog generator for amily.ai.
//
// - Reads `blog/*.md` (frontmatter + markdown body)
// - Renders each post through `scripts/blog-templates/post-shell.html`
// - Writes `dist/blog/<slug>.html` + `dist/blog/index.html`
// - Updates `dist/sitemap.xml` with every published post
//
// Runs as part of `npm run build` (vite build first, then this script).
// nginx `try_files $uri $uri.html` serves `/blog/<slug>` -> `<slug>.html`.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([a-zA-Z]:)/, '$1'), '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const TEMPLATE_DIR = path.join(ROOT, 'scripts', 'blog-templates');
const DIST = path.join(ROOT, 'dist');
const DIST_BLOG = path.join(DIST, 'blog');
const SITEMAP = path.join(DIST, 'sitemap.xml');

const SITE_URL = 'https://amily.ai';

function loadTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATE_DIR, name), 'utf8');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeJson(s) {
  // safe for embedding inside a JSON string literal inside JSON-LD
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}

function formatDatePretty(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
}

function readTime(markdown) {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

function buildFaqSchema(faq) {
  if (!faq || !Array.isArray(faq) || faq.length === 0) return '';
  const mainEntity = faq.map((qa) => ({
    '@type': 'Question',
    name: qa.q,
    acceptedAnswer: { '@type': 'Answer', text: qa.a },
  }));
  const json = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity }, null, 2);
  return `    <script type="application/ld+json">\n${json}\n    </script>\n`;
}

function loadPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => {
    if (!f.endsWith('.md')) return false;
    if (f.startsWith('_')) return false; // scratch files
    if (f.toLowerCase() === 'readme.md') return false; // authoring docs
    return true;
  });
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
    const parsed = matter(raw);
    const slug = parsed.data.slug || file.replace(/\.md$/, '');
    if (!parsed.data.title) throw new Error(`Missing title in blog/${file}`);
    if (!parsed.data.description) throw new Error(`Missing description in blog/${file}`);
    if (!parsed.data.date) throw new Error(`Missing date in blog/${file}`);
    // layout: 'post' (default) -> lives at /blog/<slug>, appears in /blog listing
    // layout: 'landing' -> lives at /<slug> (or path from `url`), NOT in /blog listing
    const layout = parsed.data.layout === 'landing' ? 'landing' : 'post';
    const urlPath = layout === 'landing'
      ? (parsed.data.url || `/${slug}`)
      : `/blog/${slug}`;
    // Show the date/read-time/tag strip by default on both layouts so pages
    // feel consistent. Author can suppress per-page with `showMeta: false`.
    const showMeta = parsed.data.showMeta !== undefined
      ? Boolean(parsed.data.showMeta)
      : true;
    return {
      slug,
      layout,
      urlPath,
      showMeta,
      title: parsed.data.title,
      description: parsed.data.description,
      date: parsed.data.date,
      updated: parsed.data.updated || parsed.data.date,
      tags: parsed.data.tags || [],
      faq: parsed.data.faq || null,
      draft: Boolean(parsed.data.draft),
      markdown: parsed.content,
      // Optional: hide the final "Book a discovery call" CTA if the page has its own
      hideFinalCta: Boolean(parsed.data.hideFinalCta),
      // Optional: hide from /blog listing (default: listed)
      listed: parsed.data.listed !== false,
    };
  });
  // Hide drafts; newest-first
  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderPost(post, shell) {
  const htmlBody = marked.parse(post.markdown);
  const dateIso = new Date(post.date).toISOString();
  const updatedIso = new Date(post.updated).toISOString();

  // Meta strip: only rendered for posts (not landing pages) where showMeta = true
  let metaStrip = '';
  if (post.showMeta) {
    const tagList = post.tags.length
      ? ` <span class="divider">&middot;</span> ` +
        post.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(' <span class="divider">&middot;</span> ')
      : '';
    const readTimeHtml = ` <span class="divider">&middot;</span> ${readTime(post.markdown)}`;
    metaStrip = `        <p class="post-meta">${formatDatePretty(post.date)}${readTimeHtml}${tagList}</p>`;
  }

  // Back-link destination: blog posts go back to /blog; landing pages to /.
  const backHref = post.layout === 'landing' ? '/' : '/blog';
  const backLabel = post.layout === 'landing' ? 'Back to home' : 'All posts';

  // Final CTA: on by default, suppressible via frontmatter `hideFinalCta: true`
  const finalCta = post.hideFinalCta
    ? ''
    : `        <div class="final-cta">
          <h2>Want to see Amily answer your business phone?</h2>
          <p>Book a free 30-minute discovery call. We set up a test number using your business details and you hear what your customers would hear.</p>
          <a href="https://cal.com/amily-ai-anthony/discovery" class="btn-primary">Book a discovery call</a>
        </div>`;

  return shell
    .replaceAll('{{TITLE}}', escapeHtml(post.title))
    .replaceAll('{{TITLE_JSON}}', escapeJson(post.title))
    .replaceAll('{{DESCRIPTION}}', escapeHtml(post.description))
    .replaceAll('{{DESCRIPTION_JSON}}', escapeJson(post.description))
    .replaceAll('{{SLUG}}', post.slug)
    .replaceAll('{{URL_PATH}}', post.urlPath)
    .replaceAll('{{DATE_ISO}}', dateIso)
    .replaceAll('{{UPDATED_ISO}}', updatedIso)
    .replaceAll('{{BACK_HREF}}', backHref)
    .replaceAll('{{BACK_LABEL}}', backLabel)
    .replaceAll('{{META_STRIP}}', metaStrip)
    .replaceAll('{{FAQ_SCHEMA}}', buildFaqSchema(post.faq))
    .replaceAll('{{FINAL_CTA}}', finalCta)
    .replaceAll('{{CONTENT}}', htmlBody);
}

function renderIndex(posts, shell) {
  if (posts.length === 0) {
    return shell.replaceAll('{{POST_LIST}}', `<div class="post-list-empty">No posts yet. Check back soon.</div>`);
  }
  // Every page (post + landing) appears in the listing unless its frontmatter
  // sets `listed: false`. This makes /blog the single catalogue of written
  // content on the site. Landing pages link to their root URL, not /blog/.
  const listable = posts.filter((p) => p.listed !== false);
  if (listable.length === 0) {
    return shell.replaceAll('{{POST_LIST}}', `<div class="post-list-empty">No posts yet. Check back soon.</div>`);
  }
  const items = listable
    .map((post) => {
      const tagList = post.tags.length
        ? post.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(' <span class="divider">&middot;</span> ')
        : '';
      const tagBlock = tagList ? ` <span class="divider">&middot;</span> ${tagList}` : '';
      return `<a class="post-card" href="${post.urlPath}">
  <div class="post-card-meta">${formatDatePretty(post.date)}${tagBlock}</div>
  <h2>${escapeHtml(post.title)}</h2>
  <p>${escapeHtml(post.description)}</p>
</a>`;
    })
    .join('\n');
  return shell.replaceAll('{{POST_LIST}}', items);
}

function updateSitemap(posts) {
  // Static entries we always want in the sitemap.
  const staticEntries = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0', lastmod: todayIso() },
    { loc: `${SITE_URL}/privacy.html`, changefreq: 'yearly', priority: '0.3', lastmod: '2026-04-22' },
    { loc: `${SITE_URL}/blog`, changefreq: 'weekly', priority: '0.7', lastmod: todayIso() },
  ];

  // All markdown pages (blog posts + landing pages) contribute sitemap rows.
  // Landing pages get higher priority since they're revenue-driving.
  const postEntries = posts.map((p) => ({
    loc: `${SITE_URL}${p.urlPath}`,
    changefreq: p.layout === 'landing' ? 'monthly' : 'monthly',
    priority: p.layout === 'landing' ? '0.9' : '0.7',
    lastmod: isoDate(p.updated),
  }));

  const entries = [...staticEntries, ...postEntries];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) =>
          `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
      )
      .join('\n') +
    `\n</urlset>\n`;

  fs.writeFileSync(SITEMAP, xml);
}

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ not found. Run `vite build` first (npm run build does this automatically).');
    process.exit(1);
  }
  fs.mkdirSync(DIST_BLOG, { recursive: true });

  const posts = loadPosts();
  const postShell = loadTemplate('post-shell.html');
  const indexShell = loadTemplate('index-shell.html');

  // Write each page -- blog posts go to dist/blog/<slug>.html, landing pages
  // go to dist/<slug>.html so their URL path is at the site root.
  for (const post of posts) {
    const html = renderPost(post, postShell);
    if (post.layout === 'landing') {
      // e.g. urlPath="/ai-voice-receptionist-melbourne-small-business"
      //      -> dist/ai-voice-receptionist-melbourne-small-business.html
      const outPath = path.join(DIST, `${post.urlPath.replace(/^\//, '')}.html`);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log(`  page: ${post.urlPath}`);
    } else {
      fs.writeFileSync(path.join(DIST_BLOG, `${post.slug}.html`), html);
      console.log(`  blog: ${post.urlPath}`);
    }
  }

  // Write the listing page in TWO places so both /blog and /blog/ resolve
  // regardless of whether the SPA fallback runs first:
  //   - dist/blog/index.html  serves /blog/ (trailing slash)
  //   - dist/blog.html        serves /blog  (no slash, via nginx $uri.html)
  // Without the .html variant, /blog falls through to the React SPA.
  const listingHtml = renderIndex(posts, indexShell);
  fs.writeFileSync(path.join(DIST_BLOG, 'index.html'), listingHtml);
  fs.writeFileSync(path.join(DIST, 'blog.html'), listingHtml);
  const listedCount = posts.filter((p) => p.listed !== false).length;
  console.log(`  blog: /blog (index, ${listedCount} page${listedCount === 1 ? '' : 's'})`);

  // Rewrite the sitemap with all pages + blog posts.
  updateSitemap(posts);
  console.log(`  blog: sitemap.xml updated`);
}

main();
