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
  const expectedStyle=route==="services/graphic-design/"?'/sections.css':'/site-premium.css?v=20261020-site';
  assert.ok(html.includes('href="'+expectedStyle+'"'),"shared section styling missing: "+route); checks++;
  if(route==="services/graphic-design/") {
    assert.ok(html.includes('class="ds-local-header"'),"studio-local header missing"); checks++;
    assert.ok(!html.includes('src="/header.js?')&&!html.includes('src="/footer.js?'),"studio must not load cross-department navigation"); checks++;
    assert.ok(!/<a\b[^>]*href="\/(?:tools|services\/|products\/|updates\/)/.test(html),"studio must not link to other departments"); checks++;
  } else {
    assert.ok(html.includes('src="/header.js?'),"global navigation missing: "+route); checks++;
    assert.ok(html.includes('src="/footer.js?'),"global footer missing: "+route); checks++;
  }
  assert.ok(read("sitemap.xml").includes("<loc>https://digital-execution.cc/"+route+"</loc>"),"sitemap entry missing: "+route); checks++;
}
const productsVisible=JSON.parse(read("data/storefront-mode.json")).productsVisible!==false;
for(const route of productsVisible?["/products/","/tools/","/services/"]:["/tools/","/services/"]){
  assert.ok(read("header.js").includes('"'+route+'"'),"shared nav route missing: "+route);checks++;
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
assert.ok(!design.includes('href="/products/'),"Paused product link visible in design service");checks++;
assert.ok(!studioCss.includes(".department-page .dept-card"),"Design studio must not override shared tool/service cards");checks++;
assert.ok(studioCss.includes("body.design-studio")&&studioCss.includes("@media(max-width:560px)")&&studioCss.includes("prefers-reduced-motion"),"Scoped theme or mobile accessibility styles missing");checks++;
// Homepage and section hubs start with an empty header that deferred JS replaces.
// Reserving its eventual height avoids moving the first viewport after paint.
const headerCss=read("header.css");
for(const file of ["index.html","tools/index.html","services/index.html"]){
  assert.match(read(file),/<header><\/header>/,"Missing expected deferred-header placeholder in "+file);checks++;
}
assert.ok(headerCss.includes("body > header:empty{min-height:105px"),"Desktop header space must be reserved before deferred JS");checks++;
assert.ok(headerCss.includes("@media(max-width:900px){body > header:empty{min-height:97px}"),"Mobile header height must be reserved before deferred JS");checks++;
console.log("PASS creative studio cards, navigation, styling, and temporary product-hide assertions");

// SEO/AEO/GEO: static answers are crawlable without JS; calculators and studio stay functional.
const publicContent = [
  {file:"tools/pricing-calculator/index.html",sections:["pricing-example","pricing-answers"],form:"pricingForm",script:'src="pricing.js"'},
  {file:"tools/break-even-calculator/index.html",sections:["break-even-example","break-even-answers"],form:"breakEvenForm",script:'src="break-even.js"'},
  {file:"services/graphic-design/index.html",sections:["faq"],form:"ds-brief-form",script:'src="/services/graphic-design/studio.js'}
];
for(const spec of publicContent){
  const html=read(spec.file);
  assert.equal((html.match(/<h1\\b/g)||[]).length,1,"One H1 required on "+spec.file);checks++;
  assert.ok(html.includes('id="'+spec.form+'"'),"Existing form lost on "+spec.file);checks++;
  assert.ok(html.includes(spec.script),"Existing script lost on "+spec.file);checks++;
  assert.ok(html.includes('<meta name="description"'),"Meta description missing on "+spec.file);checks++;
  assert.ok(html.includes('rel="canonical"'),"Canonical missing on "+spec.file);checks++;
  assert.ok(!html.includes('href="/products/')&&!html.includes('application/ld+json'),"Paused paid items or fabricated rich snippets on "+spec.file);checks++;
  for(const section of spec.sections){assert.ok(html.includes('id="'+section+'"'),"Static answer section missing: "+section);checks++;}
}
const pricing=read("tools/pricing-calculator/index.html");
assert.ok(pricing.includes("100 شراء + 15 شحن")&&pricing.includes("سعر البيع: 150 جنيه")&&pricing.includes("هامش الربح: 20٪"),"Pricing worked example absent/mismatched");checks++;
assert.equal((100+15+5)*(1+25/100),150,"Pricing example must follow existing JS formula");checks++;
assert.equal((150-120)/150*100,20,"Markup is not margin");checks++;
assert.ok(pricing.includes('href="/tools/break-even-calculator/"'),"Missing related free break-even calculator link");checks++;
const breaking=read("tools/break-even-calculator/index.html");
assert.ok(breaking.includes("هامش المساهمة: 80 جنيه")&&breaking.includes("التعادل: 125 قطعة")&&breaking.includes("مبيعات التعادل: 25,000 جنيه"),"Break-even example absent/mismatched");checks++;
assert.equal(Math.ceil(10000/(200-120)),125,"Break-even quantity example must follow JS formula");checks++;
assert.equal(10000/((200-120)/200),25000,"Break-even revenue example must follow JS formula");checks++;
assert.ok(breaking.includes('href="/tools/pricing-calculator/"'),"Missing related free pricing tool link");checks++;
assert.ok(design.includes("مثال توضيحي مش لعميل حقيقي")&&design.includes("مش دراسات حالة موثّقة"),"Studio brief must not invent customer projects");checks++;
assert.ok(design.includes("الشعار علامة مميزة")&&design.includes("هوامش القص"),"Studio useful questions missing");checks++;
console.log("PASS answer-ready pricing, break-even and studio content with original app contracts");

console.log("PASS "+checks+" independent department checks; product visibility: "+(productsVisible?"on":"temporarily paused"));
