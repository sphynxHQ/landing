# Sphynx — pre-launch landing page

**Sphynx** is self-hosted bot defense: your traffic never leaves your own servers.

This repository is only the marketing page: the crest, the pitch, and a launch-notice form.
It is **not** the product. The scoring service, widget, dashboard and kernel layer do not
exist here and are not published yet.

Live: <https://sphynx.site>

---

## What is on the page

- A single static page, no framework, no build step, no tracking, no third-party requests.
- The Sphynx crest, drawn as an inline SVG (`assets/sphinx.svg` is the same asset on its own).
- Self-hosted Cinzel (display) and Instrument Sans (body + italic), OFL licensed, subset to
  Latin and served from `assets/fonts/`.
- One interactive thing: an email field for the launch notice, posting JSON to `/subscribe`.

## Layout

    index.html                    the whole page: markup, CSS, JS, crest
    404.html                      matching not-found page
    _headers                      security + cache headers (CSP, HSTS, immutable assets)
    robots.txt
    assets/
      favicon.svg                 tab icon
      sphinx.svg                  crest, standalone
      fonts/                      cinzel, instrument-sans (roman + italic), woff2
    functions/subscribe.js        Pages Function: POST /subscribe, GET /subscribe?token=
    migrations/0001_subscribers.sql   D1 schema for the signup list
    wrangler.toml                 Pages project + D1 binding
    build.sh                      copies static files into dist/ for upload
    tools/make_emblem.py          generator that produced the crest geometry

## Run it locally

    python -m http.server 8899 --bind 127.0.0.1
    # open http://127.0.0.1:8899

On `localhost` the form writes to `localStorage` instead of calling the API, so a local
preview never shows a failed request. Everything else is identical.

To exercise the real function locally you need Wrangler:

    npx wrangler d1 execute sphynx-subscribers --local --file=migrations/0001_subscribers.sql
    printf 'ADMIN_TOKEN=devtoken\n' > .dev.vars
    npx wrangler pages dev . --port 8788

## Deploy

Cloudflare Pages, no build command, output directory `dist/`.

    ./build.sh
    npx wrangler pages deploy dist --project-name=sphynx-site --branch=main

One-time setup:

1. `npx wrangler d1 create sphynx-subscribers`, put the id in `wrangler.toml`
2. `npx wrangler d1 execute sphynx-subscribers --remote --file=migrations/0001_subscribers.sql`
3. `npx wrangler pages secret put ADMIN_TOKEN`
4. Add the custom domain in the Pages project, plus a proxied `CNAME @ -> sphynx-site.pages.dev`

Note that Pages secrets apply to the **next** deployment, so redeploy after setting one.

## The signup form

`/subscribe` accepts `{"email": "..."}` only.

- strict shape validation (length, local part, dots, ASCII domain, real TLD)
- 4 KB body cap, `413` above it
- honeypot field filled in by a bot gets a fake `200` and stores nothing
- duplicates return the same `200` as a fresh signup, so the endpoint cannot be used to test
  whether an address is subscribed
- POST only; anything else gets `405`

Read the list back as CSV (requires the admin token):

    https://sphynx.site/subscribe?token=<ADMIN_TOKEN>

or from the CLI:

    npx wrangler d1 execute sphynx-subscribers --remote \
      --command "SELECT id,email,created_at,country FROM subscribers ORDER BY id DESC"

## Security posture

- Strict CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, referrer and permissions policy in `_headers`.
- No cookies are set, no analytics, no external scripts, fonts served from this origin.
- The admin token lives only in a Pages secret; `.dev.vars` and `dist/` are gitignored.

Known gaps tracked for launch: rate limiting on `/subscribe`, DMARC, and minimum TLS version
are configured on the Cloudflare zone rather than in this repository.

## Status

Pre-launch. Issues and typo fixes are welcome; pull requests may sit until the product ships.

Contact: help@sphynx.site

## Licence

Apache-2.0 — see `LICENSE`. Free to use, modify and redistribute, including inside closed
products, as long as the copyright notice and `NOTICE` travel with it. Section 6 does not
grant trademark rights: the name Sphynx and the winged-eye crest stay with the project.

Bundled fonts are SIL OFL 1.1 (Cinzel, Instrument Sans), which permits bundling and
self-hosting; the OFL requires the fonts keep their own licence, not this one.

The product itself (scoring service, widget, dashboard, XDP layer) is a separate decision and
is not covered by this licence.
