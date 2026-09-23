const STORAGE_KEY="de:seo-dashboard:v1";
const state={pages:[],queries:[],events:[],orders:[]};
const $=s=>document.querySelector(s);
const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat("ar-EG",{maximumFractionDigits:2}).format(n):"—";
const pct=n=>Number.isFinite(n)?(n*100).toFixed(1)+"%":"—";
function parseCSV(text){
  const rows=[];let row=[],cell="",q=false;
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];
    if(c==='"'&&q&&n==='"'){cell+='"';i++;continue}
    if(c==='"'){q=!q;continue}
    if(c===','&&!q){row.push(cell);cell="";continue}
    if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);cell="";if(row.some(x=>x.trim()!==""))rows.push(row);row=[];continue}
    cell+=c;
  }
  if(cell||row.length){row.push(cell);rows.push(row)}
  if(!rows.length)return[];
  const headers=rows[0].map(h=>h.trim().replace(/^\uFEFF/,""));
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??"").trim()])));
}
function keyOf(obj,names){const keys=Object.keys(obj);for(const name of names){const k=keys.find(x=>x.toLowerCase()===name.toLowerCase());if(k)return k}return null}
function num(v){if(v==null)return 0;const s=String(v).replace(/%/g,"").replace(/,/g,"").trim();const n=Number(s);return Number.isFinite(n)?n:0}
function normalizePath(v){try{const u=new URL(v,location.origin);return u.pathname.endsWith("/")?u.pathname:u.pathname+"/"}catch{return String(v||"").split("?")[0]}}
function normalizeSearchRows(rows,type){
 return rows.map(r=>{const pKey=keyOf(r,type==="page"?["page","pages","صفحة"]:["query","queries","طلب البحث","عبارة البحث"]);
 const cKey=keyOf(r,["clicks","النقرات"]);const iKey=keyOf(r,["impressions","مرات الظهور","ظهور"]);const ctrKey=keyOf(r,["ctr","نسبة النقر إلى الظهور"]);const posKey=keyOf(r,["position","average position","متوسط موضع الإعلان","الموضع"]);
 const impressions=num(r[iKey]),clicks=num(r[cKey]);let ctr=num(r[ctrKey]);if(String(r[ctrKey]||"").includes("%"))ctr/=100;else if(ctr>1)ctr/=100;
 return {key:type==="page"?normalizePath(r[pKey]):r[pKey]||"",clicks,impressions,ctr:ctr||((impressions&&clicks/impressions)||0),position:num(r[posKey])};}).filter(r=>r.key);
}
function normalizeEvents(rows){return rows.map(r=>({timestamp:r.timestamp||r.time||r.datetime||"",event:r.event||r.event_name||"",path:normalizePath(r.path||r.page_path||r.landing_path||r.url||""),landing_path:normalizePath(r.landing_path||r.path||r.page_path||""),source:r.source||"",product_slug:r.product_slug||"",cta_location:r.cta_location||""})).filter(r=>r.event)}
function normalizeOrders(rows){return rows.map(r=>({
 order_id:r.order_id||"",
 original_order_id:r.original_order_id||"",
 is_repeat_purchase:String(r.is_repeat_purchase||"").toUpperCase(),
 product:r.product||"",
 lead_status:String(r.lead_status||"").toUpperCase(),
 payment_method:String(r.payment_method||"").toUpperCase(),
 payment_verified_at:r.payment_verified_at||"",
 delivery_status:String(r.delivery_status||"").toUpperCase(),
 delivered_at:r.delivered_at||"",
 price_egp:num(r.price_egp)
})).filter(r=>r.order_id)}
function isTrue(v){return["TRUE","YES","1","نعم"].includes(String(v||"").toUpperCase())}
function isPaidOrder(o){return Boolean(o.payment_verified_at)||["PAID","VERIFIED","CONFIRMED"].includes(o.payment_method)||["PAID","WON","DELIVERED"].includes(o.lead_status)}
function isDeliveredOrder(o){return Boolean(o.delivered_at)||["DELIVERED","COMPLETE","COMPLETED"].includes(o.delivery_status)}

