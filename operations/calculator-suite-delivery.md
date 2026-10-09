# Calculator Suite — staged launch / restricted delivery

Prices: Free 0 EGP; Starter 399 EGP one-time; Professional 999 EGP one-time.
Version: 1.0.0, date: 2026-10-09.

## Public/private boundary
- PUBLIC: tier landing pages, 4-function browser demo, prices, product registry.
- PRIVATE: Starter and Professional ZIP files and hashes; delivery tokens, order records, administrator credentials.
- NO production launch before private artifacts are stored in non-public Cloudflare R2 or private customer-restricted Google Drive and verified.

## Manual payment flow
1. Customer opens tier page, initiates WhatsApp inquiry and receives current payment instructions.
2. Staff independently verifies that a real Vodafone Cash transaction settled. Receipt screenshots alone are not sufficient.
3. Staff records unique verified order ID, intended SKU, payment timestamp, and customer contact privately.
4. Staff creates one-use delivery capability using the private delivery Worker backend and sends URL privately.
5. Customer downloads within 48 hours. Link is one-use and limited to the purchased SKU.
6. Staff records delivery status privately. Reissue only after independent verification.

Do NOT put customer contacts or secret URLs in public repository, HTML, analytics, or PR comments. Worker deployment and R2 file upload are separate manual gates. Never infer payment verification automatically from a customer-submitted receipt.
