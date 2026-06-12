# Amily AI — Website

[![Live site](https://img.shields.io/badge/Live-amily.ai-blue)](https://amily.ai/)
[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange)](https://amily.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

The public marketing site for [Amily AI](https://amily.ai/) — the Melbourne-built AI voice receptionist for tradies, allied health clinics, and small businesses.

**Live at:** [https://amily.ai/](https://amily.ai/)

## What this repo is

A React + Vite + Tailwind + GSAP static site, built and deployed to Cloudflare Pages on every push to `main`. All content is markdown-driven and rendered to static HTML at build time so AI crawlers and Googlebot see the full content on first paint.

## Featured blog posts

- [AI Receptionist Cost Melbourne 2026: $149-$499/mo vs $8,300 Human](https://amily.ai/blog/virtual-receptionist-cost-melbourne-2026)
- [AI vs Human Receptionist 2026: $199/mo vs $7,000/mo + 5x Coverage](https://amily.ai/blog/ai-receptionist-vs-human-receptionist)
- [Best AI Phone Assistant for ServiceM8 + Tradify: Book Jobs 24/7 from $199/mo](https://amily.ai/blog/best-ai-phone-assistant-servicem8-tradify-australia)
- [Missed Calls Cost Melbourne Plumbers $52,000/yr: Real 2026 Math + Fix](https://amily.ai/blog/cost-of-missed-calls-melbourne-tradies)
- [What Is an AI Receptionist? $0.10/min, 24/7, Books Jobs (2026 Definition)](https://amily.ai/blog/what-is-an-ai-receptionist)

## Service areas (Melbourne + Geelong)

- [AI Receptionist Melbourne CBD](https://amily.ai/blog/service-area-melbourne-cbd)
- [AI Receptionist Box Hill, Ringwood & Eastern Suburbs](https://amily.ai/blog/service-area-box-hill-eastern-suburbs)
- [AI Receptionist Brunswick, Preston & Northern Suburbs](https://amily.ai/blog/service-area-brunswick-northern-suburbs)
- [AI Receptionist St Kilda, Prahran & South-East Melbourne](https://amily.ai/blog/service-area-st-kilda-south-east)
- [AI Receptionist Geelong, Bellarine & Surf Coast](https://amily.ai/blog/service-area-geelong-bellarine)

## Tech stack

- **React 19** + **Vite 8** + **TypeScript** + **Tailwind CSS 3** + **GSAP 3** + **Playwright** (e2e)
- **gray-matter** + **marked** for markdown-driven blog rendering
- **Cloudflare Pages** for hosting, build, and CDN
- Schema.org JSON-LD across every page (Organization, LocalBusiness, FAQPage, BlogPosting, HowTo, Person, BreadcrumbList, ImageObject)

## Local development

```bash
npm install
npm run dev          # vite dev server with HMR
npm run build        # vite build + blog render + homepage prerender
npm run test         # playwright e2e suite
```

## SEO + GEO

The site is built ground-up for Google's March 2026 core update and the AI-Overview / Perplexity citation surface. Every page ships:

- Pre-rendered static HTML (no SPA shell for crawlers)
- Number-led `<title>` and `<meta description>` (CTR-optimized)
- Per-page `og:image` variants + `/image-sitemap.xml`
- FAQPage JSON-LD on every blog post and suburb page
- HowTo JSON-LD on the setup/cost post
- Person / EEAT author markup on every post
- BreadcrumbList JSON-LD site-wide
- `robots.txt` 3-tier partition (allow retrieval-style AI bots, block extractive crawlers)
- `/llms.txt` for Perplexity + Common Crawl discovery

See [amily-ai-website PRs #6, #7, #17-#23](https://github.com/anthonynguyen394/amily-ai-website/pulls?q=is%3Apr+is%3Aclosed) for the SEO + GEO sprint history.

## License

[MIT](./LICENSE)
