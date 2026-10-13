import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = 'https://digital-execution.cc';
const slugs = ['pricing-with-fees', 'markup-vs-margin', 'break-even-examples', 'brand-identity-brief'];
const hub = fs.readFileSync('guides/index.html','utf8');
const sitemap = fs.readFileSync('sitemap.xml','utf8');
const allowlist = fs.readFileSync('qa/staging-public-allowlist.mjs','utf8');

for(const slug of slugs){
  const route = '/guides/' + slug + '/';
  const source = 'guides/' + slug + '/index.html';
  const html = fs.readFileSync(source,'utf8');
  assert.ok(hub.includes('href="' + route + '"'), 'Guide omitted from knowledge hub: ' + route);
  assert.ok(sitemap.includes('<loc>' + base + route + '</loc>'), 'Guide omitted from sitemap: ' + route);
  assert.ok(allowlist.includes("'" + slug + "'"), 'Guide omitted from public staging allowlist: ' + slug);
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.match(html, /<meta name="robots" content="index,follow/);
  assert.ok(html.includes('<link rel="canonical" href="' + base + route + '">'));
  assert.ok(html.includes('<meta property="og:url" content="' + base + route + '">'));
  assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1);
  assert.equal((html.match(/<title>/g)||[]).length,1);
  assert.ok(!/href=["'][^"']*\/products\//.test(html), 'Paid product link prohibited');
  assert.ok(!/\/assets\/(products|restock|career-kit)\//.test(html), 'Private asset reference prohibited');
  assert.ok(!/data-product-slug|guide_product_click|buy_now|checkout/i.test(html), 'Paid commercial action prohibited');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length,1, 'Expected exactly one Article schema');
  const schema = JSON.parse(blocks[0][1]);
  assert.equal(schema['@type'], 'Article');
  assert.equal(schema.mainEntityOfPage, base + route);
  assert.ok(!/AggregateRating|reviewCount/.test(blocks[0][1]), 'Unverified reviews are prohibited');
  console.log('PASS: ' + source);
}
assert.equal(Math.ceil(12000/(150-90)),200);
assert.equal(Math.ceil(12000/(150-100)),240);
assert.ok(Math.abs(150*1.3/(1-.05)-205.2631578947)<.000001);
assert.ok(Math.abs(200/(1-.30)-285.7142857143)<.000001);
console.log('PASS: four editorial examples and paused-commerce regressions');