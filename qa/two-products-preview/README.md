# Two-product WhatsApp storefront — safe review only

The page under `qa/two-products-preview/` is a **local, non-public preview** for exactly two Calculator Suite v1.0.0 SKUs. Its order links explicitly say **test request, no payment**.

Prices are from the **private Calculator Suite delivery README**, dated October 2026:
- Starter: **399 EGP**, one-time.
- Professional: **999 EGP**, one-time.

The WhatsApp contact **01011673107** is sourced from the Digital Execution storefront's `footer.js`. No wallet destination is asserted by this preview. The operator provides verified payment instructions privately and sends the appropriate commercial ZIP manually *only after independently confirming payment*.

## Safety boundaries

- This page and stylesheet live under `qa/`; existing `qa/build-staging.mjs` excludes the whole directory from Cloudflare Pages output. It is **not** displayed at `/products/`, and the storefront mode remains `productsVisible: false`.
- No ZIP, token, private document, D1/R2 resource or Worker is used.
- Do not merge, publish, copy the preview into the live products route, or remove its warning/test-message prefix until the owner explicitly approves the launch after QA.
- Validate `node qa/two-products-preview-qa.mjs`, `node qa/storefront-paused-qa.mjs`, `node qa/site-sections-qa.mjs`, staging build, and links. Browser acceptance on mobile/desktop must pass.

## Activation plan (requires separate explicit approval)

1. Approve the prices, edition contents, phone, payment instructions, seller identity and customer support/refund policy; confirm both privately stored commercial ZIPs are the approved versions.
2. Copy the reviewed UI from `qa/two-products-preview/` to the public `products/` route, remove preview warning and test wording, keep only the two cards and product-specific WhatsApp messages. Do **not** expose the ZIPs.
3. Update current homepage/header/products routing, terms/privacy and product visibility, and update paused-mode CI gates for the new two-product model. Preserve the independent tools/services.
4. Test in a dedicated controlled review environment before production, ensuring no automatic deployment of incomplete checkout. Require an owner GO before changing `main` or enabling sales.

No subscription, checkout backend, third-party payment API or automatic entitlement/grant system is required for the manual WhatsApp fulfilment flow.
