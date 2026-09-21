# Axe Capital website

A static, six-page corporate website for Axe Capital built with [Eleventy](https://www.11ty.dev/). Every main section is a full-screen photographic panel; copy, colours and imagery are kept in plain files so they are easy to update.

## Pages

| Route | Source | Copy |
| --- | --- | --- |
| `/` | `src/index.njk` | `src/_data/copy/home.json` |
| `/about/` | `src/about.njk` | `src/_data/copy/about.json` |
| `/growth-capital/` | `src/growth-capital.njk` | `src/_data/copy/growth-capital.json` |
| `/asset-management/` | `src/asset-management.njk` | `src/_data/copy/asset-management.json` |
| `/private-equity/` | `src/private-equity.njk` | `src/_data/copy/private-equity.json` |
| `/contact/` | `src/contact.njk` (form markup lives here) | – |

## Setup

Requires Node 20 or later.

```bash
npm install
npm run build     # generates responsive images, then builds the site into _site/
npm start         # same, then serves with live reload at http://localhost:8080
```

`node scripts/build-preview.mjs` writes a flattened copy to `_preview/` with relative links and a smaller image set, which opens from disk or hosts under any sub-path; it is for review only.

`npm run images` alone regenerates the responsive image set from `src/assets/masters/`. Generated images (`src/img/`) and the manifest are not committed; they are rebuilt on every `npm run build`.

The output in `_site/` is plain HTML, CSS, JS, fonts and images. It can be hosted on any static host (Netlify, Vercel, Cloudflare Pages, S3, a plain web server). No production domain has been configured; see `docs/HANDOVER.md`.

## Editing

- **Copy**: each page is a list of panels in its JSON file under `src/_data/copy/`. A panel has a `type` (`hero`, `full`, `split`, `final`), an `image` id, optional `label`, `heading`, `lead`, `text`, `items`, `actions` or `link`, and composition hints (`align`, `valign`, `scrim`, `flip`). The renderer is `src/_includes/partials/panel.njk`.
- **Navigation, service list and CTA**: `src/_data/site.json`.
- **Photography**: drop a master into `src/assets/masters/` and describe it in `src/assets/photos.json` (file name, focal point as `[x%, y%]`, description, source and licence). Reference it from a panel by its id. Run `npm run images`.
- **Colours, type scale, spacing**: `src/css/tokens.css`. Components are in `src/css/main.css`.
- **Fonts**: self-hosted Cormorant Garamond and Manrope in `src/assets/fonts/` (SIL Open Font License), declared in `src/css/fonts.css`, with local serif and sans-serif fallbacks.
- **Behaviour**: `src/js/main.js` handles the header state, the Expertise menu, the mobile menu, panel reveals, optional desktop scroll snapping and the contact form. The site is fully readable without JavaScript.
- **Page titles and descriptions**: front matter at the top of each page template.

## Design notes

- Panels use `min-height: 100vh` with a `100svh` fallback and are allowed to grow when content or text size demands it. Nothing is clipped to force a single screen.
- Images are served as AVIF, WebP and JPEG at several widths, with a separate 4:5 portrait crop for phones in portrait orientation. Only the first panel's image loads eagerly.
- Scroll snapping is `proximity` only, desktop only, disabled with reduced-motion preferences and removed automatically if any panel is taller than the viewport.
- Motion is limited to short fades, a subtle image settle and link/button feedback, all removed under `prefers-reduced-motion`.

See `docs/HANDOVER.md` for what is still missing and why.
