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

// Build a HowTo JSON-LD block from a frontmatter howto: array of {name, text}
// step objects. Emits a complete <script type="application/ld+json"> tag.
// Returns empty string when no howto frontmatter is set so post-shell can
// include the placeholder unconditionally.
function buildHowtoSchema(howto) {
  if (!howto) return '';
  // Accept three forms:
  // 1. Bare array: [{name, text}, ...]
  // 2. Wrapped object: {title, steps: [{name, text}, ...]}
  // 3. Wrapped object with `name` instead of `steps` for compatibility
  let steps = [];
  let title = 'How-to guide';
  if (Array.isArray(howto)) {
    steps = howto;
  } else if (typeof howto === 'object') {
    if (Array.isArray(howto.steps)) {
      steps = howto.steps;
    } else if (Array.isArray(howto.step)) {
      steps = howto.step;
    } else if (Array.isArray(howto.name)) {
      steps = howto.name;
    }
    if (typeof howto.title === 'string' && howto.title.trim()) {
      title = howto.title.trim();
    } else if (steps[0] && steps[0].name) {
      title = String(steps[0].name);
    }
  }
  const stepList = steps
    .filter((s) => s && s.name && s.text)
    .map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: String(s.name),
      text: String(s.text),
    }));
  if (stepList.length === 0) return '';
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    step: stepList,
  }, null, 2);
  return `    <script type="application/ld+json">\n${json}\n    </script>\n`;
}

// Build a BreadcrumbList JSON-LD block reflecting the page's site hierarchy.
//  - Homepage:               just itself
//  - Landing page (e.g. /ai-voice-receptionist-melbourne-small-business): Home > Page
//  - Blog post (layout: 'post'):           Home > Blog > Post Title
//  - Service-area / other blog posts:      Home > Blog > Post Title (treated as blog)
// Returns a complete <script type="application/ld+json"> tag, or '' when the
// page is a root-level page that does not need a breadcrumb.
function buildBreadcrumbSchema(post) {
  // Skip the homepage itself (the React SPA does not use this generator).
  if (!post) return '';
  const home = { name: 'Home', item: `${SITE_URL}/` };
  let crumbs;
  if (post.layout === 'landing') {
    // Landing pages sit at the site root -- Home > Page only.
    crumbs = [
      home,
      { name: post.title, item: `${SITE_URL}${post.urlPath}` },
    ];
  } else {
    // Blog posts (including service-area pages, which live under /blog/).
    crumbs = [
      home,
      { name: 'Blog', item: `${SITE_URL}/blog` },
      { name: post.title, item: `${SITE_URL}${post.urlPath}` },
    ];
  }
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  }, null, 2);
  return `    <script type="application/ld+json">\n${json}\n    </script>\n`;
}

// Build the visible breadcrumb navigation shown above the H1. Returns the
// HTML string for a schema-friendly <nav aria-label="Breadcrumb"> with an
// ordered list, matching the existing blog.css visual style.
function buildBreadcrumbSchemaForBlogIndex() {
  // The /blog listing is itself a 2-item breadcrumb: Home > Blog.
  const crumbs = [
    { name: 'Home', item: `${SITE_URL}/` },
    { name: 'Blog', item: `${SITE_URL}/blog` },
  ];
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  }, null, 2);
  return `    <script type="application/ld+json">\n${json}\n    </script>\n`;
}

