# Metricool tracking: DRAFT review only

No production publication is authorized. The Digital Execution website is hosted from GitHub Pages main; this branch is for review.

Scope:
- Shared small asynchronous loader for public pages only, plus one standalone studio HTML page include.
- Excludes products, after-purchase and operations routes. Free offline resources remain untouched and do not load third-party scripts.
- Updates privacy disclosures and clarifies that calculator input stays on the user's device.
- Adds an offline CI guard for deduplication, exclusions, privacy and local loader byte budgets.
- No new API, backend, paid subscription, or changes to product visibility.

Tests:
- node --check header.js
- node --check metricool-tracker.js
- node qa/metricool-tracking-qa.mjs
- node qa/store-qa.mjs (plus existing CI checks)

Manual review before merge:
- Ensure third-party data processing, notice and any consent obligations are approved.
- Measure browser/network effects and mobile Lighthouse against the live baseline on an approved test environment; the local byte budget does not measure actual third-party network cost.
- Verify Content Security Policy permits the exact script host; validate one pageview and no form-input forwarding.
- Do not publish, deploy, merge or switch on Facebook auto-posting without new owner approval.
