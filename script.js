const STORE_CONTEXT={phone:"01011673107",whatsapp:"201011673107",brand:"Digital Execution"};
const body=document.body;
const pageType=body.dataset.page||"unknown";
const PRODUCT_CONTEXT=pageType==="product"?{
  product_slug:body.dataset.productSlug||"",
  product_name:body.dataset.productName||"",
  version:body.dataset.productVersion||"",
  price:Number(body.dataset.productPrice||0),
  currency:body.dataset.productCurrency||"EGP"
}:null;

const FIRST_LANDING_KEY="de:first_landing_path";
const CURRENT_URL=new URL(window.location.href);
const LANDING_PATH=sessionStorage.getItem(FIRST_LANDING_KEY)||CURRENT_URL.pathname;
if(!sessionStorage.getItem(FIRST_LANDING_KEY)) sessionStorage.setItem(FIRST_LANDING_KEY,LANDING_PATH);
const ATTRIBUTION_CONTEXT={
  path:CURRENT_URL.pathname,
  landing_path:LANDING_PATH,
  referrer:document.referrer||"",
  utm_source:CURRENT_URL.searchParams.get("utm_source")||"",
  utm_medium:CURRENT_URL.searchParams.get("utm_medium")||"",
  utm_campaign:CURRENT_URL.searchParams.get("utm_campaign")||""
};

const FUNNEL_STAGE_BY_EVENT={
  product_view:"product_view",
  lead_magnet_click:"lead_magnet",
  health_check_click:"lead_magnet",
  demo_click:"consideration",
  buy_intent_click:"purchase_intent",
  buy_cta_click:"purchase_intent",
  product_whatsapp_click:"conversation",
  copy_payment_number:"payment_intent",
  qualified_lead:"qualified_lead",
  order:"sale",
  upsell_view:"upsell",
  upsell_click:"upsell_intent",
  bundle_view:"bundle",
  bundle_click:"bundle_intent"
};

const EVENT_STORAGE_KEY="de:production-events:v1";
const EVENT_STORAGE_LIMIT=500;
const EVENT_SESSION_KEY="de:event-session-id";

function getEventSessionId(){
  let id=sessionStorage.getItem(EVENT_SESSION_KEY);
  if(!id){
    id=(globalThis.crypto?.randomUUID?.()||("session-"+Date.now()+"-"+Math.random().toString(36).slice(2)));
    sessionStorage.setItem(EVENT_SESSION_KEY,id);
  }
  return id;
}

function readStoredEvents(){
  try{
    const parsed=JSON.parse(localStorage.getItem(EVENT_STORAGE_KEY)||"[]");
    return Array.isArray(parsed)?parsed:[];
  }catch{return[]}
}

function persistEvent(detail){
  try{
    const events=readStoredEvents();
    events.push(detail);
    localStorage.setItem(EVENT_STORAGE_KEY,JSON.stringify(events.slice(-EVENT_STORAGE_LIMIT)));
  }catch{}
}

function csvEscape(value){
  const s=String(value??"");
  return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
}

