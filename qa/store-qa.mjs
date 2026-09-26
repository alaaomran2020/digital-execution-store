import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const errors=[];
const fail=(m)=>errors.push(m);
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const exists=(p)=>fs.existsSync(path.join(root,p));

let products;
try{products=JSON.parse(read("data/products.json"));}catch(e){fail("products.json is invalid JSON: "+e.message);products=[]}

const slugs=new Set();
for(const p of products){
  if(!p.slug||slugs.has(p.slug)) fail("duplicate/missing product slug: "+p.slug);
  slugs.add(p.slug);
  if(p.price!==p.commerce?.price) fail(p.slug+": top-level price differs from commerce.price");
  if(p.status==="published"){
    if(p.price!==699) fail(p.slug+": published package sale price must be 699 EGP");
    if(p.commerce?.list_price!==1000) fail(p.slug+": published package list price must be 1000 EGP");
    if(p.commerce?.savings!==301) fail(p.slug+": published package savings must be 301 EGP");
  }
  if(p.currency!==p.commerce?.currency) fail(p.slug+": currency mismatch");
  if(p.analytics?.product_slug!==p.slug) fail(p.slug+": analytics product_slug mismatch");
  if(!p.segment) fail(p.slug+": segment is required");
  if(!p.trust?.support_policy) fail(p.slug+": support policy must be explicit");
  if(p.delivery?.update_policy==null) fail(p.slug+": update policy must be explicit");

  const isPublished=p.status==="published";
  if(isPublished){
    if(p.lifecycle?.stage!=="PUBLISHED") fail(p.slug+": published status without PUBLISHED lifecycle");
    if(p.version!==p.lifecycle?.published_version) fail(p.slug+": version differs from lifecycle.published_version");
    if(!exists(p.product_url+"index.html")) fail(p.slug+": product page missing at "+p.product_url);
    const html=exists(p.product_url+"index.html")?read(p.product_url+"index.html"):"";
    const body=html.match(/<body[^>]*>/i)?.[0]||"";
    const expected={
      "data-product-slug":p.slug,
      "data-product-name":p.name,
      "data-product-version":p.version,
      "data-product-price":String(p.price),
      "data-product-currency":p.currency
    };
    for(const [attr,value] of Object.entries(expected)){
      if(!body.includes(`${attr}="${value}"`)) fail(p.slug+": product body missing "+attr+"="+value);
    }
    if(!html.includes('data-track="product_whatsapp_click"')) fail(p.slug+": checkout WhatsApp tracking missing");
    if(!html.includes('data-list-price="1000"')) fail(p.slug+": product page missing unified list price 1000");
    if(!html.includes('data-savings="301"')) fail(p.slug+": product page missing unified savings 301");
    if(!html.includes('وفّر 301 جنيه')) fail(p.slug+": product page missing unified savings copy");
    if(!/src="\.\.\/\.\.\/script\.js(?:\?[^"]*)?"/.test(html)) fail(p.slug+": unified script.js missing");
    const hasLegacyMobileNav=html.includes('id="menuToggle"')&&html.includes('id="mobileNav"');
    const hasDetailsMobileNav=html.includes('class="mobile-menu"')&&html.includes('class="menu-toggle"')&&html.includes('class="mobile-nav"');
    if(!hasLegacyMobileNav&&!hasDetailsMobileNav) fail(p.slug+": mobile navigation controls missing");
    if(!html.includes('data-cta-location="header"')) fail(p.slug+": tracked header buy CTA missing");
    if(p.slug==="career-kit"){
      if(!html.includes('career-kit-og.png')) fail("career-kit: PNG social preview missing from metadata");
      if(!html.includes('og:image:width" content="1200"')||!html.includes('og:image:height" content="630"')) fail("career-kit: social preview dimensions missing");
      if(!exists("assets/career-kit/career-kit-og.png")) fail("career-kit: PNG social preview file missing");
      if(!exists("assets/career-kit/career-kit-og.webp")) fail("career-kit: WebP social preview file missing");
      if(!html.includes("../../tools/career-cv-studio/")) fail("career-kit: Career CV Studio CTA missing");
      if(!html.includes("career_kit_cta_click")) fail("career-kit: Career CV Studio analytics CTA missing");
    }
  }else if(p.lifecycle?.published_version!==null){
    fail(p.slug+": unpublished product must have published_version=null");
  }
}

