import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const guidePages = fs.readdirSync('guides',{withFileTypes:true}).filter(item=>item.isDirectory()).map(item=>'guides/'+item.name+'/index.html');
const files = ['index.html','tools/index.html','services/index.html','guides/index.html','privacy.html','terms.html','licenses.html','404.html','updates/index.html','tools/pricing-calculator/index.html','tools/break-even-calculator/index.html','tools/inventory-health-check/index.html','tools/career-cv-studio/index.html','resources/index.html','resources/prompts/index.html','resources/ai-tools/index.html',...guidePages];
let links = 0;
for (const file of files) {
  const html = fs.readFileSync(file,'utf8');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length,file+': duplicate IDs');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,file+': exactly one page heading');
  assert.equal((html.match(/<main\b/g)||[]).length,1,file+': exactly one main landmark');
  for (const match of html.matchAll(/<(?:a|link|script|img)\b[^>]*?\b(?:href|src)="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(href)) continue;
    const pathname = decodeURIComponent(href.split(/[?#]/)[0]);
    let target = pathname.startsWith('/')
      ? path.resolve(root, '.'+pathname)
      : path.resolve(path.dirname(path.resolve(file)),pathname);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target=path.join(target,'index.html');
    assert.ok(fs.existsSync(target),file+': missing local link or asset '+href);
    links++;
  }
  if (file.startsWith('guides/') && file!=='guides/index.html') {
    assert.ok(html.includes('class="guide-toc"'),file+': contents navigation missing');
    for (const match of html.matchAll(/href="#(guide-section-\d+)"/g)) assert.ok(ids.includes(match[1]),file+': broken contents target '+match[1]);
  }
}
const tools=fs.readFileSync('tools/index.html','utf8');
assert.equal((tools.match(/data-catalog-item/g)||[]).length,5,'Five supported tools including CV');
const guides=fs.readFileSync('guides/index.html','utf8');
assert.equal((guides.match(/data-catalog-item/g)||[]).length,guidePages.length,'All existing guides must be discoverable');
const css=fs.readFileSync('site-premium.css','utf8');
assert.ok(!/@import|https?:\/\//i.test(css),'Shared visual system must not depend on a CDN');
const localFonts=[...css.matchAll(/url\('([^']+\.woff2)'\)/g)].map(match=>match[1]);
assert.equal(localFonts.length,6,'Local Arabic and Latin body/display fonts');
for (const font of localFonts) assert.equal(fs.readFileSync('.'+font).subarray(0,4).toString(),'wOF2','Valid WOFF2 '+font);
console.log('PASS premium site: '+files.length+' pages, '+links+' local links/assets, '+guidePages.length+' guide contents and local fonts');
