import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const port = 8765;
const server = spawn('python3', ['-m','http.server',String(port),'--bind','127.0.0.1'], { stdio:'ignore' });
let browser;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
try {
  let available = false;
  for (let i=0; i<40; i++) {
    if (server.exitCode !== null) throw new Error('Local web server exited');
    try { const response=await fetch('http://127.0.0.1:'+port+'/data/products.json'); if(response.ok){available=true;break;} } catch {}
    await sleep(250);
  }
  assert.ok(available,'Local web server did not start');
  browser = await chromium.launch({headless:true});
  for (const width of [1440,768,390]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    const errors=[];
    page.on('pageerror', err=>errors.push(err.message));
    await page.goto('http://127.0.0.1:'+port+'/products/accountant-professional-toolkit/',{waitUntil:'networkidle'});
    await page.locator('.purchase-facts-section').waitFor({state:'visible',timeout:15000});
    assert.equal(await page.locator('.purchase-fact').count(),4,'Purchase facts count');
    assert.equal(await page.locator('#buy').count(),1,'Buy section anchor');
    assert.equal(await page.locator('body').getAttribute('data-page'),'product');
    assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'),'../../favicon/favicon.svg');
    const favicon=await page.request.get('http://127.0.0.1:'+port+'/favicon/favicon.svg');
    assert.equal(favicon.status(),200,'SVG favicon HTTP status');
    const commercial=await page.locator('#buy').innerText();
    assert.ok(commercial.includes('699'),'Original price remains visible');
    const link=page.locator('a[href="#buy"]').first();
    await link.click();
    assert.equal(new URL(page.url()).hash,'#buy','Buy anchor navigation');
    assert.deepEqual(errors,[],'JavaScript exceptions');
    console.log('PASS accountant browser width '+width);
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
