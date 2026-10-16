import fs from "node:fs";
import assert from "node:assert/strict";

const read=path=>fs.readFileSync(path,"utf8");
const page=read("resources/prompts/index.html");
const css=read("resources/prompts/styles.css");
const js=read("resources/prompts/library.js");
const mode=JSON.parse(read("data/storefront-mode.json"));

assert.equal(mode.productsVisible,false,"Hidden product guard must remain active");
assert.match(page,/<meta name="robots" content="noindex,nofollow">/,"Draft page must stay non-indexable");
assert.equal((page.match(/<article class="prompt-card"/g)||[]).length,8,"Expect eight original free prompt cards");
assert.equal((page.match(/class="copy-btn"/g)||[]).length,8,"Each prompt needs a copy action");
for(const tag of ["all","design","marketing","customer","work"]){
  assert.ok(page.includes('data-filter="'+tag+'"'),"Missing filter "+tag);
}
assert.ok(page.includes('id="prompt-search"'),"Search field missing");
assert.ok(page.includes('aria-live="polite"'),"Feedback status missing");
assert.ok(js.includes("card.hidden=")&&js.includes("copyText("),"Local search/copy implementation missing");
assert.ok(css.includes("@media(max-width:700px)"),"Mobile layout missing");
for(const [name,source] of [["HTML",page],["JS",js],["CSS",css]]){
  assert.ok(!/https?:\/\//i.test(source),name+" must not call external servers or load third-party dependencies");
  assert.ok(!/\/products\//i.test(source),name+" may not link hidden products");
}
const map=read("sitemap.xml");
assert.ok(!map.includes("/resources/prompts/"),"Draft resources path must remain off sitemap");
const header=read("header.js");
assert.ok(!header.includes("/resources/prompts/"),"Draft resources path must remain off global navigation");
console.log("PASS: isolated free prompt library integrity; hidden products and draft indexing protected");
