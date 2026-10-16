import fs from "node:fs";
import assert from "node:assert/strict";

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
assert.equal((promptPage.match(/<article class="prompt-card"/g)||[]).length,8,"Expect eight original free prompt cards");
assert.equal((promptPage.match(/class="copy-btn"/g)||[]).length,8,"Each prompt needs a copy action");
for(const tag of ["all","design","marketing","customer","work"]){
  assert.ok(promptPage.includes('data-filter="'+tag+'"'),"Missing prompt filter "+tag);
}
assert.ok(promptPage.includes('id="prompt-search"'),"Prompt search field missing");
assert.ok(promptPage.includes('aria-live="polite"'),"Prompt feedback status missing");
assert.ok(promptJs.includes("card.hidden=")&&promptJs.includes("copyText("),"Local search/copy implementation missing");
assert.ok(promptCss.includes("@media(max-width:700px)"),"Prompt mobile layout missing");
assert.ok(directoryCss.includes("@media(max-width:700px)"),"Resource directory mobile layout missing");

const matches=[...directory.matchAll(/class="resource-card" href="(\/[^"]+)"/g)];
const targets=matches.map(item=>item[1]);
const expected=[
  "/resources/prompts/",
  "/tools/pricing-calculator/",
  "/tools/break-even-calculator/",
  "/tools/inventory-health-check/",
  "/tools/career-cv-studio/"
];
assert.deepEqual([...targets].sort(),[...expected].sort(),"Only reviewed standalone free resources should be linked");
for(const target of [...expected,"/tools/"]){
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
assert.ok(!/\/guides\//i.test(directory),"Do not link guides pending commercial-link cleanup");
assert.ok(!/<script\b/i.test(directory),"Free directory must render without JavaScript");
assert.ok(!directory.includes("data-product-card"),"Paid catalogue card may not appear in free resources");
const map=read("sitemap.xml");
for(const path of ["/resources/prompts/","/resources/"]){
  assert.ok(!map.includes("https://digital-execution.cc"+path),"Draft resource path must be absent from sitemap: "+path);
  assert.ok(!read("header.js").includes('href="'+path+'"'),"Draft resource path must stay off global navigation");
  assert.ok(!read("footer.js").includes('href="'+path+'"'),"Draft resource path must stay off global footer");
}
console.log("PASS: 5 reviewed free routes, isolated directory, prompts, draft indexing and hidden product guards");
