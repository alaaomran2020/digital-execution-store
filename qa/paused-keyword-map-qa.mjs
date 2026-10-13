// Non-destructive SEO map audit for a temporarily paused storefront.
// Historical paid keyword research stays in Git, but must NOT be marked live.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const mode = JSON.parse(fs.readFileSync('data/storefront-mode.json', 'utf8'));
assert.equal(mode.productsVisible, false, 'SEO map expects paused commercial storefront');
const text = fs.readFileSync('seo/keyword-map.csv', 'utf8').trim();
const rows = text.split(/\r?\n/).map(line => line.split(','));
assert.deepEqual(rows[0], ['cluster','topic','target_url','primary_keyword','secondary_keywords','intent','stage','status']);
const seen = new Set();
let paused = 0, live = 0;
for (const fields of rows.slice(1)) {
  assert.equal(fields.length, 8, 'Invalid keyword CSV field count: ' + fields.join(','));
  const [cluster, topic, url, , , intent, , status] = fields;
  assert.ok(cluster && topic && url.startsWith('/') && !seen.has(url), 'Missing or repeated keyword target: ' + url);
  seen.add(url);
  const htmlFile = path.join('.', url.replace(/^\//, ''), 'index.html');
  assert.ok(fs.existsSync(htmlFile), 'Mapped public route missing: ' + url);
  const html = fs.readFileSync(htmlFile, 'utf8');
  if (url.startsWith('/products/')) {
    paused++;
    assert.equal(status, 'paused', 'Paid products cannot be marked live: ' + url);
    assert.ok(intent.includes('commercial') || intent.includes('transactional'), 'Expected commercial research intent');
    assert.match(html, /<meta\s+name="robots"\s+content="noindex,nofollow"/,
      'Paused product page must remain noindex: ' + url);
  } else {
    live++;
    assert.equal(status, 'live', 'Public guide/tool unexpectedly marked inactive: ' + url);
    assert.ok(!/name="robots"\s+content="[^"]*noindex/i.test(html),
      'Live target cannot be noindex: ' + url);
  }
}
assert.ok(paused >= 2 && live >= 18, 'Unexpected keyword targets missing');
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
assert.ok(!sitemap.includes('/products/'), 'Paused commercial URLs cannot be indexed from sitemap');
const robots = fs.readFileSync('robots.txt', 'utf8');
assert.ok(!/^Disallow:\s*\/products\/?/mi.test(robots),
  'Paid product noindex must remain crawlable for crawler detection');
console.log('PASS: ' + live + ' live informational/tool targets and ' + paused +
  ' paused paid keyword targets, no commercial sitemap exposure');
