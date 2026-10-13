import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { STAGING_PUBLIC_FILES } from './staging-public-allowlist.mjs';

// Dedicated Cloudflare Pages staging-only build. Never publish this bundle to the live domain.
const root = process.cwd();
const branch = process.env.CF_PAGES_BRANCH;
assert.equal(branch, 'staging', 'Refusing to build a non-staging branch');

const mode = JSON.parse(fs.readFileSync(path.join(root, 'data/storefront-mode.json'), 'utf8'));
assert.equal(mode.productsVisible, false, 'Refusing to publish while products are visible');
const headers = fs.readFileSync(path.join(root, '_headers'), 'utf8');
assert.match(headers, /^\/\*\s*\r?\n\s*X-Robots-Tag:\s*noindex,\s*nofollow,\s*noarchive/im, 'Missing staging noindex headers');
for (const policy of ['X-Content-Type-Options: nosniff', 'X-Frame-Options: DENY', "Content-Security-Policy: frame-ancestors 'none'", 'Referrer-Policy: strict-origin-when-cross-origin', 'Permissions-Policy: camera=(), microphone=(), geolocation=()']) {
  assert.ok(headers.includes(policy), `Missing staging defensive header: ${policy}`);
}
for (const file of ['index.html', 'services/index.html', 'services/graphic-design/index.html', 'services/graphic-design/studio.css', 'tools/index.html']) {
  assert.ok(fs.existsSync(path.join(root, file)), `Required site file missing: ${file}`);
}

const outName = 'dist-staging';
const out = path.join(root, outName);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// Explicit, reviewed source paths only. Never recursively copy a directory:
// new source files or images must NOT silently become web-accessible.
const reviewed = new Set(STAGING_PUBLIC_FILES);
assert.equal(reviewed.size, STAGING_PUBLIC_FILES.length, 'Duplicate staging allowlist entry');
let files = 0;
for (const relative of STAGING_PUBLIC_FILES) {
  const segments = relative.split('/');
  assert.ok(segments.length > 0 && segments.every(part =>
    /^[A-Za-z0-9_.-]+$/.test(part) && part !== '.' && part !== '..' && !part.startsWith('.')
  ), 'Unsafe or hidden allowlist path: ' + relative);
  assert.ok(!['zip', '7z', 'rar', 'pem', 'key', 'env'].includes(relative.split('.').pop().toLowerCase()),
    'Forbidden archive or key in allowlist: ' + relative);
  const src = path.join(root, relative);
  const dst = path.join(out, relative);
  // Symlinks in any path component could escape the audited tree.
  let current = root;
  const parts = relative.split('/');
  for (const part of parts) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current);
    assert.ok(!stat.isSymbolicLink(), 'Symlink forbidden in staging source: ' + relative);
  }
  assert.ok(fs.statSync(src).isFile(), 'Allowlisted source is not a file: ' + relative);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  files++;
}
// Keep the historical registry out of Pages, but deliberately replace its old URL
// with a harmless asset: previously cached copies of a deleted Pages file can
// remain available at some edge locations after deployment.
const pausedRegistry = path.join(out, 'data/products.json');
fs.mkdirSync(path.dirname(pausedRegistry), { recursive: true });
fs.writeFileSync(pausedRegistry, '[]\n', 'utf8');
files++;
// A minimal public state contract for remote smoke checks. Never expose the
// source storefront-mode.json: its explanations and restoration notes are
// internal operations metadata, not needed by browsers or QA.
const publicMode = path.join(out, 'data/storefront-mode.json');
const publicModeContent = JSON.stringify({ productsVisible: false }) + '\n';
fs.writeFileSync(publicMode, publicModeContent, 'utf8');
files++;
assert.ok(fs.existsSync(path.join(out, '_headers')), 'Staging _headers not copied');
assert.ok(!fs.existsSync(path.join(out, 'CNAME')), 'Do not publish GitHub Pages custom domain CNAME');
assert.ok(fs.existsSync(path.join(out, 'services/graphic-design/studio.css')), 'Studio CSS missing from staging output');
assert.equal(fs.readFileSync(pausedRegistry, 'utf8'), '[]\n', 'Paused staging must serve an empty registry placeholder only');
for (const directory of ['analytics', 'dist', 'docs', 'growth', 'operations', 'seo']) {
  assert.ok(!fs.existsSync(path.join(out, directory)), `Internal directory exposed in staging: ${directory}`);
}
for (const file of ['CNAME.example', 'data/products.schema.json', 'data/passive-revenue-restock.json']) {
  assert.ok(!fs.existsSync(path.join(out, file)), `Internal metadata exposed in staging: ${file}`);
}
const commit = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || null;
assert.ok(commit === null || /^[a-f0-9]{40}$/.test(commit), 'Invalid staging commit SHA');
fs.writeFileSync(path.join(out, 'staging-build.json'), JSON.stringify({
  branch,
  commit,
  builtAt: new Date().toISOString(),
  purpose: 'Cloudflare Pages staging only'
}, null, 2) + '\n');
console.log(`PASS: ${files} staging files built from branch ${branch} into ${outName}; GitHub Pages CNAME excluded; noindex enabled`);
