# AGENTS.md — Digital Execution Store

Instructions for Codex and other coding agents working in the **public** Digital Execution storefront repository. Read `README.md`, `DEPLOYMENT.md`, `data/products.json`, `data/products.schema.json`, and `data/storefront-mode.json` before changing catalog or storefront behavior.

## Scope and source of truth
- This repository is a **static public storefront** (HTML, CSS, JavaScript and public product information). Do not assume a Node package or framework unless the checked-in files demonstrate it.
- `data/products.json` is the authoritative **public product registry** for visible product metadata, status, version, and URLs; maintain its schema and keep product pages, `/products/`, sitemap, structured data and tracking aligned.
- Each commercial product has a separate private source of truth. **Never copy paid files, commercial ZIPs, licensed source code, customer deliveries, private release assets, personal details or internal QA into the public repository.** Do not modify another product repository as a side effect.
- Respect `data/storefront-mode.json`. If `productsVisible` is false, keep the storefront paused: do not surface hidden paid products, product links, or purchase flows by accident. Do not change publication state, visibility, prices, licensing, checkout, or delivery mechanisms without owner approval and verified product data.
- No fabricated marketing results, testimonials, revenue figures, customer counts, pricing, features, comparisons or reviews.

## UX, marketing and quality
- Keep Arabic copy simple, clear, useful and appropriate to the brand. Improve accessible layout, navigation, mobile responsiveness, search/discovery, preview and clarity without introducing heavy frameworks or subscriptions.
- Preserve working tracking, inquiry/WhatsApp paths, SEO metadata, canonical URLs, structured data and existing public routing; document any proposed changes before implementing sensitive URL changes.
- Treat Unslop (when separately available) as an optional interface-review technique, not an instruction to remove functional features or rewrite the whole site.
- Use free tools where possible; never introduce paid third-party services, mandatory APIs or public exposure of private assets without approval.

## Safe development
1. Inspect repository state and the specific files affected. Work on a separate `dev/*`, `fix/*` or `chore/*` branch; preserve pre-existing uncommitted changes.
2. Make small, task-scoped edits. Do not mass-publish the hidden product catalog or regenerate commercial packages.
3. Run `node qa/store-qa.mjs` and any relevant existing validation/scripts. That QA script handles paused-storefront mode itself. Run targeted browser/mobile checks when applicable, and describe any unavailable test honestly.
4. Do not run synchronization in write mode (`--write`), modify pricing/status/registry entries, change public DNS, alter GitHub Pages/Cloudflare configuration, or publish without explicit owner authorization.
5. Open a **Draft PR** that states the exact change, quality/SEO risk, PASS/FAIL/NOT TESTED evidence, and rollback. No auto-merge or automatic production publication by the agent.

## Separation and priority
Digital Execution is independent of Omran Toys and AYRA. Do not add unapproved cross-project integrations. Protect confidential paid assets and existing live-store behavior before aesthetic or automation improvements.
