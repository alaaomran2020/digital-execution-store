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

function trackEvent(eventName,metadata={}){
  const detail={
    timestamp:new Date().toISOString(),
    event:eventName,
    ...ATTRIBUTION_CONTEXT,
    ...metadata
  };
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
if(pageType==="product_list") trackEvent("product_list_view",{source:"products"});
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
  trackEvent(tracked.dataset.track,metadata);
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

// purchase_confirmed stays a verified business event; it is never emitted from the public client.
