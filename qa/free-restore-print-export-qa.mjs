import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'file:///D:/digital-execution-store/.delivery-qa-cli/browser-qa/node_modules/playwright/index.mjs';

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
  await page.locator('#save-pricing').click();
  assert.equal(await page.locator('#history-list .history-item').count(),1);
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
  const dialogs=[];
  page.on('dialog',async dialog=>{dialogs.push(dialog.type());await dialog.accept();});
  await page.locator('#clear-history').click();
  // An empty history deliberately renders one placeholder .history-item.
  assert.deepEqual(dialogs,['confirm'],'Clear must request user confirmation');
  await page.waitForFunction(()=>document.querySelectorAll('#history-list .history-item strong').length===0);
  assert.equal(await page.locator('#history-list .history-item strong').count(),0);
  await page.locator('#backup-file').setInputFiles(backup);
  await page.waitForFunction(()=>document.querySelectorAll('#history-list .history-item strong').length===1);
  assert.equal(await page.locator('#history-list .history-item strong').count(),1);
  assert.deepEqual(dialogs,['confirm','confirm'],'Restore must request user confirmation');
  await page.reload();
  assert.equal(await page.locator('#history-list .history-item').count(),1);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',backupRecords:data.records.length,excelBytes:excel.length,pdfBytes:pdf.length,printCalls:1,restoredRecords:1,errors}));
} finally {await browser.close();}
