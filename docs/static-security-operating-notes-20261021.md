# Static storefront security boundary (2026-10-21)

Production is **GitHub Pages with Cloudflare as a proxy**. This repository
publishes HTML, CSS, JavaScript, public product metadata and free tools. It
does not contain a login service, API, private database or per-customer backend.
Keeping paid products hidden is a storefront-display policy; it does **not**
make URLs or public Git-tracked metadata secret.

## Controls checked in source

| Principle | Actual control / limit |
| --- | --- |
| Rate limiting | This static repository has no server on which to enforce request quotas. Any real IP/bot rate limiting belongs in the existing Cloudflare zone's security settings after testing false positives for real visitors and search crawlers. Do not add JavaScript-only rate limits and claim they protect the origin. |
| Authentication | Public pages, free calculators and the SEO dashboard have no accounts or server-side admin actions. The dashboard's `noindex` is for search engines, **not access protection**. Do not place credentials, customer files or administrative functions at public static URLs. |
| User data separation | Calculator, CV and analytics data live in the current browser's origin storage. Different devices/browser profiles separate local data; users sharing a browser profile share the same local storage. This is not account isolation. |
| Secrets | `qa/static-security-qa.mjs` checks Git-tracked files for excluded private archives and high-confidence credential patterns; the existing ignore rules remain. CI is a preventive check, not a retrospective secret-rotation mechanism. |
| Safe caching | Public versioned assets keep existing version strings. Product registry requests now use browser `cache: 'no-cache'` to request revalidation. Cloudflare edge cache behavior is independent and must be inspected at the zone if registry data is changed; `_headers`/CSP files are not supported by GitHub Pages. |
| Load / smoke | `qa/static-smoke-load.mjs` uses 48 **localhost-only** requests, concurrency 4. It checks working routes and that the paid catalog remains paused. Its p95 measures this local test server only, not live edge latency or capacity. |
| Backups | Git history and branches preserve published source, while local user data requires exported backup files: the free calculator supports a JSON backup/restore; the CV tool provides JSON export; SEO dashboard provides CSV exports for events. Keep original Search Console/order CSV inputs if you need to reconstruct the dashboard. These are manual, browser-local backups, not scheduled offsite backup. |

The SEO dashboard also treats CSV/imported/localStorage strings as untrusted
text and escapes them before rendering. Analytics CSV exports prefix cells
starting with spreadsheet formula triggers; referrer URLs are reduced to their
origin so query tokens are not included in newly recorded events or CSV
exports of historic events. Historic data already stored in a browser is not
automatically rewritten.

## Reviewer checklist

1. Run `node qa/store-qa.mjs` and `node qa/static-security-qa.mjs`.
2. Run `node qa/static-smoke-load.mjs` locally. Do not direct this load test at production.
3. Confirm `data/storefront-mode.json` has `productsVisible: false` and the paused storefront QA passes.
4. Verify the existing live Cloudflare caching and security rules **separately** before changing any edge setting. GitHub Pages cannot enforce authorization or per-IP limits on its own.