function exportStoredEvents(){
  const events=readStoredEvents();
  const headers=["timestamp","event","funnel_stage","session_id","path","landing_path","source","product_slug","cta_location","label","referrer","utm_source","utm_medium","utm_campaign"];
  const rows=[headers.join(","),...events.map(e=>headers.map(h=>csvEscape(e[h])).join(","))];
  const blob=new Blob([rows.join("\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="digital-execution-production-events-"+new Date().toISOString().slice(0,10)+".csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

window.DigitalExecutionAnalytics={
  storageKey:EVENT_STORAGE_KEY,
  getEvents:()=>readStoredEvents().map(e=>({...e})),
  exportEvents:exportStoredEvents,
  clearEvents:()=>localStorage.removeItem(EVENT_STORAGE_KEY),
};

function trackEvent(eventName,metadata={}){
  const detail={
    timestamp:new Date().toISOString(),
    event:eventName,
    funnel_stage:metadata.funnel_stage||FUNNEL_STAGE_BY_EVENT[eventName]||"",
    session_id:getEventSessionId(),
    event_id:(globalThis.crypto?.randomUUID?.()||("event-"+Date.now()+"-"+Math.random().toString(36).slice(2))),
    user_agent:navigator.userAgent||"",
    ...ATTRIBUTION_CONTEXT,
    ...metadata
  };
  persistEvent(detail);
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push(detail);
  window.dispatchEvent(new CustomEvent("digital-execution:event",{detail}));
}

function productMetadataFrom(element){
  if(PRODUCT_CONTEXT?.product_slug) return PRODUCT_CONTEXT;
  const slug=element?.dataset?.productSlug;
  return slug?{product_slug:slug}:{};
}

function setupPurchase(){
  if(!PRODUCT_CONTEXT?.product_slug) return;
  document.querySelectorAll("[data-payment-number]").forEach(el=>el.textContent=STORE_CONTEXT.phone);
  const waBtn=document.getElementById("waBtn");
  if(waBtn){
    const amount=PRODUCT_CONTEXT.price?PRODUCT_CONTEXT.price+" جنيه":"";
    const version=PRODUCT_CONTEXT.version?" v"+PRODUCT_CONTEXT.version:"";
    const msg=[
      "مرحبًا، أريد شراء "+PRODUCT_CONTEXT.product_name+version+" من "+STORE_CONTEXT.brand+".",
      "",
      amount?"السعر: "+amount:"",
      "رقم Vodafone Cash: "+STORE_CONTEXT.phone,
      "وسأرسل صورة أو رقم عملية الدفع هنا للتأكيد."
    ].filter(Boolean).join("\n");
    waBtn.href="https://wa.me/"+STORE_CONTEXT.whatsapp+"?text="+encodeURIComponent(msg);
  }
  const copyBtn=document.getElementById("copyBtn");
  if(copyBtn) copyBtn.addEventListener("click",async()=>{
    try{
      await navigator.clipboard.writeText(STORE_CONTEXT.phone);
      const old=copyBtn.textContent;
      copyBtn.textContent="تم النسخ";
      setTimeout(()=>copyBtn.textContent=old,1400);
    }catch{alert("رقم Vodafone Cash: "+STORE_CONTEXT.phone)}
  });
}

if(pageType==="store") trackEvent("store_view",{source:"homepage"});
const SEARCH_TERM=CURRENT_URL.searchParams.get("q")||CURRENT_URL.searchParams.get("search")||"";
if(SEARCH_TERM) trackEvent("search",{source:"url_query",query_length:SEARCH_TERM.length});
if(pageType==="product_list") trackEvent("category_view",{source:"products",category:"all_products"});
if(PRODUCT_CONTEXT?.product_slug) trackEvent("product_view",{...PRODUCT_CONTEXT,source:"product_page"});

document.addEventListener("click",event=>{
  const tracked=event.target.closest("[data-track]");
  if(!tracked) return;
  const metadata={
    label:(tracked.textContent||"").trim().slice(0,100),
    source:tracked.dataset.source||pageType,
    cta_location:tracked.dataset.ctaLocation||"unknown",
    ...productMetadataFrom(tracked)
  };
  const eventName=tracked.dataset.track;
  trackEvent(eventName,metadata);
  // Passive Revenue OS v1 canonical aliases. Keep legacy event names for continuity.
  if(eventName==="buy_intent_click") trackEvent("buy_cta_click",{...metadata,legacy_event:eventName});
  if(eventName==="health_check_click") trackEvent("lead_magnet_click",{...metadata,legacy_event:eventName});
});

setupPurchase();

document.querySelectorAll(".mobile-menu").forEach(menu=>{
  menu.addEventListener("click",event=>{
    if(event.target.closest("a")) menu.removeAttribute("open");
  });
});


const menuToggle=document.getElementById("menuToggle");
const mobileNav=document.getElementById("mobileNav");

function setMobileMenu(open){
  if(!menuToggle||!mobileNav) return;
  menuToggle.setAttribute("aria-expanded",String(open));
  menuToggle.setAttribute("aria-label",open?"إغلاق قائمة التنقل":"فتح قائمة التنقل");
  mobileNav.hidden=!open;
  mobileNav.classList.toggle("is-open",open);
}

if(menuToggle&&mobileNav){
  setMobileMenu(false);

  menuToggle.addEventListener("click",event=>{
    event.preventDefault();
    event.stopPropagation();
    setMobileMenu(menuToggle.getAttribute("aria-expanded")!=="true");
  });

  mobileNav.addEventListener("click",event=>{
    if(event.target.closest("a")) setMobileMenu(false);
  });

  document.addEventListener("click",event=>{
    if(menuToggle.getAttribute("aria-expanded")!=="true") return;
    if(!mobileNav.contains(event.target)&&!menuToggle.contains(event.target)) setMobileMenu(false);
  });

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&menuToggle.getAttribute("aria-expanded")==="true"){
      setMobileMenu(false);
      menuToggle.focus();
    }
  });

  window.addEventListener("resize",()=>{
    if(window.innerWidth>850) setMobileMenu(false);
  });
}

const lightbox=document.getElementById("lightbox");
const lightboxImage=document.getElementById("lightboxImage");
const lightboxClose=document.getElementById("lightboxClose");
let previousFocus=null;
function closeLightbox(){
  if(!lightbox||!lightboxImage)return;
  lightbox.hidden=true;lightboxImage.removeAttribute("src");lightboxImage.alt="";
  if(previousFocus)previousFocus.focus();
}
document.querySelectorAll("[data-lightbox]").forEach(button=>button.addEventListener("click",()=>{
  if(!lightbox||!lightboxImage||!lightboxClose)return;
  previousFocus=button;const image=button.querySelector("img");
  lightboxImage.src=button.dataset.lightbox;lightboxImage.alt=image?.alt||"معاينة المنتج";
  lightbox.hidden=false;lightboxClose.focus();
}));
if(lightboxClose)lightboxClose.addEventListener("click",closeLightbox);
if(lightbox)lightbox.addEventListener("click",event=>{if(event.target===lightbox)closeLightbox();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&lightbox&&!lightbox.hidden)closeLightbox();});

const observedOnce=new Set();
if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const eventName=entry.target.dataset.observe;
    if(eventName&&!observedOnce.has(eventName)){
      observedOnce.add(eventName);
      trackEvent(eventName,{source:pageType,...(PRODUCT_CONTEXT||{})});
      observer.unobserve(entry.target);
    }
  }),{threshold:.25});
  document.querySelectorAll("[data-observe]").forEach(section=>observer.observe(section));
}

// order stays a verified business event; it is never emitted from the public client before payment/order confirmation.
