// Read-only smoke and browser checks against an isolated Cloudflare Pages staging URL.
// No checkout, payments, emails or user-data mutation.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const rawUrl = process.env.STAGING_URL?.trim();
assert.ok(rawUrl, 'STAGING_URL is required');
const url = new URL(rawUrl);
assert.equal(url.protocol, 'https:', 'Staging must use HTTPS');
assert.match(url.hostname, /^(?:[a-z0-9-]+\.)+pages\.dev$/, 'Only a Cloudflare *.pages.dev hostname is allowed');
assert.equal(url.username, '', 'URL credentials are forbidden');
assert.equal(url.password, '', 'URL credentials are forbidden');
assert.equal(url.port, '', 'Custom ports are forbidden');
assert.equal(url.pathname, '/', 'Supply the project origin, not a path');
assert.equal(url.search, '', 'Query parameters are forbidden');
assert.equal(url.hash, '', 'Fragments are forbidden');
const origin = url.origin;
const expectedCommit = process.env.EXPECTED_STAGING_COMMIT?.trim() || null;
assert.ok(!expectedCommit || /^[a-f0-9]{40}$/i.test(expectedCommit), 'Expected commit must be a full Git SHA');

const report = { origin, expectedCommit, checkedAt: new Date().toISOString(), checks: [] };
function record(ok, name, detail = '') {
  report.checks.push({ ok, name, detail });
  assert.ok(ok, name + (detail ? ': ' + detail : ''));
}
async function get(path) {
  const target = new URL(path, origin);
  assert.equal(target.origin, origin, 'Cross-origin redirects and requests are forbidden');
  const response = await fetch(target, {
    redirect: 'manual',
    signal: AbortSignal.timeout(30000),
    headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'DigitalExecution-StagingQA/1.0' }
  });
  record(response.status === 200, 'HTTP 200 for ' + path, 'status=' + response.status);
  const header = (response.headers.get('x-robots-tag') || '').toLowerCase();
  record(['noindex', 'nofollow', 'noarchive'].every(x => header.includes(x)),
    'Staging noindex header for ' + path, header);
  return response.text();
}
async function waitForExpectedDeployment() {
  if (!expectedCommit) return;
  for (let attempt = 1; attempt <= 16; attempt++) {
    try {
      const response = await fetch(origin + '/staging-build.json?qa=' + Date.now(), {
        redirect: 'manual', signal: AbortSignal.timeout(10000),
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.status === 200) {
        const current = await response.json();
        if (current.branch === 'staging' &&
            String(current.commit || '').toLowerCase() === expectedCommit.toLowerCase()) {
          console.log('Expected deployment is live:', expectedCommit, 'attempt', attempt);
          return;
        }
      }
    } catch (error) {
      console.log('Staging deployment not ready:', String(error));
    }
    if (attempt < 16) await new Promise(resolve => setTimeout(resolve, 15000));
  }
  throw new Error('Expected staging commit was not deployed on the Pages URL during the bounded readiness checks: ' + expectedCommit);
}
try {
  await waitForExpectedDeployment();
  const [home, services, studio, tools, calculator, css, modeText, manifestText] = await Promise.all([
    get('/'), get('/services/'), get('/services/graphic-design/'), get('/tools/'),
    get('/tools/pricing-calculator/'), get('/services/graphic-design/studio.css?v=20261010-v1'),
    get('/data/storefront-mode.json'), get('/staging-build.json')
  ]);
  record(home.includes('متوقف مؤقتًا'), 'Home page keeps storefront paused');
  record(services.includes('التصميم'), 'Services section available');
  record(tools.includes('حاسب'), 'Independent calculators directory available');
  record(calculator.includes('<html') || calculator.includes('<!doctype html'), 'Pricing calculator HTML available');
  record(studio.includes('ds-service-grid'), 'Design studio content available');
  const cards = studio.match(/<article\b[^>]*class=["'][^"']*\bds-service-card\b/g) || [];
  record(cards.length === 8, 'Eight creative studio cards', 'found=' + cards.length);
  record(css.includes('body.design-studio'), 'Design studio CSS loaded from staging');
  const mode = JSON.parse(modeText);
  record(mode.productsVisible === false, 'Products remain hidden');
  const manifest = JSON.parse(manifestText);
  record(manifest.branch === 'staging', 'Build originates from staging branch', String(manifest.branch));
  record(/^[a-f0-9]{40}$/.test(manifest.commit || ''), 'Cloudflare build commit included', String(manifest.commit));
  if (expectedCommit) {
    record(manifest.commit.toLowerCase() === expectedCommit.toLowerCase(), 'Expected staging commit deployed',
      'published=' + manifest.commit);
  }
  const registryResponse = await fetch(origin + '/data/products.json', {
    redirect: 'manual', signal: AbortSignal.timeout(10000),
    headers: { 'Cache-Control': 'no-cache' }
  });
  record([404, 410].includes(registryResponse.status),
    'Paused preview does not publicly expose the historical product registry',
    'status=' + registryResponse.status);
  const browser = spawnSync(process.execPath, ['qa/design-studio-browser-qa.mjs'], {
    env: { ...process.env, PREVIEW_ORIGIN: origin }, stdio: 'inherit'
  });
  record(browser.status === 0, 'Real Chromium mobile / desktop QA', 'exit=' + browser.status);
  console.log('PASS: Cloudflare staging remote content, safety headers, release fingerprint and browser checks');
} catch (error) {
  report.failure = String(error);
  console.error('FAIL:', String(error));
  process.exitCode = 1;
} finally {
  mkdirSync('artifacts/design-visual-qa', { recursive: true });
  writeFileSync('artifacts/design-visual-qa/cloudflare-staging-report.json',
    JSON.stringify(report, null, 2) + '\n');
}