function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function loadState(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(saved){state.pages=Array.isArray(saved.pages)?saved.pages:[];state.queries=Array.isArray(saved.queries)?saved.queries:[];state.events=Array.isArray(saved.events)?saved.events:[];state.orders=Array.isArray(saved.orders)?saved.orders:[]}if(!state.events.length){const production=JSON.parse(localStorage.getItem("de:production-events:v1")||"[]");if(Array.isArray(production)&&production.length)state.events=normalizeEvents(production)}}catch{}}
async function readFile(input,kind){const file=input.files?.[0];if(!file)return;const rows=parseCSV(await file.text());if(kind==="pages")state.pages=normalizeSearchRows(rows,"page");if(kind==="queries")state.queries=normalizeSearchRows(rows,"query");if(kind==="events")state.events=normalizeEvents(rows);if(kind==="orders")state.orders=normalizeOrders(rows);saveState();render()}
function countEvent(name,filter=()=>true){return state.events.filter(e=>e.event===name&&filter(e)).length}
function weightedPosition(rows){const imp=rows.reduce((a,r)=>a+r.impressions,0);return imp?rows.reduce((a,r)=>a+r.position*r.impressions,0)/imp:0}
function render(){
 const clicks=state.pages.reduce((a,r)=>a+r.clicks,0),imps=state.pages.reduce((a,r)=>a+r.impressions,0);
 $("#kpiClicks").textContent=fmt(clicks);$("#kpiImpressions").textContent=fmt(imps);$("#kpiCtr").textContent=pct(imps?clicks/imps:NaN);$("#kpiPosition").textContent=state.pages.length?fmt(weightedPosition(state.pages)):"—";
 const gp=countEvent("guide_product_click");
 const bi=countEvent("buy_intent_click")+countEvent("buy_cta_click");
 const wa=countEvent("product_whatsapp_click")+countEvent("whatsapp_payment_click");
 const qualified=state.orders.filter(o=>["QUALIFIED","OFFER_SENT","PAYMENT_PENDING","PAID","DELIVERED","WON"].includes(o.lead_status)).length+countEvent("qualified_lead");
 const paid=state.orders.filter(isPaidOrder).length;
 const delivered=state.orders.filter(isDeliveredOrder).length;
 const repeat=state.orders.filter(o=>isTrue(o.is_repeat_purchase)&&isPaidOrder(o)).length+countEvent("repeat_purchase");
 $("#kpiGuideProduct").textContent=fmt(gp);$("#kpiBuyIntent").textContent=fmt(bi);$("#kpiWhatsapp").textContent=fmt(wa);$("#kpiSeoWaRate").textContent=pct(clicks?wa/clicks:NaN);
 $("#kpiQualified").textContent=fmt(qualified);$("#kpiPaid").textContent=fmt(paid);$("#kpiDelivered").textContent=fmt(delivered);$("#kpiRepeat").textContent=fmt(repeat);
 $("#loadStatus").textContent=`Pages: ${state.pages.length} · Queries: ${state.queries.length} · Events: ${state.events.length} · Orders: ${state.orders.length}`;
 renderPages();renderQueries();renderFunnel();
}
function renderPages(){
 if(!state.pages.length){$("#pagesTableWrap").className="empty";$("#pagesTableWrap").textContent="حمّل Search Console Pages CSV.";return}
 const rows=state.pages.map(r=>{const ev=state.events.filter(e=>e.path===r.key||e.landing_path===r.key);const productClicks=ev.filter(e=>e.event==="guide_product_click"||e.event==="product_click").length;const wa=ev.filter(e=>e.event==="product_whatsapp_click"||e.event==="whatsapp_payment_click").length;return {...r,productClicks,wa,productRate:r.clicks?productClicks/r.clicks:0,waRate:r.clicks?wa/r.clicks:0}}).sort((a,b)=>b.clicks-a.clicks);
 $("#pagesTableWrap").className="";$("#pagesTableWrap").innerHTML=`<table><thead><tr><th>الصفحة</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th><th>Product Clicks</th><th>Product Rate</th><th>WhatsApp</th><th>WA Rate</th></tr></thead><tbody>${rows.map(r=>`<tr><td dir="ltr">${r.key}</td><td>${fmt(r.clicks)}</td><td>${fmt(r.impressions)}</td><td>${pct(r.ctr)}</td><td>${fmt(r.position)}</td><td>${fmt(r.productClicks)}</td><td>${pct(r.productRate)}</td><td>${fmt(r.wa)}</td><td>${pct(r.waRate)}</td></tr>`).join("")}</tbody></table>`;
}
function opportunity(r){if(r.impressions>=50&&r.ctr<0.02&&r.position<=20)return"CTR فرصة";if(r.impressions>=30&&r.position>10&&r.position<=20)return"قريب من الصفحة الأولى";if(r.position<=10&&r.ctr<0.03)return"Title/Description";return"راقب"}
function renderQueries(){
 if(!state.queries.length){$("#queriesTableWrap").className="empty";$("#queriesTableWrap").textContent="حمّل Search Console Queries CSV.";return}
 const rows=[...state.queries].sort((a,b)=>b.impressions-a.impressions);
 $("#queriesTableWrap").className="";$("#queriesTableWrap").innerHTML=`<table><thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th><th>الفرصة</th></tr></thead><tbody>${rows.slice(0,100).map(r=>`<tr><td>${r.key}</td><td>${fmt(r.clicks)}</td><td>${fmt(r.impressions)}</td><td>${pct(r.ctr)}</td><td>${fmt(r.position)}</td><td><span class="status">${opportunity(r)}</span></td></tr>`).join("")}</tbody></table>`;
}
function renderFunnel(){
 const products=[...new Set([...state.events.map(e=>e.product_slug),...state.orders.map(o=>o.product)].filter(Boolean))];
 if(!products.length){$("#funnelTableWrap").className="empty";$("#funnelTableWrap").textContent="لا توجد بيانات Funnel فعلية بعد.";return}
 const rows=products.map(p=>{
   const views=countEvent("product_view",e=>e.product_slug===p);
   const guide=countEvent("guide_product_click",e=>e.product_slug===p);
   const buy=countEvent("buy_intent_click",e=>e.product_slug===p)+countEvent("buy_cta_click",e=>e.product_slug===p);
   const wa=countEvent("product_whatsapp_click",e=>e.product_slug===p)+countEvent("whatsapp_payment_click",e=>e.product_slug===p);
   const orders=state.orders.filter(o=>o.product===p);
   const qualified=orders.filter(o=>["QUALIFIED","OFFER_SENT","PAYMENT_PENDING","PAID","DELIVERED","WON"].includes(o.lead_status)).length+countEvent("qualified_lead",e=>e.product_slug===p);
   const paid=orders.filter(isPaidOrder).length;
   const delivered=orders.filter(isDeliveredOrder).length;
   const repeat=orders.filter(o=>isTrue(o.is_repeat_purchase)&&isPaidOrder(o)).length+countEvent("repeat_purchase",e=>e.product_slug===p);
   return {p,views,guide,buy,wa,qualified,paid,delivered,repeat};
 });
 $("#funnelTableWrap").className="";
 $("#funnelTableWrap").innerHTML=`<table><thead><tr><th>المنتج</th><th>Views</th><th>Guide → Product</th><th>Buy Intent</th><th>WhatsApp</th><th>Qualified</th><th>Paid</th><th>Delivered</th><th>Repeat</th><th>View → WA</th><th>Paid → Delivered</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.p}</td><td>${fmt(r.views)}</td><td>${fmt(r.guide)}</td><td>${fmt(r.buy)}</td><td>${fmt(r.wa)}</td><td>${fmt(r.qualified)}</td><td>${fmt(r.paid)}</td><td>${fmt(r.delivered)}</td><td>${fmt(r.repeat)}</td><td>${pct(r.views?r.wa/r.views:NaN)}</td><td>${pct(r.paid?r.delivered/r.paid:NaN)}</td></tr>`).join("")}</tbody></table>`;
}
function csvEscape(v){const s=String(v??"");return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function downloadEvents(){
 const headers=["timestamp","event","path","landing_path","source","product_slug","cta_location"];
 const lines=[headers,...state.events.map(e=>headers.map(h=>e[h]||""))];
 const blob=new Blob([lines.map(r=>r.map(csvEscape).join(",")).join("\n")],{type:"text/csv;charset=utf-8"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="digital-execution-funnel-events.csv";a.click();URL.revokeObjectURL(a.href);
}
function addManualEvent(){
 const event=$("#manualEvent").value,path=$("#manualPath").value.trim(),product_slug=$("#manualProduct").value;
 state.events.push(normalizeEvents([{timestamp:new Date().toISOString(),event,path,landing_path:path,source:"manual",product_slug,cta_location:"manual"}])[0]);
 saveState();render();
}
function downloadSummary(){
 const wa=countEvent("product_whatsapp_click")+countEvent("whatsapp_payment_click");
 const qualified=state.orders.filter(o=>["QUALIFIED","OFFER_SENT","PAYMENT_PENDING","PAID","DELIVERED","WON"].includes(o.lead_status)).length+countEvent("qualified_lead");
 const paid=state.orders.filter(isPaidOrder).length,delivered=state.orders.filter(isDeliveredOrder).length,repeat=state.orders.filter(o=>isTrue(o.is_repeat_purchase)&&isPaidOrder(o)).length+countEvent("repeat_purchase");
 const lines=[["metric","value"],["organic_clicks",state.pages.reduce((a,r)=>a+r.clicks,0)],["impressions",state.pages.reduce((a,r)=>a+r.impressions,0)],["guide_product_click",countEvent("guide_product_click")],["buy_intent_click",countEvent("buy_intent_click")+countEvent("buy_cta_click")],["product_whatsapp_click",wa],["qualified_lead",qualified],["paid_order",paid],["delivered_order",delivered],["repeat_purchase",repeat]];
 const blob=new Blob([lines.map(r=>r.map(csvEscape).join(",")).join("\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="digital-execution-funnel-summary.csv";a.click();URL.revokeObjectURL(a.href)
}
$("#pagesFile").addEventListener("change",e=>readFile(e.target,"pages"));
$("#queriesFile").addEventListener("change",e=>readFile(e.target,"queries"));
$("#eventsFile").addEventListener("change",e=>readFile(e.target,"events"));
$("#ordersFile").addEventListener("change",e=>readFile(e.target,"orders"));
$("#resetBtn").addEventListener("click",()=>{state.pages=[];state.queries=[];state.events=[];state.orders=[];localStorage.removeItem(STORAGE_KEY);["pagesFile","queriesFile","eventsFile","ordersFile"].forEach(id=>$("#"+id).value="");render()});
$("#downloadSummaryBtn").addEventListener("click",downloadSummary);
$("#downloadEventsBtn").addEventListener("click",downloadEvents);
$("#addManualEventBtn").addEventListener("click",addManualEvent);
loadState();render();
