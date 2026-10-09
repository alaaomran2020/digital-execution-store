import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const read=path=>fs.readFileSync(path,"utf8");
const htmlFiles=[];
let checks=0;
const checked=(truth,message)=>{assert.ok(truth,message);checks++};
const mode=JSON.parse(read("data/storefront-mode.json"));
checked(mode.productsVisible===false,"Paused-mode feature flag must be explicitly false");
const source=JSON.parse(read("data/products.json"));
checked(source.some(p=>p.status==="published"),"Historical registry must be retained without unpublishing original records");
const directories=fs.readdirSync("products",{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name);
checked(directories.length>=20,"Expected existing product URLs to be retained as placeholders");
for(const p of ["index",...directories]){
 const file=p==="index"?"products/index.html":"products/"+p+"/index.html";
 checked(fs.existsSync(file),"Missing paused product route: "+file);
 const html=read(file);
 checked(html.includes('content="noindex,nofollow"'),"Noindex missing: "+file);
 checked(html.includes("عرض المنتجات متوقف حاليًا"),"Pause notice missing: "+file);
 checked(!html.includes("data-product-card")&&!html.includes('data-track="buy_')&&!html.includes('data-page="product"'),"Product sale content remains: "+file);
 checked(!html.includes("application/ld+json")&&!html.includes("script.js"),"Hidden product metadata or purchase runtime remains: "+file);
 checked(!/(\b(?:399|699|999)\b)\s*جنيه/.test(html),"Visible product prices remain: "+file);
}
const home=read("index.html");
checked(home.includes('href="/tools/"')&&home.includes('href="/services/graphic-design/"'),"Homepage must preserve tools and design");
checked(!home.includes('data-product-card')&&!home.includes('data-intent-product'),"Homepage product cards remain");
for(const file of ["index.html","header.js","footer.js","tools/index.html","services/index.html","services/graphic-design/index.html","updates/index.html"]){
 const s=read(file);
 checked(!/href=["'][^"']*\/products\//.test(s),"Product link still visible in "+file);
}
for(const file of ["header.js","footer.js"]){checked(!read(file).includes('href="/products/"'),"Global product link "+file);}
const map=read("sitemap.xml");
checked(!/<loc>https:\/\/digital-execution\.cc\/products(?:\/|<)/.test(map),"Product URLs remain indexed in sitemap");
checked(map.includes("https://digital-execution.cc/tools/"),"Free tools sitemap entry missing");
checked(map.includes("https://digital-execution.cc/services/"),"Services sitemap entry missing");
checked(!read("robots.txt").includes("Disallow: /products/"),"Noindex pages must remain crawlable so engines can read noindex");
checked(read("robots.txt").includes("Allow: /products/"),"Explicit crawl allowance required for noindex processing");
for(const file of ["tools/pricing-calculator/index.html","tools/break-even-calculator/index.html","tools/inventory-health-check/index.html","tools/career-cv-studio/index.html"]){
 checked(fs.existsSync(file),"Working free tool removed: "+file);
 checked(!/href=["'][^"']*\/products\//.test(read(file)),"Free tool retains product promo link: "+file);
}
checked(read(".github/workflows/store-qa.yml").includes("qa/store-qa.mjs"),"Original published-store QA must remain available for restoration");
checked(read(".github/workflows/store-qa.yml").includes("qa/storefront-paused-qa.mjs"),"Paused QA must be run by CI");
console.log("PASS "+checks+" temporary storefront-hide regression checks; "+directories.length+" product routes replaced by reversible notices");
