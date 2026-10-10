import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Dedicated Cloudflare Pages staging-only build. Never publish this bundle to the live domain.
const root = process.cwd();
const branch = process.env.CF_PAGES_BRANCH;
assert.equal(branch, 'staging', 'Refusing to build a non-staging branch');

const mode = JSON.parse(fs.readFileSync(path.join(root, 'data/storefront-mode.json'), 'utf8'));
assert.equal(mode.productsVisible, false, 'Refusing to publish while products are visible');
const headers = fs.readFileSync(path.join(root, '_headers'), 'utf8');
assert.match(headers, /^\/\*\s*\r?\n\s*X-Robots-Tag:\s*noindex,\s*nofollow,\s*noarchive/im, 'Missing staging noindex headers');
for (const file of ['index.html', 'services/index.html', 'services/graphic-design/index.html', 'services/graphic-design/studio.css', 'tools/index.html']) {
  assert.ok(fs.existsSync(path.join(root, file)), `Required site file missing: ${file}`);
}

const outName = 'dist-staging';
const out = path.join(root, outName);
const excludedDirs = new Set(['.git', '.github', 'node_modules', 'qa', 'artifacts', outName]);
const excludedFiles = new Set(['CNAME', '.nojekyll', '.gitignore', 'README.md', 'DEPLOYMENT.md', 'STAGING_CLOUDFLARE.md']);
// Keep historical registry in Git for restoration, not in the paused Pages preview.
const excludedPaths = new Set(['data/products.json']);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
let files = 0;
function copySite(dir, rel = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name;
    const nextRel = path.join(rel, name);
    const src = path.join(dir, name);
    const dst = path.join(out, nextRel);
    if (entry.isSymbolicLink()) throw new Error(`Symlink not allowed in staging bundle: ${nextRel}`);
    if (entry.isDirectory()) {
      if (excludedDirs.has(name) || name.startsWith('.')) continue;
      fs.mkdirSync(dst, { recursive: true });
      copySite(src, nextRel);
    } else if (entry.isFile()) {
      if (excludedPaths.has(nextRel.split(path.sep).join('/'))) continue;
      if (excludedFiles.has(name) || name.endsWith('.md') || (name.startsWith('.') && name !== '.well-known')) continue;
      if (/\.(zip|7z|rar|pem|key)$/i.test(name) || name.startsWith('.env')) {
        throw new Error(`Disallowed archive/secret in site files: ${nextRel}`);
      }
      fs.copyFileSync(src, dst);
      files++;
    }
  }
}
copySite(root);
assert.ok(fs.existsSync(path.join(out, '_headers')), 'Staging _headers not copied');
assert.ok(!fs.existsSync(path.join(out, 'CNAME')), 'Do not publish GitHub Pages custom domain CNAME');
assert.ok(fs.existsSync(path.join(out, 'services/graphic-design/studio.css')), 'Studio CSS missing from staging output');
assert.ok(!fs.existsSync(path.join(out, 'data/products.json')), 'Paused staging must not serve the historical product registry');
const commit = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || null;
assert.ok(commit === null || /^[a-f0-9]{40}$/.test(commit), 'Invalid staging commit SHA');
fs.writeFileSync(path.join(out, 'staging-build.json'), JSON.stringify({
  branch,
  commit,
  builtAt: new Date().toISOString(),
  purpose: 'Cloudflare Pages staging only'
}, null, 2) + '\n');
console.log(`PASS: ${files} staging files built from branch ${branch} into ${outName}; GitHub Pages CNAME excluded; noindex enabled`);
