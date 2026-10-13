// Fail closed on hidden commercial references in the exact staging output.
// Read-only QA: does not change products, prices, delivery, or deployment settings.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist-staging');
const forbiddenAsset = /(?:^|[/"'\\s])(?:assets\/(?:restock|career-kit|products)\/|downloads\/|after-purchase\/|assets\/social\/product-)/i;
const forbiddenLink = /(?:href|action)\s*=\s*["'][^"']*\/(?:products|checkout|after-purchase|downloads)(?:\/|[?#"'])/gi;
const forbiddenShare = /(?:<meta\b[^>]*(?:property|name)\s*=\s*["'](?:og:image|twitter:image)["'][^>]*content\s*=\s*["'][^"']*(?:restock|career-kit|products|product-)[^"']*["']|<meta\b[^>]*content\s*=\s*["'][^"']*(?:restock|career-kit|products|product-)[^"']*["'][^>]*(?:property|name)\s*=\s*["'](?:og:image|twitter:image)["'])/gi;
const commercialOffer = /(?:ReStock\s*Desk|Career\s*Kit)[\s\S]{0,220}?(?:\b(?:EGP|جنيه)\b|\d[\d,.]*\s*(?:جنيه|EGP)|(?:اشتر|اطلب الآن|buy now))/gi;

function violations(html, file) {
  const issues = [];
  if (forbiddenAsset.test(html)) issues.push('restricted commercial asset reference');
  if (forbiddenLink.test(html)) issues.push('hidden-product/checkout/download link');
  forbiddenLink.lastIndex = 0;
  if (forbiddenShare.test(html)) issues.push('commercial social sharing image');
  forbiddenShare.lastIndex = 0;
  if (commercialOffer.test(html)) issues.push('commercial product offer or price');
  commercialOffer.lastIndex = 0;
  return issues.map(issue => file + ': ' + issue);
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    assert.ok(!entry.isSymbolicLink(), 'Symlink forbidden: ' + full);
    return entry.isDirectory() ? walk(full) : entry.isFile() && full.endsWith('.html') ? [full] : [];
  });
}
if (process.argv.includes('--self-test')) {
  assert.ok(violations('<a href="/products/">Shop</a>', 'fixture').length);
  assert.ok(violations('<meta property="og:image" content="/assets/restock/cover.png">', 'fixture').length);
  assert.ok(violations('<div>ReStock Desk - 399 جنيه</div>', 'fixture').length);
  assert.ok(violations('<meta name="twitter:image" content="/assets/career-kit/cover.png">', 'fixture').length);
  assert.ok(violations('<a href="/downloads/private.zip">Download</a>', 'fixture').length);
  assert.ok(violations('<div>Career Kit - 699 EGP</div>', 'fixture').length);
  assert.deepEqual(violations('<h2>Free inventory checker</h2><a href="/tools/">Free tools</a>', 'fixture'), []);
  assert.deepEqual(violations('<meta name="twitter:image" content="/assets/social/digital-execution-og.png">', 'fixture'), []);
  assert.deepEqual(violations('<a href="/tools/">Tools</a><meta property="og:image" content="/assets/social/digital-execution-og.png">', 'fixture'), []);
  console.log('PASS: hidden commercial content guard fixtures');
} else {
  assert.ok(fs.existsSync(root), 'Build staging before running commercial-content guard');
  const files = walk(root);
  assert.ok(files.length > 0, 'No HTML files to inspect');
  const findings = files.flatMap(file => violations(fs.readFileSync(file, 'utf8'), path.relative(root, file)));
  if (findings.length) {
    console.error('FAIL: staging commercial-content gate detected ' + findings.length + ' issue(s):');
    for (const finding of findings) console.error(' - ' + finding);
    process.exitCode = 1;
  } else {
    console.log('PASS: ' + files.length + ' emitted HTML pages have no known hidden commercial references');
  }
}
