# Handover: items to complete before launch

Everything below needs information or a decision from Axe Capital. The site works without them, but each one is visible to visitors.

## 1. Connect the enquiry form

`contact.html` contains `<form id="enquiry-form" ... data-endpoint="">`.

- Set `data-endpoint` to a form-handling URL that accepts a `POST` with `multipart/form-data` and returns a 2xx status
  (Formspree, Basin, Getform, Netlify Forms and most CRM web-to-lead endpoints all qualify).
- Until it is set, the form validates and then tells the visitor plainly that nothing was sent.
- The form posts these fields: `name`, `email`, `organisation`, `topic`, `message`, `consent`, plus a hidden honeypot
  `company_website` that should be empty for genuine submissions.

## 2. Add direct contact details

In `contact.html`, inside `<dl class="facts">`, there is a commented-out block for email, telephone and office address.
Fill it in and remove the comment markers. Consider adding the same email to the footer once confirmed.

## 3. Domain-dependent metadata

Once the production URL is known:

- Add `<link rel="canonical" href="https://…/page.html">` to each page.
- Add an absolute `og:image` (a 1200×630 crop of `assets/img/top.webp` works well) so shared links carry a preview.
- Add `sitemap.xml` and `robots.txt`.
- Update the `"url"` in the JSON-LD block in `index.html`.

## 4. Legal and regulatory copy

Financial services websites usually need a privacy notice, cookie statement, regulatory status and risk disclaimers.
The contact page carries a one-line note that nothing on the site is investment advice; the full text should come from
Axe Capital's legal advisers. A footer link can be added to the `site-footer__nav` block on each page.

## 5. Content review

- All sub-page copy was written to match the tone and claims of the original home page. No figures, named people,
  fund sizes or track-record statements were invented. Please review and adjust to reflect the firm accurately.
- Image alt text describes the current photography; update it if images change.

## 6. Optional

- Analytics: add the snippet before `</head>` on every page, respecting any consent requirements.
- Hosting 404: point the host's custom error page at `404.html`.
