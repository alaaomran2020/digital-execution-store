// Regression checks for independent public sections. Runs offline; no production access.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const exists=file=>fs.existsSync(path.join(root,file));
const routes=["tools/","services/","services/graphic-design/"];
let checks=0;
for(const route of routes){
  const file=route+"index.html";
  assert.ok(exists(file),"missing standalone route "+file); checks++;
  const html=read(file);
  assert.match(html,/<html[^>]+lang="ar"[^>]+dir="rtl"/);
  assert.ok(html.includes('href="https://digital-execution.cc/'+route+'"'),"canonical missing for "+route); checks++;
  assert.ok(html.includes('href="/sections.css"'),"shared section styling missing: "+route); checks++;
  assert.ok(html.includes('src="/header.js?'),"global navigation missing: "+route); checks++;
  assert.ok(html.includes('src="/footer.js?'),"global footer missing: "+route); checks++;
  assert.ok(read("sitemap.xml").includes("<loc>https://digital-execution.cc/"+route+"</loc>"),"sitemap entry missing: "+route); checks++;
}
const productsVisible=JSON.parse(read("data/storefront-mode.json")).productsVisible!==false;
for(const route of productsVisible?["/products/","/tools/","/services/"]:["/tools/","/services/"]){
  assert.ok(read("header.js").includes('href="'+route+'"'),"shared nav route missing: "+route);checks++;
  assert.ok(read("index.html").includes('href="'+route+'"'),"homepage department route missing: "+route);checks++;
}
for(const file of ["tools/pricing-calculator/index.html","products/pricing-calculator/index.html","products/graphic-designer-business-os/index.html"]){
  assert.ok(exists(file),"existing free/commercial page must remain separate: "+file);checks++;
}
const toolHub=read("tools/index.html");
for(const tool of ["pricing-calculator","break-even-calculator","inventory-health-check"]){
  const route="tools/"+tool+"/index.html";
  assert.ok(exists(route),"linked tool does not exist: "+route);checks++;
  assert.ok(toolHub.includes('href="/tools/'+tool+'/">'),"hub missing tool "+tool);checks++;
}
assert.ok(read("services/index.html").includes('href="/services/graphic-design/"'));checks++;
assert.ok(read("services/graphic-design/index.html").includes('mailto:contact@digital-execution.cc'));checks++;

// Creative Studio checks: presentation refresh must not expose paused products.
const design=read("services/graphic-design/index.html");
const studioCss=read("services/graphic-design/studio.css");
assert.ok(design.includes('href="/services/graphic-design/studio.css?'),"Design studio scoped CSS missing");checks++;
for(const id of ["ds-brand","ds-social","ds-ads","ds-packaging","ds-print","ds-presentations","ds-commerce","ds-special"]){
  assert.ok(design.includes('id="'+id+'"'),"Design category missing: "+id);checks++;
  assert.ok(design.includes('href="#'+id+'"'),"Design category navigation missing: "+id);checks++;
}
assert.equal((design.match(/class="ds-service-card /g)||[]).length,8,"Expected 8 independent design service cards");checks++;
assert.ok(design.includes('id="design-contact"')&&design.includes('id="design-services"'),"Contact or services anchor missing");checks++;
assert.ok(design.includes("المشاهد البصرية أعلاه عناصر توضيحية"),"Illustrations must not be portrayed as customer portfolio");checks++;
assert.ok(design.includes('id="ds-brief-form"')&&design.includes('id="ds-brief-result"'),"Design project intake missing");checks++;
assert.ok(design.includes('src="/services/graphic-design/brief.js?'),"Client-side brief helper not linked");checks++;
assert.equal((design.match(/<a\s[^>]+data-design-type="ds-/g)||[]).length,8,"All cards must preselect the brief type");checks++;
assert.ok(!/<form[^>]+action=/.test(design),"Client-only brief must not submit to a server");checks++;
assert.ok(design.includes('id="design-gallery"')&&design.includes('id="ds-gallery-dialog"'),"Standalone design concept gallery missing");checks++;
assert.ok(design.includes('src="/services/graphic-design/gallery.js?'),"Interactive design gallery script not linked");checks++;
assert.equal((design.match(/class="ds-gallery-card"/g)||[]).length,6,"Expected six explicitly illustrative gallery previews");checks++;
assert.ok(design.includes("وليست أعمالًا منفذة لعملاء"),"Concept disclaimer required");checks++;
assert.ok(!design.includes('href="/products/'),"Paused product link visible in design service");checks++;
assert.ok(!studioCss.includes(".department-page .dept-card"),"Design studio must not override shared tool/service cards");checks++;
assert.ok(studioCss.includes("body.design-studio")&&studioCss.includes("@media(max-width:560px)")&&studioCss.includes("prefers-reduced-motion"),"Scoped theme or mobile accessibility styles missing");checks++;
console.log("PASS creative studio cards, navigation, styling, and temporary product-hide assertions");

console.log("PASS "+checks+" independent department checks; product visibility: "+(productsVisible?"on":"temporarily paused"));
