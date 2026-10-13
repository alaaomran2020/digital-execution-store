// Strict SEO review of public career guides while the commercial catalog is paused.
// All links and social previews must resolve to public, permitted resources.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const guides = [
  'ats-cv-arabic', 'ats-keywords', 'cover-letter-guide', 'cv-achievements',
  'cv-experienced', 'cv-fresh-graduates', 'cv-skills', 'cv-summary-examples',
  'linkedin-profile-job-search', 'star-interview'
];
const mode = JSON.parse(fs.readFileSync('data/storefront-mode.json', 'utf8'));
assert.equal(mode.productsVisible, false);
for(const slug of guides){
  const file = 'guides/' + slug + '/index.html';
  const page = fs.readFileSync(file, 'utf8');
  const canonical = 'https://digital-execution.cc/guides/' + slug + '/';
  assert.ok(page.includes('<link rel="canonical" href="' + canonical + '">'), file + ': canonical');
  assert.ok(!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(page), file + ': must remain indexable');
  assert.ok(!/href=["'][^"']*\/products\//i.test(page), file + ': paused paid product link');
  assert.ok(!/(guide_product_click|data-product-slug=["']career-kit|شوف Career Kit|شوف المنتج)/.test(page),
    file + ': paused paid promotion markers');
  assert.ok(!page.includes('/assets/career-kit/career-kit-og.png'),
    file + ': unapproved paid catalog social image');
  assert.ok(page.includes('https://digital-execution.cc/assets/social/digital-execution-og.png'),
    file + ': neutral public OG asset');
  const topical = slug === 'ats-cv-arabic' ? '../ats-keywords/' : '../ats-cv-arabic/';
  assert.ok(page.includes('href="' + topical + '"'), file + ': missing contextual learning link');
  assert.ok(page.includes('href="../../tools/"'), file + ': active free tools navigation');
}
console.log('PASS: ' + guides.length + ' indexable career guides link to active educational resources only');
