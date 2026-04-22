# Blog

How to write and publish blog posts on amily.ai.

## Quick publish workflow

```bash
# 1. Create a new post file
#    File name becomes the URL slug, so keep it lowercase + hyphens.
touch blog/my-new-post.md

# 2. Write the post (see "Post structure" below)

# 3. Preview locally
npm run build
npm run preview
# open http://localhost:4173/blog

# 4. Ship
git add blog/ public/ scripts/ && git commit -m "blog: <title>"
git push
ssh amily-pi "cd ~/amily-ai-website && git pull && docker compose -f deploy/docker-compose.yml up -d --build"
```

## Post structure

Every post is a markdown file with YAML frontmatter at the top:

```markdown
---
title: "Why Melbourne tradies miss 22% of calls"
description: "Average Australian tradie loses $35k a year to unanswered enquiries. Here is the maths and what to do about it."
date: 2026-04-22
updated: 2026-04-22          # optional, defaults to date
tags: [trades, missed-calls]  # optional
draft: false                  # optional, omit or set false to publish
faq:                          # optional, generates FAQ schema for rich snippets
  - q: How many calls does the average tradie miss?
    a: Australian small businesses miss 22-62% of inbound calls...
  - q: How much does each missed call cost?
    a: Home-service operators lose A$300-1,200 per missed call...
---

Your post body in markdown. Standard markdown works — headings, lists,
**bold**, *italic*, [links](https://example.com), tables, blockquotes,
code blocks, images (put images in `public/assets/` and reference as
`![alt](/assets/my-image.png)`).

## Use H2 (##) for section headings

H1 is auto-generated from the `title` frontmatter.

### H3 for subsections is fine too.
```

## What the build does

`scripts/build-blog.mjs` runs automatically as part of `npm run build`:

- Reads every `blog/*.md`
- Skips files where `draft: true`
- Renders each post through `scripts/blog-templates/post-shell.html`
  (fonts, GA4, schema.org Article/FAQ, header, footer, CTA)
- Writes each post to `dist/blog/<slug>.html`
- Writes the listing page to `dist/blog/index.html` (served as `/blog`)
- Regenerates `dist/sitemap.xml` including every published post

Nothing outside `dist/` is touched — your source markdown stays clean.

## URLs

- `amily.ai/blog` -> the listing page (newest first)
- `amily.ai/blog/<filename-without-.md>` -> each post

The nginx `try_files $uri $uri.html` rule handles the extensionless URLs.

## Drafts

Set `draft: true` in the frontmatter. The post is not rendered, not
included in the listing, and not added to the sitemap. Remove the flag
(or set `false`) when you are ready to ship.

## SEO notes

- Every post gets canonical URL, Open Graph tags, Twitter Card, Article schema
- `faq` frontmatter auto-generates FAQ schema (eligible for rich results)
- Sitemap is rewritten on every build and lists every live post
- After shipping a new post, Google Search Console -> URL Inspection ->
  paste the new URL -> Request indexing (speeds up first crawl)
