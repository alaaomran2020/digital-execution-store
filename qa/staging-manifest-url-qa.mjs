// Offline unit regression for the staging fingerprint cache-bypass contract.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stagingManifestUrl } from './staging-manifest-url.mjs';

const origin = 'https://digital-execution-staging.pages.dev';
const one = stagingManifestUrl(origin, 'nonce-00000001');
const two = stagingManifestUrl(origin, 'nonce-00000002');
assert.equal(one.origin, origin);
assert.equal(one.pathname, '/staging-build.json');
assert.equal(one.searchParams.get('qa'), 'nonce-00000001');
assert.notEqual(one.href, two.href, 'Each request needs a unique URL');
assert.throws(() => stagingManifestUrl('https://digital-execution.cc', 'nonce-00000001'),
  /Cloudflare Pages/);
assert.throws(() => stagingManifestUrl(origin, '../traversal'), /nonce/);
const remoteQA = fs.readFileSync('qa/cloudflare-staging-remote-qa.mjs', 'utf8');
assert.ok(remoteQA.includes("path === '/staging-build.json'") &&
  remoteQA.includes('stagingManifestUrl(origin, randomUUID())'),
  'Both readiness and final manifest checks must bypass shared cache URLs');
const headers = fs.readFileSync('_headers', 'utf8');
assert.ok(/\/staging-build\.json\s+Cache-Control: no-store, max-age=0/.test(headers),
  'Staging manifest must carry no-store caching policy');
console.log('PASS: deployment manifest uses unique URLs and no-store headers');
