# Digital Execution Funnel Collector — Deployment

## Google Sheet
Spreadsheet ID: `1DkBN_xNCQ6yPAJk89sSj27OOYgthNUXrZeVTFJjIsng`

Tab: `Events`

## Deploy once
1. Open the spreadsheet.
2. Extensions → Apps Script.
3. Replace `Code.gs` with `analytics/collector/Code.gs`.
4. Deploy → New deployment → Web app.
5. Execute as: Me.
6. Who has access: Anyone.
7. Copy the final `/exec` URL.

## Connect the storefront
Add this meta tag inside `<head>` on storefront pages:

```html
<meta name="de-analytics-endpoint" content="PASTE_APPS_SCRIPT_EXEC_URL_HERE">
```

The browser keeps a local copy first, then sends queued events to the collector. Failed network sends remain queued and retry later. The collector deduplicates by `event_id`.

## Production verification
After deployment:
1. Open ReStock Desk.
2. Trigger `product_view`.
3. Click the WhatsApp purchase CTA.
4. Confirm new rows appear in the Google Sheet.
5. Verify unique `event_id` values.
6. Confirm the dashboard can calculate the funnel from exported/central rows.
