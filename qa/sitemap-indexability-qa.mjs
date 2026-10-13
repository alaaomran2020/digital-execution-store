// Sitemap QA: source-only, no network/deploy. Intentionally excludes paid
// product routes and staging/admin/operational paths from public discovery.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const HOST = 'https://digital-execution.cc';
const xml = fs.readFileSync('sitemap.xml', 'utf8');
const publicDirectories = ['guides', 'tools', 'services', 'updates'];
const rootPages = ['index.html', 'licenses.html', 'privacy.html', 'terms.html'];
// Explicit public-route allowlist. Never index files under assets/downloads or private folders.
const allowedRootRoutes = new Set(['/', '/licenses.html', '/privacy.html', '/terms.html']);
const allowedSectionRoute = /^\/(?:guides|tools|services|updates)\/(?:[a-z0-9-]+\/)*$/;

// Parse only actual HTML attributes, regardless of order or quote style.
// Whitespace boundary avoids confusing data-name/data-rel with name/rel.
function attribute(tag, name) {
  const pattern = new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27|([^\\s>]+))', 'i');
  const match = tag.match(pattern);
  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim();
}

function pageForUrl(loc) {
  const url = new URL(loc);
  assert.equal(url.origin, HOST, 'Only production-origin HTTPS URLs may be indexed');
  assert.equal(url.search, '', 'Sitemap query strings forbidden');
  assert.equal(url.hash, '', 'Sitemap URL fragments forbidden');
  assert.ok(allowedRootRoutes.has(url.pathname) || allowedSectionRoute.test(url.pathname),
    'Non-public sitemap route: ' + loc);
  const relative = url.pathname.endsWith('/') ?
    url.pathname.slice(1) + 'index.html' : url.pathname.slice(1);
  const file = path.resolve(relative);
  assert.ok(file.startsWith(process.cwd() + path.sep), 'Invalid relative route: ' + relative);
  assert.ok(fs.existsSync(file) && fs.statSync(file).isFile(), 'Missing HTML page: ' + relative);
  return { file, relative, url: loc };
}
function indexable(html) {
  const robots = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => attribute(tag, 'name').toLowerCase() === 'robots');
  return !robots.some(tag => /\bnoindex\b/i.test(attribute(tag, 'content')));
}
function canonical(html) {
  const all = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => attribute(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical'));
  assert.ok(all.length <= 1, 'Duplicate canonical tags');
  if (!all.length) return null;
  const href = attribute(all[0], 'href');
  assert.ok(href, 'Canonical link missing href');
  return href;
}
function validate(source) {
  assert.match(source, /^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(source, /<\/urlset>\s*$/);
  const inside = source.replace(/^<\?xml[^>]+\?>\s*<urlset[^>]+>/, '').replace(/<\/urlset>\s*$/, '');
  const pattern = /<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?\s*<\/url>/g;
  const matches = [...inside.matchAll(pattern)];
  assert.ok(matches.length >= 35, 'Too few public sitemap pages');
  assert.equal(inside.replace(pattern, '').trim(), '', 'Malformed XML or unsupported sitemap content');
  const seen = new Set();
  for (const [, loc, lastmod] of matches) {
    assert.ok(!seen.has(loc), 'Duplicate sitemap URL: ' + loc);
    seen.add(loc);
    const { file, relative } = pageForUrl(loc);
    const html = fs.readFileSync(file, 'utf8');
    assert.ok(indexable(html), 'Noindex HTML must never be placed in sitemap: ' + relative);
    const canonicalUrl = canonical(html);
    if (canonicalUrl) assert.equal(canonicalUrl, loc, 'Canonical/sitemap mismatch: ' + relative);
    if (lastmod) {
      assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/, 'Invalid lastmod date: ' + loc);
      const day = new Date(lastmod + 'T00:00:00Z');
      assert.ok(!Number.isNaN(day.getTime()) && day.toISOString().slice(0,10) === lastmod,
        'Invalid calendar date: ' + lastmod);
      assert.ok(day.getTime() <= Date.now(), 'Future lastmod not allowed');
    }
  }
  assert.ok(seen.has(HOST + '/guides/'), 'Missing indexable /guides/ hub');
  const check = file => {
    const html = fs.readFileSync(file, 'utf8');
    if (!indexable(html)) return;
    const intended = canonical(html);
    if (intended) assert.ok(seen.has(intended), 'Indexable canonical omitted from sitemap: ' + file);
  };
  for (const f of rootPages) check(f);
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const item = path.join(dir, e.name);
      if (e.isDirectory()) walk(item);
      else if (e.isFile() && e.name === 'index.html') check(item);
    }
  }
  for (const dir of publicDirectories) walk(dir);
  const robots = fs.readFileSync('robots.txt', 'utf8');
  assert.ok(robots.includes('Sitemap: ' + HOST + '/sitemap.xml'), 'Robots sitemap pointer missing');
  assert.ok(!/^Disallow:\s*\/products\/?$/mi.test(robots),
    'Crawlers must be able to read the noindex meta on paused product pages');
  return seen.size;
}
const count = validate(xml);
const injection = '<url><loc>https://digital-execution.cc/products/</loc></url>';
assert.throws(() => validate(xml.replace('</urlset>', injection + '\n</urlset>')), /Non-public sitemap route/,
  'Disallowed paid-product URLs should fail');
assert.throws(() => validate(xml.replace('</urlset>', '<url><loc>https://digital-execution-staging.pages.dev/</loc></url>\n</urlset>')),
  /Only production-origin/, 'Staging URLs should fail');
assert.throws(() => validate(xml.replace('</urlset>', '<url><loc>https://digital-execution.cc/guides/</loc></url>\n</urlset>')),
  /Duplicate sitemap URL/, 'Duplicate canonicals should fail');
// Regression checks: omitted/falsified HTML attributes and restricted directories.
assert.throws(() => pageForUrl(HOST + '/downloads/private.html'), /Non-public sitemap route/);
assert.throws(() => pageForUrl(HOST + '/assets/preview.html'), /Non-public sitemap route/);
assert.equal(indexable('<meta content="noindex,follow" name="robots">'), false);
assert.equal(indexable('<meta data-name="robots" content="noindex">'), true);
assert.equal(canonical('<link href="' + HOST + '/guides/" rel="canonical">'), HOST + '/guides/');
assert.equal(canonical('<link data-rel="canonical" href="' + HOST + '/guides/">'), null);
console.log('PASS: ' + count + ' indexable public URLs; strict allowlist, canonical, robots, and restricted-route regression guards');