const homepage=read("index.html");
for(const p of products.filter(x=>x.status==="published"&&x.segment==="professional")){
  if(!homepage.includes(`data-product-slug="${p.slug}"`)) fail(p.slug+": published professional package missing from homepage storefront");
  if(!homepage.includes(`href="${p.product_url}`)) fail(p.slug+": homepage storefront link missing");
}
const catalog=read("products/index.html");
for(const p of products.filter(x=>x.status==="published")){
  if(!catalog.includes(`data-product-slug="${p.slug}"`)) fail(p.slug+": published product missing from products catalog");
  if(!catalog.includes(`data-product-version="${p.version}"`)) fail(p.slug+": catalog version differs from registry");
  if(!catalog.includes(`data-product-price="${p.price}"`)) fail(p.slug+": catalog price differs from registry");
  if(!catalog.includes(`data-product-currency="${p.currency}"`)) fail(p.slug+": catalog currency differs from registry");
  if(!catalog.includes(`href="../${p.product_url}"`)) fail(p.slug+": catalog product link missing");
  if(!catalog.includes(`src="../${p.image}"`)) fail(p.slug+": catalog image differs from registry");
  if(!catalog.includes(`"url":"https://digital-execution.cc/${p.product_url}"`)) fail(p.slug+": catalog ItemList JSON-LD missing product URL");
}
const catalogCardCount=(catalog.match(/data-product-card/g)||[]).length;
const publishedCount=products.filter(x=>x.status==="published").length;
if(catalogCardCount!==publishedCount) fail(`products catalog card count ${catalogCardCount} differs from published registry count ${publishedCount}`);
if(!catalog.includes(`"numberOfItems":${publishedCount}`)) fail("products catalog ItemList numberOfItems differs from registry");

const publicProductDirs=fs.readdirSync(path.join(root,"products"),{withFileTypes:true})
  .filter(ent=>ent.isDirectory()&&exists(`products/${ent.name}/index.html`))
  .map(ent=>ent.name);
const registrySlugs=new Set(products.map(p=>p.slug));
const allowedBundleComponents=new Set([
  "civil-quantity-takeoff","boq-manager","payment-certificates",
  "site-daily-report","material-procurement-tracker","technical-office-toolkit"
]);
for(const slug of publicProductDirs){
  if(!registrySlugs.has(slug)&&!allowedBundleComponents.has(slug)) fail(slug+": public product page is neither registered nor an approved bundle component");
}

const sitemap=read("sitemap.xml");
for(const p of products.filter(x=>x.status==="published")){
  const url="https://digital-execution.cc/"+p.product_url;
  if(!sitemap.includes("<loc>"+url+"</loc>")) fail(p.slug+": missing from sitemap");
}

const files=[];
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if([".git","node_modules",".chrome-final-qa",".playwright-cli"].includes(ent.name)) continue;
    const rel=path.relative(root,path.join(dir,ent.name)).replaceAll("\\","/");
    if(ent.isDirectory()) walk(path.join(dir,ent.name));
    else files.push(rel);
  }
}
walk(root);

