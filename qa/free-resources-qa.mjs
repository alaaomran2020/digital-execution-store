import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";

const read=path=>fs.readFileSync(path,"utf8");
const promptPage=read("resources/prompts/index.html");
const promptCss=read("resources/prompts/styles.css");
const promptJs=read("resources/prompts/library.js");
const directory=read("resources/index.html");
const directoryCss=read("resources/index.css");
const mode=JSON.parse(read("data/storefront-mode.json"));

assert.equal(mode.productsVisible,false,"Hidden product guard must remain active");
assert.match(promptPage,/<meta name="robots" content="noindex,nofollow">/,"Prompt draft must stay non-indexable");
assert.match(directory,/<meta name="robots" content="noindex,nofollow">/,"Resource directory draft must stay non-indexable");
const promptCards=[...promptPage.matchAll(/<article class="prompt-card" data-category="([^"]+)" data-prompt-id="([^"]+)">/g)];
assert.equal(promptCards.length,12,"Expect twelve original free prompt cards");
assert.equal(new Set(promptCards.map(card=>card[2])).size,promptCards.length,"Prompt IDs must be unique for stable local favorites");
assert.equal((promptPage.match(/class="copy-btn"/g)||[]).length,promptCards.length,"Each prompt needs a copy action");
assert.equal((promptPage.match(/class="favorite-btn"/g)||[]).length,promptCards.length,"Each prompt needs a favorite action");
assert.equal((promptPage.match(/<details>/g)||[]).length,promptCards.length,"Each prompt must stay readable without scripts");
for(const tag of ["all","design","marketing","customer","work","favorites"]){
  assert.ok(promptPage.includes('data-filter="'+tag+'"'),"Missing prompt filter "+tag);
}
assert.ok(promptPage.includes('id="prompt-search"'),"Prompt search field missing");
assert.ok(promptPage.includes('id="clear-search"')&&promptPage.includes('id="reset-filters"'),"Search clearing and empty-state recovery missing");
assert.ok(promptPage.includes('id="favorites-count"'),"Saved prompts count missing");
assert.ok(promptPage.includes('aria-live="polite"'),"Prompt feedback status missing");
assert.ok(promptJs.includes("card.hidden=")&&promptJs.includes("copyText("),"Local search/copy implementation missing");
assert.ok(promptJs.includes('de:prompt-favorites:v1')&&!promptJs.includes('de:favorites:v1'),"Prompt favorites must be separate from paid-product favorites");
assert.ok(promptJs.includes("saveFavorites()")&&promptJs.includes("aria-pressed"),"Favorites persistence/accessibility missing");
assert.ok(!/\bfetch\s*\(|\bXMLHttpRequest\b|https?:\/\//i.test(promptJs),"Free prompt features must remain completely local");
assert.ok(promptCss.includes("@media(max-width:700px)"),"Prompt mobile layout missing");
assert.ok(directoryCss.includes("@media(max-width:700px)"),"Resource directory mobile layout missing");

const matches=[...directory.matchAll(/class="resource-card" href="(\/[^"]+)"/g)];
const targets=matches.map(item=>item[1]);
const expected=[
  "/resources/prompts/",
  "/tools/pricing-calculator/",
  "/tools/break-even-calculator/",
  "/tools/inventory-health-check/",
  "/tools/career-cv-studio/",
  "/guides/inventory-management-small-shops/",
  "/guides/online-orders-inventory/",
  "/guides/ats-cv-arabic/",
  "/guides/freelancer-management/"
];
assert.deepEqual([...targets].sort(),[...expected].sort(),"Only reviewed standalone free resources should be linked");
for(const target of [...expected,"/tools/","/guides/"]){
  assert.ok(fs.existsSync(target.slice(1)+"index.html"),"Broken internal resource route: "+target);
}
for(const target of expected.filter(path=>path.startsWith("/tools/"))){
  const toolPage=read(target.slice(1)+"index.html");
  assert.ok(!/href=["'][^"']*\/products\//i.test(toolPage),"Featured free resource links to paused commercial route: "+target);
}
for(const [name,source] of [["Hub HTML",directory],["Hub CSS",directoryCss],["Prompt HTML",promptPage],["Prompt JS",promptJs],["Prompt CSS",promptCss]]){
  assert.ok(!/https?:\/\//i.test(source),name+" must not load third-party dependencies");
  assert.ok(!/\/products\//i.test(source),name+" must not expose paused commercial products");
}
assert.ok(directory.includes('href="/guides/"'),"Must link to the existing guides directory instead of duplicating it");
assert.equal((directory.match(/href="#guides"/g)||[]).length,1,"Guide navigation must appear once");
for(const target of expected.filter(path=>path.startsWith("/guides/"))){
  const html=read(target.slice(1)+"index.html");
  assert.ok(!/(?:href|action)\s*=\s*["'][^"']*\/(?:products|checkout|after-purchase)(?:\/|[?#"'])/i.test(html),"Guide still has hidden commercial links: "+target);
  assert.ok(!/data-guide-product|data-product-slug|guide_product_click/i.test(html),"Guide has paused-product tracking: "+target);
}
assert.ok(!/<script\b/i.test(directory),"Free directory must render without JavaScript");
assert.ok(!directory.includes("data-product-card"),"Paid catalogue card may not appear in free resources");
const map=read("sitemap.xml");
for(const path of ["/resources/prompts/","/resources/"]){
  assert.ok(!map.includes("https://digital-execution.cc"+path),"Draft resource path must be absent from sitemap: "+path);
  assert.ok(!read("header.js").includes('href="'+path+'"'),"Draft resource path must stay off global navigation");
  assert.ok(!read("footer.js").includes('href="'+path+'"'),"Draft resource path must stay off global footer");
}

// Exercise the existing lightweight browser script without external packages or network calls.
function element(text=""){
  return {
    textContent:text,hidden:false,value:"",dataset:{},attributes:{},handlers:{},
    classList:{toggle(){}},
    setAttribute(name,value){this.attributes[name]=value},
    addEventListener(name,handler){this.handlers[name]=handler},
    focus(){}
  };
}
const byId=new Map(["prompt-search","clear-search","result-count","empty-state","empty-message","reset-filters","copy-status","favorites-count"]
  .map(id=>[id,element()]));
const mockCards=promptCards.map((match,index)=>{
  const title=element("عنوان "+match[2]);
  const favorite=element("☆ احفظ");
  const copy=element("نسخ البرومبت");
  const prompt=element("نص تجربة ["+match[2]+"]");
  const details={open:false};
  return {
    dataset:{category:match[1],promptId:match[2]},
    textContent:index===0?"فكرة لهوية بصرية":"برومبت "+match[2],
    hidden:false,
    querySelector(selector){
      return {h3:title,".favorite-btn":favorite,".copy-btn":copy,".prompt-text":prompt,details}[selector]||null;
    }
  };
});
const filters=["all","design","marketing","customer","work","favorites"].map(id=>{
  const btn=element(id);
  btn.dataset.filter=id;
  return btn;
});
let copied="";
let clipboardBlocked=false;
const storage=new Map();
const mockDocument={
  getElementById:id=>byId.get(id)||null,
  querySelectorAll:selector=>selector===".prompt-card"?mockCards:selector==="[data-filter]"?filters:[],
  activeElement:{focus(){}},
  body:{appendChild(){}},
  execCommand:()=>false,
  createElement:()=>({value:"",style:{},setAttribute(){},select(){},remove(){}})
};
vm.runInNewContext(promptJs,{
  document:mockDocument,
  localStorage:{
    getItem:key=>storage.has(key)?storage.get(key):null,
    setItem:(key,value)=>storage.set(key,value)
  },
  navigator:{clipboard:{writeText:async value=>{
    if(clipboardBlocked)throw new Error("Clipboard denied");
    copied=value;
  }}}
},{timeout:1000});
const click=async el=>{const result=el.handlers.click?.();if(result)await result};
assert.equal(mockCards.filter(card=>!card.hidden).length,12,"All prompts must show initially");
await click(mockCards[0].querySelector(".favorite-btn"));
assert.deepEqual(JSON.parse(storage.get("de:prompt-favorites:v1")),[promptCards[0][2]],"Favorite must persist under isolated key");
assert.equal(mockCards[0].querySelector(".favorite-btn").attributes["aria-pressed"],"true","Favorite pressed state missing");
await click(filters.find(button=>button.dataset.filter==="favorites"));
assert.equal(mockCards.filter(card=>!card.hidden).length,1,"Favorites filter must show saved prompts only");
byId.get("prompt-search").value="بحث لا يطابق";
byId.get("prompt-search").handlers.input();
assert.equal(mockCards.filter(card=>!card.hidden).length,0,"Search must narrow favorites");
assert.equal(byId.get("empty-state").hidden,false,"Empty search state must be visible");
await click(byId.get("clear-search"));
assert.equal(mockCards.filter(card=>!card.hidden).length,1,"Clearing search must restore favorites");
await click(byId.get("reset-filters"));
assert.equal(mockCards.filter(card=>!card.hidden).length,12,"Reset must restore every prompt");
await click(mockCards[0].querySelector(".copy-btn"));
assert.equal(copied,"نص تجربة ["+promptCards[0][2]+"]","Copy must use the actual prompt text");
assert.match(byId.get("copy-status").textContent,/تم نسخ/,"Copy success feedback missing");
clipboardBlocked=true;
await click(mockCards[1].querySelector(".copy-btn"));
assert.match(byId.get("copy-status").textContent,/النسخ مش متاح/,"Blocked clipboard must not report success");
assert.equal(mockCards[1].querySelector("details").open,true,"Show manual-copy fallback when blocked");
await click(mockCards[0].querySelector(".favorite-btn"));
assert.deepEqual(JSON.parse(storage.get("de:prompt-favorites:v1")),[],"Unsaving must remove the prompt from storage");

console.log("PASS: 9 reviewed free routes, isolated guides/tools/prompts, draft indexing and hidden product guards");
