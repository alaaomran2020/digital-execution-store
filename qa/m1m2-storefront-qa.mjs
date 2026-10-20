import assert from "node:assert/strict";
import fs from "node:fs";
const read = path => fs.readFileSync(path,"utf8");
const home=read("index.html");
const tools=read("tools/index.html");
const css=read("site-premium.css");
const header=read("header.css");
const footer=read("footer.css");
const paid=JSON.parse(read("data/storefront-mode.json"));
let checks=0;
function pass(value,reason){assert.ok(value,reason);checks++}
const lightweight=Buffer.byteLength(css)+Buffer.byteLength(header)+Buffer.byteLength(footer)+Buffer.byteLength(read("landing-experience.css"));
const former=fs.statSync("styles.css").size+fs.statSync("brand.css").size+fs.statSync("sections.css").size+Buffer.byteLength(header)+Buffer.byteLength(footer)+Buffer.byteLength(read("landing-experience.css"));
pass(lightweight<=43000,"Home/tools CSS budget exceeded 43KB; currently "+lightweight);
pass(lightweight/former<0.5,"M1 did not reduce CSS by at least 50%");
for (const [name,html] of [["home",home],["tools",tools]]){
  pass(html.includes('href="/site-premium.css?v=20261020-site"'),name+" missing scoped stylesheet");
  pass(!html.includes('href="/styles.css"') && !html.includes('href="/brand.css"') && !html.includes('href="/sections.css"'),name+" loads old CSS bundle");
  pass(html.includes('href="/downloads/Calculator_Suite_Free_v1.2.0.txt"') && html.includes('download="Calculator_Suite_Free_v1.2.0.html"'),name+" free download missing");
  pass(html.includes('class="skip-link"') && html.includes('id="main"'),name+" missing keyboard shortcut");
  pass(html.includes('src="/header.js?') && html.includes('src="/footer.js?'),name+" site navigation/footer missing");
  pass(!html.includes('href="/products/"'),name+" links paused paid store");
  pass(!/stripe|paypal|api\/checkout|\.zip['"]/i.test(html),name+" has unrelated checkout or paid downloads");
  pass(/<meta\s+name="description"/.test(html),name+" missing search description");
  pass(html.includes('dir="rtl"') && html.includes('lang="ar"'),name+" Arabic RTL lost");
}
pass(home.includes("احسبها صح.") && home.includes("وابدأ ببلاش."),"M2 clear Egyptian hero missing");
pass(tools.includes("أبيع المنتج بكام؟") && tools.includes("أبيع كام عشان أغطي مصاريفي؟"),"M2 task-first cards missing");
pass(home.includes("مفيش اشتراك") && tools.includes("من غير تسجيل"),"Free no-subscription assurances missing");
pass(css.includes("@media(max-width:630px)") && css.includes("@media(max-width:920px)"),"Mobile/tablet breakpoints missing");
pass(css.includes("prefers-reduced-motion"),"Reduced-motion support missing");
pass(css.includes(":focus-visible"),"Keyboard focus styles missing");
pass(paid.productsVisible===false,"PAID STORE MUST REMAIN HIDDEN");
pass(read("products/index.html").includes("عرض المنتجات متوقف حاليًا"),"Paid products page must remain paused");
// Premium free-first landing: interactive example is client-only; commercial catalog stays paused.
const landingCss=read("landing-experience.css");
const landingJs=read("landing-experience.js");
pass(home.includes('href="/landing-experience.css?v=20261011-v1"'),"Landing stylesheet missing");
pass(home.includes('src="/landing-experience.js?v=20261011-v1"'),"Landing interactive script missing");
for(const id of ["landing-cost","landing-markup","landing-price","landing-profit","landing-steps-title","landing-faq-title"]){
  pass(home.includes('id="'+id+'"'),"Landing interactive/section identifier missing: "+id);
}
pass(home.includes('href="/services/graphic-design/"') && home.includes('href="/tools/"'),"Independent tools/design routes lost");
pass(!home.includes('href="/products/"') && paid.productsVisible===false,"Paid product links or visibility must remain paused");
pass(landingJs.includes('cost * markup / 100') && landingJs.includes('cost + profit'),"Markup preview calculation changed");
pass(landingJs.includes("costInput.validity.valid") && landingJs.includes("Number.isFinite"),"Input validation removed");
pass(!/fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|\.zip["']/i.test(landingJs),"Landing preview must not transmit/store data or download commercial files");
pass(landingCss.length<9000,"Landing-only CSS exceeded 9KB cap");
pass(landingCss.includes("@media(max-width:480px)") && landingCss.includes("@media(max-width:730px)") && landingCss.includes("prefers-reduced-motion"),"Landing mobile/reduced-motion styles missing");
console.log("PASS "+checks+" M1/M2 fast, Egyptian, accessible Free-first UI checks; CSS="+lightweight+" bytes vs prior "+former+" ("+Math.round((1-lightweight/former)*100)+"% reduction)");
