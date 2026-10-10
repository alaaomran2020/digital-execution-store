import assert from "node:assert/strict";
import fs from "node:fs";
const read = path => fs.readFileSync(path,"utf8");
const home=read("index.html");
const tools=read("tools/index.html");
const css=read("storefront-light.css");
const header=read("header.css");
const footer=read("footer.css");
const paid=JSON.parse(read("data/storefront-mode.json"));
let checks=0;
function pass(value,reason){assert.ok(value,reason);checks++}
const lightweight=Buffer.byteLength(css)+Buffer.byteLength(header)+Buffer.byteLength(footer);
const former=fs.statSync("styles.css").size+fs.statSync("brand.css").size+fs.statSync("sections.css").size+Buffer.byteLength(header)+Buffer.byteLength(footer);
pass(lightweight<=21000,"Home/tools CSS budget exceeded 21KB; currently "+lightweight);
pass(lightweight/former<0.4,"M1 did not reduce CSS by at least 60%");
for (const [name,html] of [["home",home],["tools",tools]]){
  pass(html.includes('href="/storefront-light.css?v=20261011-m1m2"'),name+" missing scoped stylesheet");
  pass(!html.includes('href="/styles.css"') && !html.includes('href="/brand.css"') && !html.includes('href="/sections.css"'),name+" loads old CSS bundle");
  pass(html.includes('href="/downloads/Calculator_Suite_Free_v1.1.0.txt"') && html.includes('download="Calculator_Suite_Free_v1.1.0.html"'),name+" free download missing");
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
console.log("PASS "+checks+" M1/M2 fast, Egyptian, accessible Free-first UI checks; CSS="+lightweight+" bytes vs prior "+former+" ("+Math.round((1-lightweight/former)*100)+"% reduction)");
