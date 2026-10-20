# Graphic design studio refresh

The studio at `/services/graphic-design/` adapts the `graphic_design_studio_platform/code.html` concept from the supplied `stitch_digital_execution_premium_redesign.zip`. The matching `digital_execution_1/screen.png` provides the visual reference: light canvas, blue/violet accents, layered identity hero, services, filterable design examples, workflow, cooperation scopes, FAQs and a project contact section.

The implementation uses local CSS and JavaScript rather than the prototype's runtime Tailwind CDN. Existing approved WebP images remain unchanged. All eight existing service categories and their email inquiry links are retained. Visual examples are explicitly labeled as illustrative concepts, not client work. The studio remains independent from other store departments, and the temporary product pause remains active.

Portfolio filters expose selected state and announce results. Preview dialogs support Escape and restore focus. FAQs use native disclosure controls. Scope links preselect the service in the project form. The form prepares an encoded email and a copyable brief; users explicitly send through their email application. There is no backend submission or automatic email delivery.

Validation: the six commands in `.github/workflows/store-qa.yml`, plus `qa/design-studio-browser-qa.mjs` at 320, 390, 768 and 1440 pixels. The browser check covers overflow, service navigation, filtering, image preview, FAQ, service selection and Arabic brief encoding. Set `CHROMIUM_PATH` to use an existing Chromium executable; otherwise Playwright uses its managed browser.
