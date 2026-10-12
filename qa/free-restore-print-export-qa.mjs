import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
// CI installs Playwright in this repository. Override only for an isolated local QA installation.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'free-restore-print-'));
const html=path.join(tmp,'calculator.html');
await fs.copyFile('downloads/Calculator_Suite_Free_v1.2.1.txt',html);
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(html).href);
  // Browser accessibility semantics: labels, descriptions and live announcements.
  assert.equal(await page.locator('input[name="cost"]').getAttribute('aria-describedby'),'help-cost');
  assert.equal(await page.locator('#pricing-result').getAttribute('aria-live'),'polite');
  assert.equal(await page.locator('#history-status').getAttribute('role'),'status');
  await page.locator('#save-pricing').click();
  assert.equal(await page.locator('#history-list .history-item').count(),1);
  assert.ok((await page.locator('#pricing-result').textContent()).trim().length>0,'Calculation result must be announced in live output');
  assert.ok((await page.locator('#history-status').textContent()).trim().length>0,'Save feedback must be available in status region');
  const getDownload=async (selector)=>{
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator(selector).click()]);
    const dest=path.join(tmp,download.suggestedFilename());
    await download.saveAs(dest);
    return dest;
  };
  const backup=await getDownload('#backup-save');
  const data=JSON.parse(await fs.readFile(backup,'utf8'));
  assert.equal(data.records.length,1);
  const excel=await fs.readFile(await getDownload('#export-excel'));
  assert.equal(excel.subarray(0,2).toString(),'PK');
  assert.ok(excel.includes(Buffer.from('xl/workbook.xml')));
  assert.ok(excel.includes(Buffer.from('xl/worksheets/sheet1.xml')));
  const printCalls=await page.evaluate(()=>{window.__printCalls=0;window.print=()=>{window.__printCalls++};return window.__printCalls});
  assert.equal(printCalls,0);
  await page.locator('#export-pdf').click();
  assert.equal(await page.evaluate(()=>window.__printCalls),1);
  assert.ok((await page.locator('#print-rows tr').count())>0);
  const pdf=await page.pdf({format:'A4',printBackground:true});
  assert.equal(pdf.subarray(0,4).toString(),'%PDF');
  assert.ok(pdf.length>1000);
  // Cancellation must not discard existing records, even when the backup has fewer records.
  await page.locator('#save-break').click();
  assert.equal(await page.locator('#history-list .history-item strong').count(),2);
  const dialogs=[];
  const decisions=[false,false,true,true];
  page.on('dialog',async dialog=>{
    dialogs.push(dialog.type());
    if(decisions.shift()) await dialog.accept();
    else await dialog.dismiss();
  });
  await page.locator('#backup-file').setInputFiles(backup);
  await page.waitForFunction(()=>document.querySelector('#history-status').textContent.includes('اتغيرت'));
  assert.equal(await page.locator('#history-list .history-item strong').count(),2,'Cancelled restore must preserve history');
  await page.locator('#clear-history').click();
  assert.equal(await page.locator('#history-list .history-item strong').count(),2,'Cancelled clear must preserve history');
  await page.reload();
  assert.equal(await page.locator('#history-list .history-item strong').count(),2,'Cancelled operations must preserve persisted history');
  await page.locator('#clear-history').click();
  // An empty history deliberately renders one placeholder .history-item.
  assert.deepEqual(dialogs,['confirm','confirm','confirm'],'Restore and clear must request user confirmation');
  await page.waitForFunction(()=>document.querySelectorAll('#history-list .history-item strong').length===0);
  assert.equal(await page.locator('#history-list .history-item strong').count(),0);
  await page.locator('#backup-file').setInputFiles(backup);
  await page.waitForFunction(()=>document.querySelectorAll('#history-list .history-item strong').length===1);
  assert.equal(await page.locator('#history-list .history-item strong').count(),1);
  assert.deepEqual(dialogs,['confirm','confirm','confirm','confirm'],'Restore must request user confirmation');
  await page.reload();
  assert.equal(await page.locator('#history-list .history-item').count(),1);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',backupRecords:data.records.length,excelBytes:excel.length,pdfBytes:pdf.length,printCalls:1,restoredRecords:1,errors}));
} finally {await browser.close();}
