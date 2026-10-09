import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export const attributes=p=>({'data-product-slug':p.slug,'data-product-version':p.version,'data-product-price':p.price,'data-product-currency':p.currency,'data-product-status':p.status,'data-published-version':p.lifecycle.published_version,'data-last-updated':p.last_updated});
const attrs=p=>Object.entries(attributes(p)).map(([k,v])=>`${k}="${esc(v)}"`).join(' ');
function setAttrs(tag,p){for(const [k,v] of Object.entries(attributes(p))){const re=new RegExp(` ${k}="[^"]*"`);tag=re.test(tag)?tag.replace(re,` ${k}="${esc(v)}"`):tag.replace(/>$/,` ${k}="${esc(v)}">`);}return tag;}
const months=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const dateText=d=>{const [y,m,day]=d.split('-');return `${Number(day)} ${months[Number(m)-1]} ${y}`;};
const price=p=>`${p.price} جنيه`;
const dates=p=>`<span data-registry-release>الإصدار ${p.version} · آخر تحديث <time datetime="${p.last_updated}">${dateText(p.last_updated)}</time></span>`;
function visible(s,p,version=true){return s.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<[^>]*>)/gi).map(t=>t.startsWith('<')?t:t.replace(/\b[\d,]+(?:\.\d+)?\s+جنيه/g,match=>/^(1,?000|301)\s/.test(match)?match:price(p)).replace(version?/\b\d+\.\d+\.\d+\b/g:/(?!)/,p.version).replace(/\d{1,2} (?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر) 20\d{2}/g,dateText(p.last_updated))).join('');}
function catalogCard(p){let card=`<article class="catalog-card featured-card" data-product-card ${attrs(p)}><div>
<span class="product-type">${esc(p.category)} · منتج رقمي</span>
<h2>${esc(p.name)}</h2><p>${esc(p.offer.outcome)}</p>
<div class="badges"><span class="price-list"><s>${p.commerce.list_price.toLocaleString('en-US')} جنيه</s></span><span class="price-sale">${price(p)}</span><span class="price-save">وفّر ${p.commerce.savings} جنيه</span><span>دفعة واحدة</span>${dates(p)}</div>
<a class="btn primary" href="../${esc(p.product_url)}" data-track="product_click" data-product-slug="${esc(p.slug)}" data-source="products" data-cta-location="catalog_card">عرض التفاصيل</a>
</div><picture><img src="../${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async"></picture></article>`;return p.commerce.savings>0?card:card.replace(/<span class="price-list">.*?<\/span>/,'').replace(/<span class="price-save">.*?<\/span>/,'').replace('<span>دفعة واحدة</span>',p.price===0?'<span>مجاني</span>':'<span>دفعة واحدة</span>');}
export function syncStorefront(root,write=false){
 const products=JSON.parse(fs.readFileSync(path.join(root,'data/products.json'),'utf8')).filter(p=>p.status==='published');
 const changes=[];
 function update(file,fn){const target=path.join(root,file),old=fs.readFileSync(target,'utf8'),next=fn(old);if(old!==next){changes.push(file);if(write)fs.writeFileSync(target,next);}}
 for(const p of products)update(p.product_url+'index.html',html=>{
  html=html.replace(/<body\b[^>]*>/,tag=>setAttrs(tag,p));
  if(!p.slug.startsWith('calculator-suite-'))html=visible(html,p,p.slug!=='business-bundle');
  html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,json)=>{const d=JSON.parse(json);if(!['Product','SoftwareApplication'].includes(d['@type']))return tag;d.url='https://digital-execution.cc/'+p.product_url;d.sku=p.slug;d.dateModified=p.last_updated;if(d['@type']==='SoftwareApplication')d.softwareVersion=p.version;else d.additionalProperty=[...(d.additionalProperty||[]).filter(x=>x.name!=='version'),{'@type':'PropertyValue',name:'version',value:p.version}];Object.assign(d.offers,{price:String(p.price),priceCurrency:p.currency,url:d.url});return `<script type="application/ld+json">${JSON.stringify(d)}</script>`;});
  const release=dates(p);
  if(/<span data-registry-release>[\s\S]*?<\/time><\/span>/.test(html))html=html.replace(/<span data-registry-release>[\s\S]*?<\/time><\/span>/,release);
  else html=html.replace(/(<div class="badges">)/,`$1${release}`);
  return html;
 });
 update('products/index.html',html=>{
  const cards=/(?:<article\b[^>]*\bdata-product-card\b[^>]*>[\s\S]*?<\/article>\s*)+/;
  html=html.replace(cards,products.map(catalogCard).join('\n')+'\n');
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,json)=>{const d=JSON.parse(json);if(d['@type']!=='ItemList')return tag;d.numberOfItems=products.length;d.itemListElement=products.map((p,i)=>({'@type':'ListItem',position:i+1,url:'https://digital-execution.cc/'+p.product_url,name:p.name}));return `<script type="application/ld+json">${JSON.stringify(d)}</script>`;});
 });
 update('index.html',html=>html.replace(/<article\b[^>]*\bdata-product-card\b[^>]*>[\s\S]*?<\/article>/g,card=>{
  const slug=card.match(/data-product-slug="([^"]+)"/)?.[1],p=products.find(p=>p.slug===slug);if(!p)return card;
  card=card.replace(/^<article[^>]*>/,tag=>setAttrs(tag,p));return visible(card,p,false);
 }));
 return changes;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const write=process.argv.includes('--write'),changes=syncStorefront(process.cwd(),write);
 console.log(`${write?'Synchronized':'Registry drift'}: ${changes.length} files${changes.length?'\n'+changes.join('\n'):''}`);
 if(!write&&changes.length)process.exitCode=1;
}
