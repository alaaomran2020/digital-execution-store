// Regression gates for public, genuinely-free calculators only.
// SEO metadata and content must not change financial calculation scripts.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const pages = [
  ['tools/pricing-calculator/index.html', 'حاسبة تسعير المنتجات', '/tools/pricing-calculator/', '/tools/break-even-calculator/'],
  ['tools/break-even-calculator/index.html', 'حاسبة نقطة التعادل', '/tools/break-even-calculator/', '/tools/pricing-calculator/']
];
for (const [file, subject, route, sibling] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const source = 'https://digital-execution.cc' + route;
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(html, /<meta name="robots" content="index,follow[^"]*">/, file + ': public robots');
  assert.ok(!html.includes('noindex'), file + ': accidentally hidden from indexing');
  const titles = [...html.matchAll(/<title>([^<]+)<\/title>/g)];
  assert.equal(titles.length, 1, file + ': exactly one title');
  assert.ok(titles[0][1].includes(subject) && titles[0][1].includes('Digital Execution'),
    file + ': intent-specific title');
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
  assert.ok(description && description.length >= 100, file + ': descriptive search snippet');
  assert.ok(html.includes('<link rel="canonical" href="' + source + '">'),
    file + ': canonical');
  assert.ok(html.includes('<meta property="og:url" content="' + source + '">'),
    file + ': social URL aligns with canonical');
  assert.ok(html.includes('<meta property="og:title"') &&
    html.includes('<meta name="twitter:card" content="summary">'),
    file + ': basic social metadata');
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(schemas.length, 1, file + ': only one public schema');
  const schema = JSON.parse(schemas[0][1]);
  assert.equal(schema['@type'], 'WebApplication');
  assert.equal(schema.url, source);
  assert.equal(schema.isAccessibleForFree, true);
  assert.equal(schema.inLanguage, 'ar-EG');
  assert.ok(schema.name.includes(subject));
  assert.ok(!JSON.stringify(schema).includes('AggregateRating') &&
    !JSON.stringify(schema).includes('review'), file + ': no invented reviews');
  assert.ok(html.includes('href="' + sibling + '"'), file + ': related tool link');
  assert.ok(html.includes('href="/guides/"'), file + ': guides hub link');
  assert.ok(!/href=["'][^"']*\/products\//.test(html), file + ': hidden product links forbidden');
  assert.ok(!/data-track="buy_|data-product-card/.test(html), file + ': no paid CTA');
  assert.ok(new RegExp('<h1[^>]*>' + subject + '</h1>').test(html),
    file + ': visible H1 must match user intent');
  console.log('PASS SEO: ' + file + ' — unique intent, JSON-LD, OG, canonical, safe links');
}
const pricing = fs.readFileSync('tools/pricing-calculator/pricing.js', 'utf8');
const breakeven = fs.readFileSync('tools/break-even-calculator/break-even.js', 'utf8');
assert.ok(pricing.includes('const sale=total*(1+markup/100)'), 'Pricing calculator formula unchanged');
assert.ok(breakeven.includes('Math.ceil(fixed/contribution)'), 'Break-even whole unit rounding preserved');
console.log('PASS: calculator SEO smoke checks and basic calculation contracts');
