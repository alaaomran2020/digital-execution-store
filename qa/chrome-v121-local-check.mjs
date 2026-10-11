import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'calc-free-v121-'));
const file=path.join(dir,'calculator.html');
await fs.copyFile('downloads/Calculator_Suite_Free_v1.2.1.txt',file);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const ctx=await browser.newContext({acceptDownloads:true}); const page=await ctx.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message)); await page.goto(pathToFileURL(file).href);
 for(const [k,v] of Object.entries({cost:'1000000000000',shipping:'0',extra:'0',markup:'1000000000000'}))await page.locator(`#pricing-form [name="${k}"]`).fill(v);
 await page.locator('#pricing-form button[type=submit]').click();await page.locator('#save-pricing').click();
 for(const [k,v] of Object.entries({fixed:'1000000000000',sale:'1000000000000',variable:'999999999999'}))await page.locator(`#break-form [name="${k}"]`).fill(v);
 await page.locator('#break-form button[type=submit]').click();await page.locator('#save-break').click();
 assert.equal(await page.locator('#history-list .history-item').count(),2);await page.reload();assert.equal(await page.locator('#history-list .history-item').count(),2);
 const get=async selector=>{const [d]=await Promise.all([page.waitForEvent('download'),page.locator(selector).click()]);const p=path.join(dir,d.suggestedFilename());await d.saveAs(p);return p;};
 const json=await get('#backup-save');const data=JSON.parse(await fs.readFile(json,'utf8'));assert.equal(data.records.length,2);
 const xlsx=await get('#export-excel');const bytes=await fs.readFile(xlsx);assert.equal(bytes.subarray(0,2).toString(),'PK');
 const pdf=await page.pdf({format:'A4',printBackground:true});assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert.ok(pdf.length>1000);
 await page.locator('#clear-history').click({timeout:3000}).catch(()=>{});
 await page.locator('#backup-file').setInputFiles(json);assert.equal(await page.locator('#history-list .history-item').count(),2);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',chrome:true,records:data.records.length,xlsxBytes:bytes.length,pdfBytes:pdf.length,jsonBytes:(await fs.stat(json)).size,errors,dir}));
}finally{await browser.close();}

