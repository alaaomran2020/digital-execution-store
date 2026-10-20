# Shared premium storefront integration

## Reference and scope

The supplied `stitch_digital_execution_premium_redesign (1).zip` contains one studio concept (`code.html`, `screen.png`, `DESIGN.md`), rather than separate designs for all store pages. Its light canvas, blue/violet accents, dark feature panels, spacing and card language have been adapted to the remaining site. The already published graphic-design studio remains independent and unchanged.

The refresh covers the homepage, tool directory, pricing and break-even calculators, inventory check, CV app shell, services hub, knowledge directory, all 29 guides, resource drafts, support, legal pages and 404. Existing URLs and article/legal body content are retained. The commercial catalogue and its historical registry remain paused. The resource directory, prompt library and AI chooser retain their existing noindex state and stay out of global navigation and the sitemap.

## Implementation

- `site-premium.css` provides shared visual tokens and local typography. Six WOFF2 subsets from Fontsource IBM Plex Sans Arabic 5.3.0 and Alexandria 5.3.0 are committed alongside their OFL licenses; no font CDN or runtime Tailwind is required.
- The public header and footer share navigation and mobile-menu behavior. Tool and service navigation stay within their sections. The studio keeps its separate shell.
- The homepage keeps its working markup preview and free download; the platform introduction adds clear paths to tools, knowledge and design services.
- Tools and guides progressively enhance their server-rendered cards with local Arabic-normalized search, category filters, counts and empty-state recovery. All content stays visible if JavaScript is unavailable.
- Every existing guide has contents links to actual headings. The hub now lists all 29 existing routes.
- Calculator form IDs, arithmetic and local processing remain intact. Inputs now label EGP units and have finite bounds; invalid break-even scenarios clear old results. The inventory check hides stale results after validation errors and no longer promotes paused commercial products in its advice.
- The CV editor retains its own controls rather than having its app header replaced by shared navigation. Save, theme switching and print isolation are tested. Resume templates and export metrics remain independent from the public stylesheet.
- Resource search, local favorites, prompt copy and the AI chooser keep their existing implementations. Legal copy is unchanged.

The maximum homepage CSS transfer is currently approximately 39 KB before compression, including the shared shell and home interaction styles; fonts are separate, locally served and cached. The revised QA budget is 43 KB and still requires at least a 50% reduction against the old full legacy bundle. The prior compact dark-theme budget is intentionally replaced to account for the broader shared design system.

## Validation

Run from the repository root with Node 22:

```sh
for f in store-qa free-resources-qa site-sections-qa design-studio-images-qa free-release-qa m1m2-storefront-qa premium-site-qa; do
  node "qa/$f.mjs" || exit
done
```

Start `python3 -m http.server 4173 --bind 127.0.0.1`, then run `node qa/premium-site-browser-qa.mjs` with Playwright 1.56.1 available. `CHROMIUM_PATH` optionally selects an installed Chromium. `PREMIUM_QA_OUTPUT` optionally moves screenshots and reports outside the checkout.

The current run passed 536 assertions: 45 routes at 320 and 1440 pixels, 16 representative routes at 390 and 768 pixels, followed by real filtering, empty-state reset, Arabic search, calculator arithmetic and errors, inventory score and validation, prompt favorites persistence, AI recommendations, CV save/theme/print and guide contents navigation. No browser JavaScript errors or failed local assets were observed. Static checks cover 45 pages and 659 local asset/link references. The separate studio browser suite is retained.

The new GitHub Actions workflow repeats static and browser checks on pull requests and uploads screenshots and the current report. Passing local checks does not establish production publication.
