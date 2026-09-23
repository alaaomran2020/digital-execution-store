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
    if(!html.includes('data-track="whatsapp_payment_click"')) fail(p.slug+": checkout WhatsApp tracking missing");
    if(!html.includes('src="../../script.js"')) fail(p.slug+": unified script.js missing");
    if(!html.includes('id="menuToggle"')||!html.includes('id="mobileNav"')) fail(p.slug+": mobile navigation controls missing");
    if(!html.includes('data-cta-location="header"')) fail(p.slug+": tracked header buy CTA missing");
  }else if(p.lifecycle?.published_version!==null){
    fail(p.slug+": unpublished product must have published_version=null");
  }
}

const sitemap=read("sitemap.xml");
for(const p of products.filter(x=>x.status==="published")){
  const url="https://digital-execution.cc/"+p.product_url;
  if(!sitemap.includes("<loc>"+url+"</loc>")) fail(p.slug+": missing from sitemap");
}

const files=[];
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if([".git","node_modules"].includes(ent.name)) continue;
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

const script=read("script.js");
if(script.includes('product_slug:"restock-desk"')) fail("script.js contains legacy hardcoded ReStock product context");
if(!script.includes("body.dataset.productSlug")) fail("script.js must derive product context from page data attributes");

if(errors.length){
  console.error("\nStore QA failed:");
  for(const e of errors) console.error(" - "+e);
  process.exit(1);
}
console.log(`Store QA passed: ${products.length} registry entries, ${files.filter(f=>f.endsWith(".html")).length} HTML files checked.`);