function buildBreadcrumbNav(post) {
  if (!post) return '';
  const home = `<a href="/">Home</a>`;
  let parts;
  if (post.layout === 'landing') {
    // Landing pages: just the page title, prefixed by Home (so visitors can
    // see they're not on the homepage without a "Blog" segment that's wrong
    // for non-blog root pages).
    parts = [home, `<span aria-current="page">${escapeHtml(post.title)}</span>`];
  } else {
    parts = [home, `<a href="/blog">Blog</a>`, `<span aria-current="page">${escapeHtml(post.title)}</span>`];
  }
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol>
    <li>${parts[0]}</li>
    <li>${parts[1]}</li>${parts[2] ? `\n    <li>${parts[2]}</li>` : ''}
  </ol>
</nav>`;
}

// Build a Person JSON-LD block from the canonical author profile. This is the
// E-E-A-T signal Google looks for on YMYL/business topics. Author is the
// Amily AI founder -- details are intentionally minimal and verifiable on the
// public website.
function buildPersonSchema() {
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Anthony Nguyen',
    jobTitle: 'Founder & AI Engineer',
    worksFor: {
      '@type': 'Organization',
      name: 'Amily AI',
      url: 'https://amily.ai',
    },
    url: 'https://amily.ai',
    sameAs: [
      'https://www.linkedin.com/in/anthonynguyen394',
    ],
    description:
      'Founder of Amily AI (Melbourne, ABN86758863858). Cloud Engineering Manager at Cube by day, builds AI voice receptionists and automation for Australian small businesses by night.',
    knowsAbout: [
      'AI voice receptionists',
      'Cal.com booking integrations',
      'Australian Privacy Act 1988',
      'ServiceM8 / Tradify / Cliniko / Halaxy',
      'Twilio + ElevenLabs voice agents',
    ],
  };
  const json = JSON.stringify(person, null, 2);
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
      // Optional: per-page hero/OG image (path under public/, e.g. /assets/post-03-hero.png).
      // When set, build per-page og:image, twitter:image, BlogPosting.image, and
      // include in /image-sitemap.xml. Falls back to the default og-image.png.
      image: typeof parsed.data.image === 'string' && parsed.data.image.trim() ? parsed.data.image.trim() : null,
      imageAlt: typeof parsed.data.imageAlt === 'string' && parsed.data.imageAlt.trim() ? parsed.data.imageAlt.trim() : null,
      faq: parsed.data.faq || null,
      // Optional: HowTo JSON-LD steps. Each step is {name, text}.
      howto: parsed.data.howto || null,
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
    // If the post has been updated since first publication, surface an
    // explicit "Updated <date>" line so readers (and Google) can see the
    // refresh without inspecting the page metadata. Only when dates differ.
    const isUpdated = post.updated && post.date && new Date(post.updated).getTime() > new Date(post.date).getTime();
    if (isUpdated) {
      metaStrip += `\n        <p class="post-updated">Published ${formatDatePretty(post.date)} &middot; Updated ${formatDatePretty(post.updated)}</p>`;
    }
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

  // Per-page image resolution. Falls back to the default /assets/og-image.png
  // when the post has no `image:` frontmatter. The JSON-LD `image` always
  // points to the absolute https URL (schema.org requirement).
  const defaultImagePath = '/assets/og-image.png';
  const imagePath = post.image || defaultImagePath;
  const imageUrl = imagePath.startsWith('http')
    ? imagePath
    : `${SITE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  const imageAlt = post.imageAlt
    ? escapeHtml(post.imageAlt)
    : escapeHtml(post.title);

  return shell
    .replaceAll('{{TITLE}}', escapeHtml(post.title))
    .replaceAll('{{TITLE_JSON}}', escapeJson(post.title))
    .replaceAll('{{SCHEMA_TYPE}}', post.layout === 'landing' ? 'Article' : 'BlogPosting')
    .replaceAll('{{DESCRIPTION}}', escapeHtml(post.description))
    .replaceAll('{{DESCRIPTION_JSON}}', escapeJson(post.description))
    .replaceAll('{{SLUG}}', post.slug)
    .replaceAll('{{URL_PATH}}', post.urlPath)
    .replaceAll('{{DATE_ISO}}', dateIso)
    .replaceAll('{{UPDATED_ISO}}', updatedIso)
    .replaceAll('{{BACK_HREF}}', backHref)
    .replaceAll('{{BACK_LABEL}}', backLabel)
    .replaceAll('{{META_STRIP}}', metaStrip)
    .replaceAll('{{OG_IMAGE}}', imageUrl)
    .replaceAll('{{OG_IMAGE_ALT}}', imageAlt)
    .replaceAll('{{TWITTER_IMAGE}}', imageUrl)
    .replaceAll('{{JSON_LD_IMAGE}}', imageUrl)
    .replaceAll('{{FAQ_SCHEMA}}', buildFaqSchema(post.faq))
    .replaceAll('{{HOWTO_SCHEMA}}', buildHowtoSchema(post.howto))
    .replaceAll('{{PERSON_SCHEMA}}', buildPersonSchema())
    .replaceAll('{{BREADCRUMB_SCHEMA}}', buildBreadcrumbSchema(post))
    .replaceAll('{{BREADCRUMB_NAV}}', buildBreadcrumbNav(post))
    .replaceAll('{{FINAL_CTA}}', finalCta)
    .replaceAll('{{CONTENT}}', htmlBody);
}

function renderIndex(posts, shell) {
  const schema = buildBreadcrumbSchemaForBlogIndex();
  const filled = shell.replaceAll('{{BLOG_INDEX_BREADCRUMB_SCHEMA}}', schema);
  if (posts.length === 0) {
    return filled.replaceAll('{{POST_LIST}}', `<div class="post-list-empty">No posts yet. Check back soon.</div>`);
  }
  // Every page (post + landing) appears in the listing unless its frontmatter
  // sets `listed: false`. This makes /blog the single catalogue of written
  // content on the site. Landing pages link to their root URL, not /blog/.
  const listable = posts.filter((p) => p.listed !== false);
  if (listable.length === 0) {
    return filled.replaceAll('{{POST_LIST}}', `<div class="post-list-empty">No posts yet. Check back soon.</div>`);
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
  return filled.replaceAll('{{POST_LIST}}', items);
}

function updateSitemap(posts) {
  // Static entries we always want in the sitemap.
  const staticEntries = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0', lastmod: todayIso() },
    { loc: `${SITE_URL}/privacy`, changefreq: 'yearly', priority: '0.3', lastmod: '2026-04-22' },
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

// Build /image-sitemap.xml following Google's image sitemap extension spec.
// Lists every page that has a per-page `image:` frontmatter set, with the
// accompanying <image:title> and <image:caption> for richer indexing.
//
// Reference: https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
//
// We deliberately keep this small: only posts that have a dedicated hero
// image go in. The default /assets/og-image.png is shared by every page
// (used as a fallback og:image), so it has no editorial value to expose
// in an image sitemap -- the only images worth indexing are the unique
// per-post hero PNGs.
function updateImageSitemap(posts) {
  const IMAGE_NS = 'http://www.google.com/schemas/sitemap-image/1.1';
  const entries = posts
    .filter((p) => p.image) // only posts with a per-page image
    .map((p) => {
      const imagePath = p.image.startsWith('http')
        ? p.image
        : `${SITE_URL}${p.image.startsWith('/') ? '' : '/'}${p.image}`;
      // Per Google's docs, the page URL is the enclosing <loc>, and the
      // images live as <image:image> children. We emit one <image> block
      // per image (one per page, but the schema supports more).
      const imageTitle = escapeXml(p.title);
      const imageCaption = p.imageAlt
        ? escapeXml(p.imageAlt)
        : escapeXml(p.description.slice(0, 200));
      return `  <url>
    <loc>${SITE_URL}${p.urlPath}</loc>
    <image:image>
      <image:loc>${imagePath}</image:loc>
      <image:title>${imageTitle}</image:title>
      <image:caption>${imageCaption}</image:caption>
    </image:image>
  </url>`;
    });

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:image="${IMAGE_NS}">\n` +
    entries.join('\n') +
    `\n</urlset>\n`;

  const imageSitemapPath = path.join(DIST, 'image-sitemap.xml');
  fs.writeFileSync(imageSitemapPath, xml);
  return entries.length;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

  // Rewrite the image sitemap (Google image sitemap extension) with the
  // subset of posts that have a per-page hero image.
  const imageCount = updateImageSitemap(posts);
  console.log(`  blog: image-sitemap.xml updated (${imageCount} image${imageCount === 1 ? '' : 's'})`);
}

main();
