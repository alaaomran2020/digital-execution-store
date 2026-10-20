// Functional checks against a local static server; no production interactions.
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync, readdirSync} from 'node:fs';
import {chromium} from 'playwright';
const origin = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:4173';
const output = process.env.PREMIUM_QA_OUTPUT || 'artifacts/premium-site-qa';
const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
const context = await browser.newContext({reducedMotion:'reduce'});
await context.route('**/*', route => new URL(route.request().url()).origin === new URL(origin).origin ? route.continue() : route.abort());
mkdirSync(output, {recursive:true});
const errors = [], failures = [], results = [];
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) failures.push(response.url() + ' ' + response.status()); });
let assertions = 0;
const check = (value, message) => { assert.ok(value, message); assertions++; };
const go = async route => {
  const response = await page.goto(origin + route, {waitUntil:'load'});
  check(response.ok(), route + ' responds');
  await page.evaluate(() => document.fonts.ready);
};
const common = ['/', '/tools/', '/services/', '/guides/', '/privacy.html', '/terms.html', '/licenses.html', '/404.html', '/updates/', '/tools/pricing-calculator/', '/tools/break-even-calculator/', '/tools/inventory-health-check/', '/tools/career-cv-studio/', '/resources/', '/resources/prompts/', '/resources/ai-tools/'];
const guides = readdirSync('guides', {withFileTypes:true}).filter(entry => entry.isDirectory()).map(entry => '/guides/' + entry.name + '/');
try {
  for (const width of [320,390,768,1440]) {
    await page.setViewportSize({width, height:900});
    const routes = width === 320 || width === 1440 ? [...common, ...guides] : common;
    for (const route of routes) {
      await go(route);
      const metrics = await page.evaluate(() => ({width:innerWidth, scroll:document.documentElement.scrollWidth, h1:document.querySelectorAll('h1').length, main:document.querySelectorAll('main').length, missingImages:[...document.images].filter(image=>image.loading!=='lazy' && (!image.complete || image.naturalWidth===0)).map(image=>image.src)}));
      check(metrics.scroll <= width + 1, route + ' has no overflow at ' + width);
      check(metrics.h1 === 1 && metrics.main === 1, route + ' has one main title and landmark');
      check(metrics.missingImages.length === 0, route + ' visible images load');
      if (route === '/' || route === '/tools/pricing-calculator/' || route === '/guides/' || route === '/services/') {
        await page.screenshot({path:output+'/'+(route==='/'?'home':route.split('/').filter(Boolean).join('-'))+'-'+width+'.png', fullPage:true});
      }
      results.push({route,width,status:'PASS'});
    }
    console.log('PASS layout: '+width+'px, '+routes.length+' routes');
  }
  await page.setViewportSize({width:390,height:844});
  await go('/');
  await page.locator('.site-header-menu-btn').click();
  check(await page.locator('#siteHeaderMobile').isVisible(),'Mobile menu opens');
  await page.keyboard.press('Escape');
  check(!await page.locator('#siteHeaderMobile').isVisible(),'Escape closes mobile menu');
  check(await page.locator('.site-header-menu-btn').getAttribute('aria-expanded')==='false','Closed state is announced');
  await page.locator('#landing-cost').fill('200');
  await page.locator('#landing-markup').fill('25');
  check((await page.locator('#landing-price').textContent()).includes('٢٥٠'),'Homepage preview calculates 250 EGP');
  await page.locator('#landing-cost').fill('-1');
  check((await page.locator('#landing-price').textContent()).includes('راجع'),'Homepage rejects negative costs');
  for (const [route,total,category] of [['/tools/',5,'inventory'],['/guides/',29,'career']]) {
    await go(route);
    check(await page.locator('[data-catalog-item]:visible').count()===total,route+' initial items');
    await page.locator(`[data-catalog-filter="${category}"]`).click();
    const visible = await page.locator('[data-catalog-item]:visible').count();
    check(visible>0 && visible<total,route+' category filter narrows results');
    await page.locator('#catalog-search').fill('zzzz-unmatched');
    check(await page.locator('[data-catalog-empty]').isVisible(),route+' empty state');
    await page.locator('[data-catalog-reset]').click();
    check(await page.locator('[data-catalog-item]:visible').count()===total,route+' reset restores items');
    await page.locator('#catalog-search').fill(route==='/tools/'?'تَسْعير':'مَخزون');
    check(await page.locator('[data-catalog-item]:visible').count()>0,route+' Arabic diacritics normalize');
  }
  await go('/tools/pricing-calculator/');
  for (const [id,value] of [['cost','100'],['shipping','10'],['extra','10'],['markup','25']]) await page.locator('#'+id).fill(value);
  await page.locator('#pricingForm button').click();
  check((await page.locator('#salePrice').textContent()).includes('١٥٠'),'Pricing: 120 plus 25% = 150');
  check((await page.locator('#profit').textContent()).includes('٣٠'),'Pricing profit = 30');
  check((await page.locator('#margin').textContent()).includes('٢٠'),'Pricing margin = 20%');
  await page.locator('#cost').fill('-1');
  check(!await page.locator('#cost').evaluate(input=>input.checkValidity()),'Negative input rejected');
  await go('/tools/break-even-calculator/');
  await page.locator('#breakEvenForm button').click();
  check((await page.locator('#breakEvenUnits').textContent()).includes('١٢٥'),'Break-even: 10000 / 80 = 125 units');
  await page.locator('#sellingPrice').fill('100');
  await page.locator('#breakEvenForm button').click();
  check((await page.locator('#status').textContent()).includes('أكبر'),'Nonpositive contribution explained');
  check((await page.locator('#breakEvenUnits').textContent()).trim()==='—','Invalid calculation clears prior result');
  await go('/tools/inventory-health-check/');
  for (const [id,value] of [['totalSkus','100'],['lowStockSkus','10'],['reorderSkus','80'],['stockoutSkus','5']]) await page.locator('#'+id).fill(value);
  await page.locator('#healthForm button[type=submit]').click();
  check((await page.locator('#scoreValue').textContent()).startsWith('88'),'Inventory weighted score = 88');
  await page.locator('#lowStockSkus').fill('101');
  await page.locator('#healthForm button[type=submit]').click();
  check(await page.locator('#formError').isVisible(),'Inventory rejects subtotal above total');
  check(!await page.locator('#result').isVisible(),'Invalid inventory input hides stale result');
  await go('/resources/prompts/');
  check(await page.locator('.prompt-card:visible').count()===12,'All twelve prompts retained');
  await page.locator('.favorite-btn').first().click();
  check(await page.locator('.favorite-btn').first().getAttribute('aria-pressed')==='true','Prompt can be saved');
  await page.reload();
  check(await page.locator('.favorite-btn').first().getAttribute('aria-pressed')==='true','Favorite survives reload');
  await page.locator('#prompt-search').fill('zzzz-unmatched');
  check(await page.locator('#empty-state').isVisible(),'Prompt search empty state works');
  await page.locator('#reset-filters').click();
  check(await page.locator('.prompt-card:visible').count()===12,'Prompt reset works');
  await go('/resources/ai-tools/');
  await page.selectOption('[name=goal]','writing');
  await page.selectOption('[name=format]','text');
  await page.selectOption('[name=mode]','quick');
  await page.locator('#ai-finder button[type=submit]').click();
  check(await page.locator('#ai-result').isVisible(),'AI chooser recommendation displayed');
  await go('/tools/career-cv-studio/');
  check(await page.locator('#saveBtn').isVisible() && await page.locator('#printBtn').isVisible(),'CV app controls survive shared header rendering');
  await page.locator('#fullName').fill('اختبار السيرة الذاتية');
  await page.locator('#saveBtn').click();
  await page.reload();
  check(await page.locator('#fullName').inputValue()==='اختبار السيرة الذاتية','CV app save survives reload');
  await page.locator('#themeToggle').click();
  check(await page.locator('html').getAttribute('data-theme')==='dark','CV dark theme still works');
  await page.emulateMedia({media:'print'});
  check(!await page.locator('.site-header-shell').isVisible() && !await page.locator('.site-footer-pro').isVisible(),'Shared navigation excluded from CV printing');
  await page.emulateMedia({media:'screen'});
  await go('/guides/reorder-point/');
  const tocLink = page.locator('.guide-toc a').first();
  const target = await tocLink.getAttribute('href');
  await tocLink.click();
  check(new URL(page.url()).hash===target,'Guide contents navigate to real heading');
  check(errors.length===0,'No browser JavaScript errors: '+errors.join('; '));
  check(failures.length===0,'No failed local assets: '+failures.join('; '));
  console.log('PASS functional checks; total assertions='+assertions);
} catch(error) {
  results.push({status:'FAIL',message:String(error),url:page.url()});
  throw error;
} finally {
  writeFileSync(output+'/report.json',JSON.stringify({origin,assertions,errors,failures,results},null,2));
  await browser.close();
}