for(const file of files.filter(f=>f.endsWith(".html")&&!f.startsWith("google"))){
  const html=read(file);
  if(!/<html[^>]*lang="ar"[^>]*dir="rtl"|<html[^>]*dir="rtl"[^>]*lang="ar"/i.test(html)) fail(file+": html must declare ar + rtl");
  const refs=[...html.matchAll(/(?:href|src)="([^"#?]+)"/g)].map(m=>m[1]);
  for(const ref of refs){
    if(/^(https?:|mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    if(ref.startsWith("/")) continue;
    const resolved=path.normalize(path.join(path.dirname(file),ref));
    let target=resolved;
    if(ref.endsWith("/")) target=path.join(resolved,"index.html");
    if(!exists(target)) fail(file+": broken local reference "+ref+" -> "+target);
  }
}

if(!exists("products/business-control-pack/index.html")) fail("business-control-pack: product page missing");
if(!exists("products/business-bundle/index.html")) fail("business-bundle: product page missing");
if(!exists("after-purchase/business/index.html")) fail("repeat purchase entry page missing");
const passiveRevenueManifestPath="data/passive-revenue-restock.json";
if(!exists(passiveRevenueManifestPath)) fail("ReStock passive revenue manifest is missing");
else{
  try{
    const passive=JSON.parse(read(passiveRevenueManifestPath));
    if(passive.system_version!=="1.0") fail("ReStock passive revenue manifest must use system_version 1.0");
    if(passive.product_slug!=="restock-desk") fail("ReStock passive revenue manifest product_slug mismatch");
    if(passive.overall?.architecture_readiness!==100) fail("ReStock passive revenue architecture must be 100%");
    if(passive.release_gate?.release_status!=="PASS") fail("ReStock passive revenue release gate must PASS");
    if(passive.payment_verification?.status!=="UNDER_REVIEW") fail("ReStock payment verification must remain explicitly UNDER_REVIEW until automation is approved");
    if(passive.payment_verification?.release_blocker!==false) fail("ReStock payment verification must not block v1 release");
    for(const stage of ["traffic","lead_magnet","core_product","delivery","faq","upsell","bundle","repeat_purchase"]){
      if(!passive.stages?.[stage]) fail("ReStock passive revenue stage missing: "+stage);
      if(passive.stages?.[stage]?.implementation_readiness!==100) fail("ReStock passive revenue implementation must be 100%: "+stage);
    }
  }catch(e){fail("ReStock passive revenue manifest is invalid JSON: "+e.message)}
}

const healthCheckJs=read("tools/inventory-health-check/inventory-health-check.js");
for(const eventName of ["lead_magnet_start","lead_magnet_complete"]){
  if(!healthCheckJs.includes(eventName)) fail("inventory-health-check: missing canonical event "+eventName);
}

const script=read("script.js");
if(script.includes('product_slug:"restock-desk"')) fail("script.js contains legacy hardcoded ReStock product context");
if(!script.includes("body.dataset.productSlug")) fail("script.js must derive product context from page data attributes");

if(!script.includes('trackEvent("category_view"')) fail("script.js must emit category_view for the product catalog");
if(!script.includes('trackEvent("buy_cta_click"')) fail("script.js must emit canonical buy_cta_click alias");
if(!script.includes("order stays a verified business event")) fail("script.js must keep order as a verified business event");

const studioHtml=read("tools/career-cv-studio/index.html");
const studioJs=read("tools/career-cv-studio/app.js");
if(!studioHtml.includes('name="robots" content="noindex, follow"')) fail("career-cv-studio: indexing policy must be noindex, follow");
if(sitemap.includes("/tools/career-cv-studio/")) fail("career-cv-studio: noindex utility must not be in sitemap");
if(!studioHtml.includes("../../products/career-kit/")) fail("career-cv-studio: return path to Career Kit missing");
for(const eventName of ["cv_studio_open","cv_export"]){
  if(!studioJs.includes(eventName)) fail("career-cv-studio: missing analytics event "+eventName);
}

if(errors.length){
  console.error("\nStore QA failed:");
  for(const e of errors) console.error(" - "+e);
  process.exit(1);
}
console.log(`Store QA passed: ${products.length} registry entries, ${files.filter(f=>f.endsWith(".html")).length} HTML files checked.`);
