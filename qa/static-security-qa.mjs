// Offline security checks for public GitHub Pages source and browser-only data.
// No network, packages, private credentials or production site access required.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const read=file=>fs.readFileSync(file,'utf8');
let checks=0;
const check=(condition,message)=>{assert.ok(condition,message);checks++;};

const tracked=spawnSync('git',['ls-files','-z'],{encoding:'utf8'});
assert.equal(tracked.status,0,'Git tracked-file listing must be available');
const files=tracked.stdout.split('\0').filter(Boolean);
const privatePath=/(?:^|\/)(?:\.env(?:\.|$)|private\/|products-private\/|node_modules\/)|\.(?:pem|key|p12|pfx|zip|exe|msi|dmg|apk)$/i;
const credentialPattern=/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[0-9A-Za-z]{36,}\b|\bsk_live_[A-Za-z0-9]{20,}\b/;
for(const file of files){
  const normalized=file.replaceAll('\\','/');
  check(!privatePath.test(normalized),'Private binary/credential path tracked in public repository: '+normalized);
  if(!/\.(?:js|mjs|html|json|ya?ml|txt|md)$/i.test(normalized))continue;
  if(fs.statSync(file).size>2_000_000)continue;
  check(!credentialPattern.test(read(file)),'High-confidence credential pattern in tracked file: '+normalized);
}

const mode=JSON.parse(read('data/storefront-mode.json'));
check(mode.productsVisible===false,'Paid products must remain paused');
check(read('robots.txt').includes('Allow: /products/'),'Paused noindex pages must be crawlable');
check(!read('.github/workflows/store-qa.yml').includes('deploy-pages'),'Security QA must not deploy');

function storage(initial={}){
  const data=new Map(Object.entries(initial));
  return {
    getItem:key=>data.get(key)??null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key)
  };
}

// Browser-only analytics: do not persist tokens from referrer queries; exported
// visitor-provided campaign labels must never become spreadsheet formulas.
const sessionStorage=storage(),localStorage=storage(),blobs=[];
class BrowserURL extends URL {
  static createObjectURL(blob){blobs.push(blob);return 'blob:test'}
  static revokeObjectURL(){}
}
const document={
  referrer:'https://external.example/path?access_token=DO_NOT_SAVE#secret',
  body:{dataset:{page:'guide',guideSlug:'sample-guide'}},
  querySelectorAll:()=>[],
  querySelector:()=>null,
  getElementById:()=>null,
  addEventListener:()=>{},
  createElement:()=>({click(){}})
};
const window={
  location:{href:'https://digital-execution.cc/guides/sample/?utm_source=search&utm_campaign=%3DHYPERLINK%28%22https%3A%2F%2Fevil.example%22%29'},
  addEventListener:()=>{},
  dispatchEvent:()=>{}
};
const storefront=vm.createContext({
  document,window,location:{origin:'https://digital-execution.cc'},
  navigator:{userAgent:'fixture'},URL:BrowserURL,sessionStorage,localStorage,
  Blob:class {constructor(parts){this.parts=parts}},
  CustomEvent:class{},crypto:{randomUUID:()=> 'test-uuid'},setTimeout:()=>{},
  console
});
vm.runInContext(read('script.js'),storefront,{filename:'script.js'});
const events=JSON.parse(localStorage.getItem('de:production-events:v1'));
check(events.length===1,'Guide test should store one analytics event');
check(events[0].referrer==='https://external.example','Referrer must store only origin');
check(!JSON.stringify(events).includes('DO_NOT_SAVE'),'Referrer token leaked to local events');
check(events[0].utm_campaign.startsWith('='),'Spreadsheet test campaign not recorded');
events[0].referrer='https://external.example/path?legacy_token=DO_NOT_EXPORT';
localStorage.setItem('de:production-events:v1',JSON.stringify(events));
window.DigitalExecutionAnalytics.exportEvents();
check(blobs.length===1,'CSV export did not produce blob');
check(blobs[0].parts.join('').includes("'=HYPERLINK"),'Analytics CSV must neutralize formula values');
check(!blobs[0].parts.join('').includes('DO_NOT_EXPORT'),'CSV export leaked legacy referrer token');

// Imported Search Console and Funnel CSV content is not trusted HTML. The
// dashboard renders all four table types from saved/imported records.
const injection='<img src=x onerror=alert(1)>';
const elements=new Map();
const select=selector=>{
  if(!elements.has(selector))elements.set(selector,{
    className:'',textContent:'',innerHTML:'',value:'',files:[],
    addEventListener:()=>{}
  });
  return elements.get(selector);
};
const saved={
  pages:[{key:injection,clicks:1,impressions:5,ctr:0.2,position:1}],
  queries:[{key:injection,clicks:1,impressions:5,ctr:0.2,position:1}],
  events:[{event:'guide_view',path:'/guides/test/',landing_path:'/guides/test/',
    product_slug:injection,utm_source:injection,utm_campaign:injection,guide_slug:injection}],
  orders:[{order_id:'test',product:injection,lead_status:'PAID',payment_verified_at:'2026-10-21'}]
};
const dashboard=vm.createContext({
  document:{querySelector:select},
  localStorage:storage({'de:seo-dashboard:v1':JSON.stringify(saved)}),
  location:{origin:'https://digital-execution.cc'},
  URL,Intl,Blob:class{},console
});
vm.runInContext(read('operations/seo-performance-dashboard.js'),dashboard,{
  filename:'operations/seo-performance-dashboard.js'
});
for(const id of ['#pagesTableWrap','#queriesTableWrap','#funnelTableWrap','#acquisitionTableWrap']){
  const html=select(id).innerHTML;
  check(html.includes('&lt;img'),'HTML payload was not rendered as escaped text: '+id);
  check(!html.includes(injection),'Raw attacker markup reached dashboard HTML: '+id);
}
check(vm.runInContext("csvEscape('  =1+1')",dashboard)==="'  =1+1",'Dashboard CSV formula escaped');
check(vm.runInContext("csvEscape('normal,comma')",dashboard)==='"normal,comma"','Dashboard CSV syntax preserved');

console.log('PASS '+checks+' static secret, paused-storefront and browser-data security checks');
