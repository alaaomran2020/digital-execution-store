// Negative test: adding a new product image MUST NOT silently publish it.
// This runs locally in CI only, without touching external services.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const probe = 'assets/products/__staging-unapproved-image-test.webp';
assert.ok(fs.existsSync('assets/products'), 'Expected product image source directory');
assert.ok(!fs.existsSync(probe), 'Probe path already occupied; refusing overwrite');
try {
  fs.writeFileSync(probe, 'This synthetic fixture is intentionally not a public asset.\n', {flag:'wx'});
  const run = spawnSync(process.execPath, ['qa/build-staging.mjs'], {
    env: { ...process.env, CF_PAGES_BRANCH: 'staging' },
    encoding: 'utf8'
  });
  assert.equal(run.status, 0, 'Build failed during negative test: ' + (run.stderr || run.stdout));
  assert.equal(fs.existsSync('dist-staging/' + probe), false,
    'Unapproved product media leaked into staging artifact');
  console.log('PASS: unapproved product asset was not published by allowlisted builder');
} finally {
  if (fs.existsSync(probe)) fs.unlinkSync(probe);
}
