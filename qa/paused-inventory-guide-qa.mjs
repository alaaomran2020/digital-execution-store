// Verify the previously reviewed inventory/supplier drafts have safe links and neutral media.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const slugs = ['inventory-management-small-shops','inventory-management-mistakes','supplier-order-planning'];
assert.equal(JSON.parse(fs.readFileSync('data/storefront-mode.json','utf8')).productsVisible,false);
for (const slug of slugs) {
  const file = 'guides/' + slug + '/index.html';
  const html = fs.readFileSync(file,'utf8');
  assert.ok(html.includes('href="../../tools/inventory-health-check/"'), 'Free inventory tool link missing: ' + slug);
  assert.ok(!/href=["'][^"']*\/products\//.test(html), 'Hidden product URL in ' + slug);
  assert.ok(!/(guide_product_click|data-product-slug|ReStock Desk|شوف المنتج|699 جنيه)/.test(html), 'Paid CTA text/track remains in ' + slug);
  assert.ok(!html.includes('/assets/restock/'), 'Private restock social media leaked: ' + slug);
  assert.ok(html.includes('https://digital-execution.cc/assets/social/digital-execution-og.png'), 'Neutral social image missing in ' + slug);
  assert.ok(html.includes('<link rel="canonical" href="https://digital-execution.cc/guides/' + slug + '/"'), 'Canonical missing: ' + slug);
  assert.ok(!/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html), 'Public guide noindex: ' + slug);
}
console.log('PASS: 3 inventory/supplier public guides have no paused paid product links or media');
