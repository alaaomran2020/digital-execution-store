// Audit the exact emitted staging payload, not just its source folder.
// Use after build-staging.mjs; this tool is local-only and does not deploy.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { STAGING_PUBLIC_FILES } from './staging-public-allowlist.mjs';

const out = path.resolve('dist-staging');
const generated = ['data/products.json', 'staging-build.json'];
const expected = [...STAGING_PUBLIC_FILES, ...generated].sort();
assert.equal(new Set(expected).size, expected.length, 'Duplicate file entry');
assert.ok(fs.existsSync(out), 'Staging bundle is missing');

function emittedFiles(dir, prefix = '') {
  const paths = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.posix.join(prefix, entry.name);
    const abs = path.join(dir, entry.name);
    assert.ok(!entry.isSymbolicLink(), 'Output symlink forbidden: ' + rel);
    if (entry.isDirectory()) paths.push(...emittedFiles(abs, rel));
    else if (entry.isFile()) paths.push(rel);
    else assert.fail('Unexpected non-file output entry: ' + rel);
  }
  return paths;
}

assert.deepEqual(emittedFiles(out).sort(), expected, 'Unexpected or missing staging public file');
assert.equal(fs.readFileSync(path.join(out, 'data/products.json'), 'utf8'), '[]\n',
  'Historical product registry must remain an empty placeholder');
const mode = JSON.parse(fs.readFileSync('data/storefront-mode.json', 'utf8'));
assert.equal(mode.productsVisible, false, 'Cannot test paid-product-public staging');
const headers = fs.readFileSync(path.join(out, '_headers'), 'utf8');
assert.ok(headers.includes('X-Robots-Tag: noindex, nofollow, noarchive'),
  'All preview responses must remain noindex');

// Only noindex maintenance HTML is allowed below /products/.
// Keep all media, sales JS/CSS, checkout artifacts and offer metadata out.
for (const p of expected.filter(p => p.startsWith('products/'))) {
  assert.match(p, /^products\/(?:[a-z0-9-]+\/)?index\.html$/,
    'Non-placeholder product asset in staging: ' + p);
  const html = fs.readFileSync(path.join(out, p), 'utf8');
  assert.ok(html.includes('content="noindex,nofollow"'), 'Paid page must be noindex: ' + p);
  assert.ok(!html.includes('application/ld+json') &&
    !html.includes('data-track="buy_'), 'Product commercial content leaked: ' + p);
}
for (const p of expected) {
  assert.ok(!p.startsWith('downloads/') && !p.startsWith('analytics/') &&
    !p.startsWith('operations/') && !p.startsWith('growth/') &&
    !p.startsWith('seo/') && !p.startsWith('docs/') &&
    !p.startsWith('assets/products/') && !p.startsWith('assets/restock/') &&
    !p.startsWith('assets/career-kit/') && !p.startsWith('after-purchase/') &&
    !p.startsWith('assets/social/product-') && !p.startsWith('.github/'),
    'Restricted source was included in staging bundle: ' + p);
}
console.log('PASS: exact staging allowlist contains ' + expected.length +
  ' approved files; paused product routes and private-media exclusions verified');
