// Focused Chromium regression: RTL gallery modal navigation, no network writes.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.PREVIEW_ORIGIN || "http://127.0.0.1:4173";
const options = { headless: true };
if (process.env.QA_BROWSER_CHANNEL?.trim()) options.channel = process.env.QA_BROWSER_CHANNEL.trim();
const browser = await chromium.launch(options);
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 850 }, isMobile: width <= 390, hasTouch: width <= 390 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(origin + "/services/graphic-design/", { waitUntil: "networkidle" });
    await page.locator('[data-ds-filter="product"]').click();
    await page.locator('.ds-gallery-card[data-gallery-category="product"] [data-gallery-open]').first().click();
    assert.equal((await page.locator("#ds-gallery-position").textContent()).trim(), "1 من 2");
    assert.match(await page.locator("#ds-gallery-dialog-title").textContent(), /Bloom/);
    for (const id of ["#ds-gallery-prev", "#ds-gallery-next"]) {
      assert.ok(await page.locator(id).evaluate(el => el.getBoundingClientRect().height >= 44));
    }
    await page.locator("#ds-gallery-next").click();
    assert.match(await page.locator("#ds-gallery-dialog-title").textContent(), /Atelier/);
    assert.equal((await page.locator("#ds-gallery-position").textContent()).trim(), "2 من 2");
    await page.locator("#ds-gallery-next").click();
    assert.match(await page.locator("#ds-gallery-dialog-title").textContent(), /Bloom/);
    await page.locator("#ds-gallery-prev").click();
    assert.match(await page.locator("#ds-gallery-dialog-title").textContent(), /Atelier/);
    await page.keyboard.press("ArrowRight");
    assert.match(await page.locator("#ds-gallery-dialog-title").textContent(), /Bloom/);
    await page.keyboard.press("ArrowLeft");
    assert.match(await page.locator("#ds-gallery-dialog-title").textContent(), /Atelier/);
    await page.locator("#ds-gallery-request").click();
    assert.equal(await page.locator("#ds-kind").inputValue(), "ds-commerce");
    await page.waitForFunction(() => document.activeElement === document.getElementById("ds-kind"));
    await page.locator('[data-ds-filter="identity"]').click();
    await page.locator('.ds-gallery-card[data-gallery-category="identity"] [data-gallery-open]').first().click();
    assert.ok(await page.locator("#ds-gallery-prev").isDisabled());
    assert.ok(await page.locator("#ds-gallery-next").isDisabled());
    assert.equal((await page.locator("#ds-gallery-position").textContent()).trim(), "1 من 1");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#ds-gallery-dialog").evaluate(el => el.open), false);
    assert.equal(errors.length, 0, errors.join("; "));
    console.log("PASS gallery navigation " + width + "px; no page errors");
    await page.close();
  }
} finally {
  await browser.close();
}
