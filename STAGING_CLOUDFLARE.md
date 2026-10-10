# Cloudflare Pages — isolated Staging for Digital Execution

## Scope / hard safety boundary
This is a **separate Cloudflare Pages project**, not the production site.
Production stays at `https://digital-execution.cc` on GitHub Pages. Do **not** add this apex domain or `www` to this Pages project, and do not change DNS, Workers routes, GitHub Pages settings, or production deploy workflows.

## Source repository and branch
- GitHub: `alaaomran2020/digital-execution-store`
- Staging source: `staging` branch ONLY
- Existing `_headers` for the staging branch sends `X-Robots-Tag: noindex, nofollow, noarchive` on `/*`.
- Staging QA workflow: `.github/workflows/staging-qa.yml` (no deployment).
- Product storefront must remain paused: `data/storefront-mode.json` → `productsVisible: false`.
- The paused Pages build excludes the historical contents of `data/products.json` and replaces that URL with the exact harmless `[]` JSON payload and a no-store response header. This overwrites old cached Pages assets rather than merely removing the file; the public GitHub repository still contains the original registry, so this does not make the GitHub source private.

## Cloudflare dashboard setup
1. Cloudflare Dashboard → Workers & Pages → Create application → Pages → Import an existing Git repository.
2. Authorize the GitHub repository `alaaomran2020/digital-execution-store` for **this independent Pages project only**.
3. Project name: `digital-execution-staging` (if available).
4. Set **Production branch** of THIS staging project to `staging` (do not select `main`).
5. Framework preset: None.
6. Root directory: repository root (default).
7. Build command: `node qa/build-staging.mjs` (requires `CF_PAGES_BRANCH=staging`, paused products, `_headers` and studio CSS; fails closed).
8. Build output directory: `dist-staging` (isolated static output; excludes GitHub Pages `CNAME`, repository internals, QA source and archives).
9. Under branch build controls: disable preview branches (None) unless a specific preview is needed.
10. Do not add custom domains. Use only the issued `*.pages.dev` hostname.
11. Each build writes `staging-build.json` with `branch` and `CF_PAGES_COMMIT_SHA` so the remote test can prove which commit is served. This file contains public build metadata only.
12. The existing GitHub Pages `CNAME` is deliberately omitted from the `dist-staging` bundle; do not point a custom domain here.

The name above is a *proposed configuration*, **not** a claim that a project or URL has already been created.

## Tests / release gates
PR #119 has been merged into `staging` only. For each subsequent staging revision:
- CI: staging QA success; paused-products QA success; sections QA success.
- Browser: Chromium screenshots and no horizontal overflow at widths 320, 390, 768, 1440.
- Public staging paths: `/`, `/services/`, `/services/graphic-design/`, `/tools/`.
- Ensure `/services/graphic-design/studio.css?v=20261010-v1` returns HTTP 200 and the studio contains 8 service cards, functioning nav and email inquiry links.
- Ensure free calculators work, storefront products are hidden, and no real payment/checkout/delivery is executed.
- Confirm the Pages project deployment SHA equals the intended `staging` commit and inspect its build logs.
- Confirm response header `X-Robots-Tag: noindex, nofollow, noarchive` on staging page responses.
- On each `staging` push, `Cloudflare Staging Remote QA (read-only)` checks `https://digital-execution-staging.pages.dev/` by default. Set the repository Actions variable `CF_STAGING_URL` only if the isolated project's URL changes. The workflow must not silently skip when the variable is absent: a missing or stale deployment is a failed gate. The test waits for the deployed SHA to match GitHub and does not need secrets.
- For immediate manual verification without modifying the production/default branch, check out the `staging` branch in a machine with Node.js 22; install Playwright Chromium, then run `STAGING_URL=https://<project>.pages.dev/ EXPECTED_STAGING_COMMIT=<40-char-sha> node qa/cloudflare-staging-remote-qa.mjs`. The `workflow_dispatch` action may not be available in GitHub's Actions UI until its workflow file exists on the repository's default branch; do **not** modify `main` just to enable manual dispatch.
- Remote tests enforce HTTPS and the `pages.dev` hostname, check headers, CSS, 8 design cards, hidden products, build fingerprint, mobile/desktop Chromium screenshots, navigation, and simulated local-only pricing and break-even calculations. They do **not** purchase, email, or modify customer records.
- On Windows, local browser QA can set `QA_BROWSER_CHANNEL=chrome` (or `msedge`) to reuse an installed Chromium-based browser when Playwright's dedicated Chromium download is unavailable. CI continues using its pinned Playwright Chromium by default.
- Reports are uploaded as GitHub Actions artifacts and must show PASS before approval.
- Confirm `digital-execution.cc` still resolves and works as before, with DNS records and GitHub Pages unchanged.

## Stop/rollback
If a test fails, stop further staging promotion, disable deployments of the **staging project only** if appropriate, fix on branch `staging`, and retest.
Do not move the production domain, DNS, or hosting until a separately approved migration decision.
