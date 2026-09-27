# Axe Capital website

A static, dependency-free website for Axe Capital: growth capital, asset management and private equity.
Every page is plain HTML, one shared stylesheet and one shared script. No build step is required to deploy it.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home: hero, introduction, the three practices, approach, call to action |
| `about.html` | Who we are, the three practices, principles, how we work, stewardship |
| `growth-capital.html` | Expertise 01: overview, what we look for, how we invest, what comes with the investment |
| `asset-management.html` | Expertise 02: overview, what we manage, how we work, principles |
| `private-equity.html` | Expertise 03: overview, where we add value, how a partnership unfolds, what we look for |
| `contact.html` | Enquiry form, hours and practice links |
| `404.html` | Not-found page (point your host's 404 rule at it) |

Header, footer, the Expertise menu and the mobile menu are identical on every page, and each page marks its own
link with `aria-current="page"`.

## Structure

```
assets/
  css/site.css      shared design system (tokens, header, panels, sections, form, footer)
  js/site.js        header state, menus, reveals, the photographic stage, the enquiry form
  fonts/            Manrope (variable, self-hosted, SIL Open Font License)
  img/              seven WebP scenes shared across pages, plus favicon.svg
docs/HANDOVER.md    what still needs a decision or credentials before launch
```

## Running locally

Any static server works. For example:

```
npx http-server -p 8080 .
```

Then open `http://localhost:8080/`.

## Deploying

Upload the repository contents (excluding `docs/`, `.agents/` and `skills-lock.json` if you prefer) to any static host:
Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3 or a conventional web server. Set the host's custom 404 page to `404.html`.

## Design notes

- Palette and type are defined once as custom properties at the top of `assets/css/site.css`.
- Photographic panels (`.panel`) carry a `data-scrim` attribute (`left`, `left-strong`, `right`, `full`) that controls the
  gradient over the image, both on the connected stage and in the static fallback.
- Long-form reading copy on sub-pages uses `.prose` and is set in sentence case. Everything else follows the all-caps display style.
- The connected photographic stage mounts only when a page has two or more image panels, JavaScript is available and the
  visitor has not asked for reduced motion. Otherwise each panel simply shows its own image.
