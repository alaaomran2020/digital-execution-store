import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const read = p => fs.readFileSync(p, 'utf8');
const page = read('qa/two-products-preview/index.html');
const css = read('qa/two-products-preview/style.css');
const mode = JSON.parse(read('data/storefront-mode.json'));
let checks = 0;
const ok = (assertion, message) => { assert.ok(assertion, message); checks += 1; };

ok(mode.productsVisible === false, 'The real storefront must remain paused');
ok(read('products/index.html').includes('عرض المنتجات متوقف حاليًا'), 'Do not enable the live products page');
ok(read('qa/build-staging.mjs').includes("'qa'"), 'Preview folder must be excluded from Cloudflare Staging builds');
ok(page.includes('name="robots" content="noindex,nofollow,noarchive"'), 'No indexing of review page');
ok(page.includes('معاينة اختبار فقط'), 'Must warn clearly that this is a QA preview');
ok(page.includes('href="./style.css"'), 'Local stylesheet missing');
ok(css.includes('@media(max-width:760px)') && css.includes('@media(max-width:390px)'), 'Responsive breakpoints missing');
ok(page.includes('href="#main"'), 'Keyboard skip navigation missing');
ok(page.includes('نتحقق من وصول المبلغ'), 'Manual payment verification language missing');
ok(page.includes('بدون اشتراك'), 'No-subscription explanation missing');
ok(page.includes('ملف ZIP'), 'Explicit private file delivery explanation missing');
ok(!/stripe|paypal|checkout\.com|\bfetch\s*\(|api\/redeem|api\/orders|DELIVERY_ADMIN_TOKEN/i.test(page), 'Checkout/API code must not be present');
ok(!/\.(zip|rar|7z)["']/.test(page), 'Paid artifact filename must not be embedded in HTML');
ok(!fs.existsSync('qa/two-products-preview/starter.zip'), 'Commercial archive inside public HTML preview');
ok(!fs.existsSync('qa/two-products-preview/professional.zip'), 'Commercial archive inside public HTML preview');
const found = [...page.matchAll(/<article\b[^>]*data-product="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(found, ['calculator-suite-starter','calculator-suite-professional']); checks += 1;
const buttons = [...page.matchAll(/<a\b[^>]*class="order-link[^"]*"[^>]*data-sku="([^"]+)"[^>]*data-price="([^"]+)"[^>]*>/g)];
assert.deepEqual(buttons.map(m=>[m[1],m[2]]), [['calculator-suite-starter','399'],['calculator-suite-professional','999']]); checks += 1;
ok(buttons.length === 2, 'Expected exactly two WhatsApp buttons');
ok(buttons.every(match => match[0].includes('href="https://wa.me/201011673107"')), 'Unexpected WhatsApp destination');
ok(buttons.every(match => match[0].includes('rel="noopener noreferrer"')), 'Missing noreferrer for external link');
ok((page.match(/class="price"/g)||[]).length === 2, 'Exactly two prices expected');

const inline = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)];
ok(inline.length === 1, 'Exactly one isolated order-message enhancer expected');
const fakeLinks = buttons.map(m => ({ dataset:{sku:m[1],price:m[2]}, href:'https://wa.me/201011673107' }));
const sandbox = { document:{querySelectorAll:selector=>{
  assert.equal(selector,'.order-link[data-sku]');
  return fakeLinks;
}}, encodeURIComponent };
vm.runInNewContext(inline[0][1],sandbox,{timeout:1000});
for(let i=0;i<fakeLinks.length;i++) {
  const url = new URL(fakeLinks[i].href);
  ok(url.hostname === 'wa.me' && url.pathname === '/201011673107', 'Wrong WhatsApp number');
  const text = url.searchParams.get('text');
  ok(text.includes(i===0?'Calculator Suite Starter':'Calculator Suite Professional'), 'Order message missing chosen product');
  ok(text.includes(i===0?'399':'999'), 'Order message missing stated price');
  ok(text.includes('طلب تجريبي') && text.includes('لا يعد طلب شراء'), 'Preview message must not look like a real sale');
}
console.log('PASS ' + checks + ' isolated two-product WhatsApp preview checks; products still hidden in staging/production');
