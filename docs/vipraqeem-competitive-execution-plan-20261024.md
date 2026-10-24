# Digital Execution | VIP Raqeem: Strategic execution plan

Approved reference: 2026-10-24. Status: design and implementation review only; no approval to merge or publish.

## Lessons from competitor
- As of research snapshot, VIP Raqeem advertises roughly 100 products and 8 homepage bundles. These are catalog claims, not verified sales.
- Useful patterns: industry-focused landing pages, bundles by customer job, clear value and pricing, topical SEO articles leading to relevant tools.
- Avoid: inconsistent payment claims, manual payment friction, inflated AI product claims, wrong arithmetic, unrelated internal links, unclear example provenance and catalog clutter.
- Rankings, conversion rates, platform implementation and speed were not independently verified.

## Roadmap for Digital Execution
1. Premium, mobile-first graphic design studio with clear examples and transparent scopes.
2. Sector design landing pages, beginning with restaurants and cafés; later retail, gifts and children's businesses if differentiated content exists.
3. Useful free tools and tutorials with relevant contextual links, without merging departments.
4. Digital-product pages, short visual previews and bundles prepared for later; paid products remain hidden until separately authorized.
5. Accurate crawlable SEO content, canonical URLs, sitemap and sector-specific internal linking.
6. Trust: validate calculations, avoid false claims about delivered work, explain limitations, pricing and delivery consistently.

## First deliverable
- Single static service page: /services/design-for-restaurants/.
- Topic: menu, packaging, social media, and ad creatives for cafés and restaurants.
- Local WebP images are labeled illustrative examples, not clients' commissioned work.
- Clear contact path using existing design studio/email; no account, backend, external APIs, or subscriptions.
- One contextual link from /services/ and a matching sitemap entry (only if published after approval).

## Guardrails
- Work on a dedicated branch and draft PR. No merge, no automatic production release.
- Preserve productsVisible=false, and do not alter product catalog, prices, calculators or commercial download access.
- Egyptian Arabic copy, original visual language, accessible links and strong mobile layouts.
- Run Store QA and browser checks where available; do not assert unperformed QA has passed.
- Assess effectiveness after publication using real inquiry clicks, Search Console and mobile performance rather than guessed sales.
