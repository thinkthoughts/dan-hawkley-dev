# danhawkley.dev news homepage

A minimal, JSON-built homepage focused on recent engineering objects.

## Files

- `index.html`
- `js/site-builder.js`
- `data/latest.json`
- `styles/news.css`

The existing `/styles/site.css` remains in use so the current site-wide design,
avatar treatment, and dark-mode variables can continue to work.

## Publish

Copy these files into the matching paths in the `danhawkley.dev` repository.

Serve through HTTP/HTTPS rather than opening `index.html` directly, because
the browser must fetch `/data/latest.json`.
