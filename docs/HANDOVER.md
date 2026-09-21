# Handover checklist

Items that could not be completed from the supplied brief alone. Nothing in this list has been invented in the visitor-facing copy.

## Missing assets

1. **Screenshots of the existing site.** The brief refers to attached screenshots; none were included in the upload. Section 1 of the brief was used as the source of the business content. Please supply the screenshots so the copy can be checked against the original material.
2. **Photography masters at 2560–3840 px.** Stock photo services were not reachable from the build environment, so the site uses thirteen genuine CC0 photographs sourced from public repositories (credits below). They are real, professionally shot architecture and interiors, but most masters are 1200–2000 px wide, below the brief's target for full-screen display. Replace with licensed 2560 px+ masters (or higher-resolution downloads of the same CC0 photographs from the source links) by dropping them into `src/assets/masters/` under the same file names and running `npm run images`.
3. **More distinct images.** Twenty-two panels share thirteen photographs. Each image is used at most three times, always on different pages with a different crop or composition. Around nine further images would give every panel its own photograph: ideally a waterfront cityscape at dawn (Asset Management), two or three contemporary business interiors, and two more architectural details.
4. **Logo.** No logo was supplied. The site uses a provisional typographic "AXE CAPITAL" wordmark with a small "A" mark, in Cormorant Garamond. Replace `src/_includes/partials/wordmark.njk` and `src/assets/favicon.svg` when approved artwork exists.

## Company facts to confirm

- Contact details (email, phone, postal address). None are shown; the footer carries a note that they will follow.
- Legal entity name, regulatory status and any required disclaimers or notices. No legal pages have been created.
- Privacy notice and cookie policy text, if required for the enquiry form.
- Founding date, team, locations, assets under management, track record. None are mentioned.
- The colour palette is a proposal derived from the existing pale blue; confirm against brand standards if any exist.
- Copy was rewritten from the brief's summary of the screenshots. Please review every panel in `src/_data/copy/` for accuracy.

## Live integrations

- **Enquiry form destination.** The Contact form validates input but does not send anything. The page shows a visible "not yet connected" notice and the submit handler reports that the message was not delivered. Wire `src/js/main.js` (the block marked "No submission endpoint") to the chosen service, or set the form's `action` to a form-handling endpoint and remove the `preventDefault` branch.
- **Deployment address.** No domain is configured, so canonical URLs and final social-share metadata are not set. Add them in `src/_includes/layouts/base.njk` once the address is known.
- **Analytics or consent tooling**, if wanted.

## Photography credits (all CC0 1.0, public domain)

| Id | Used on | Source |
| --- | --- | --- |
| hero-diagrid | Home hero | https://pxhere.com/en/photo/56714 |
| museum-hall | Home intro, Asset Management | https://www.rawpixel.com/image/3297419/free-photo-image-interior-hallway-architecture |
| timber-soffit | Home, Growth Capital hero | https://www.rawpixel.com/image/3289063/free-photo-image-architectural-detail-architecture |
| balconies | Home, Asset Management hero | https://www.rawpixel.com/image/3286725/free-photo-image-black-and-white-background-photos |
| spiral-stair | Home, Private Equity hero | https://www.rawpixel.com/image/3286187/free-photo-image-person-stairs-architecture |
| window-grid | Home approach, Growth Capital closing | https://www.rawpixel.com/image/3286615/free-photo-image-texture-architecture-building |
| roof-sky | Home closing, Asset Management closing | https://www.rawpixel.com/image/430335/free-photo-image-architecture-building-roof |
| concrete-upward | About hero, Private Equity | https://pxhere.com/en/photo/1571681 |
| facade-detail | About, Growth Capital | https://www.rawpixel.com/image/3283970/free-photo-image-pattern-artwork-abstract |
| desk-work | About, Growth Capital, Private Equity | https://www.foodiesfeed.com/free-food-photo/laptop-work-with-coffee/ |
| pendant-interior | About closing, Private Equity closing | https://stocksnap.io/photo/architecture-house-9QLIF5KSSQ |
| panelled-room | Asset Management | https://www.rawpixel.com/image/3303438/free-photo-image-wood-paneling-door-panel |
| lounge | Contact | https://www.rawpixel.com/image/3283247/free-photo-image-interior-cafe-home-design |

The photographs show buildings and people unconnected with Axe Capital. Nothing on the site presents them as Axe Capital offices, staff or clients.
