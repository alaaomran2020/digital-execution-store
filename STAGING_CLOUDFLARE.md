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

## Cloudflare dashboard setup
1. Cloudflare Dashboard → Workers & Pages → Create application → Pages → Import an existing Git repository.
2. Authorize the GitHub repository `alaaomran2020/digital-execution-store` for **this independent Pages project only**.
3. Project name: `digital-execution-staging` (if available).
4. Set **Production branch** of THIS staging project to `staging` (do not select `main`).
5. Framework preset: None.
6. Root directory: repository root (default).
7. Build command: `test "$CF_PAGES_BRANCH" = "staging" && node -e "const m=require('./data/storefront-mode.json'); if(m.productsVisible!==false) process.exit(1)"`
8. Build output directory: `.` (static files are served directly from repository root).
9. Under branch build controls: disable preview branches (None) unless a specific preview is needed.
10. Do not add custom domains. Use only the issued `*.pages.dev` hostname.

The name above is a *proposed configuration*, **not** a claim that a project or URL has already been created.

## Tests / release gates
After PR #119 is reviewed and merged INTO `staging` only:
- CI: staging QA success; paused-products QA success; sections QA success.
- Browser: Chromium screenshots and no horizontal overflow at widths 320, 390, 768, 1440.
- Public staging paths: `/`, `/services/`, `/services/graphic-design/`, `/tools/`.
- Ensure `/services/graphic-design/studio.css?v=20261010-v1` returns HTTP 200 and the studio contains 8 service cards, functioning nav and email inquiry links.
- Ensure free calculators work, storefront products are hidden, and no real payment/checkout/delivery is executed.
- Confirm the Pages project deployment SHA equals the intended `staging` commit and inspect its build logs.
- Confirm response header `X-Robots-Tag: noindex, nofollow, noarchive` on staging page responses.
- Confirm `digital-execution.cc` still resolves and works as before, with DNS records and GitHub Pages unchanged.

## Stop/rollback
If a test fails, stop further staging promotion, disable deployments of the **staging project only** if appropriate, fix on branch `staging`, and retest.
Do not move the production domain, DNS, or hosting until a separately approved migration decision.
