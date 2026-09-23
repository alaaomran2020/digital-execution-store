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

function trackEvent(eventName,metadata={}){
  const detail={event:eventName,...metadata};
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

const menuToggle=document.getElementById("menuToggle");
const mobileNav=document.getElementById("mobileNav");
if(menuToggle&&mobileNav) menuToggle.addEventListener("click",()=>{
  const open=menuToggle.getAttribute("aria-expanded")==="true";
  menuToggle.setAttribute("aria-expanded",String(!open));
  mobileNav.hidden=open;
});
if(mobileNav&&menuToggle) mobileNav.addEventListener("click",event=>{
  if(event.target.closest("a")){menuToggle.setAttribute("aria-expanded","false");mobileNav.hidden=true;}
});

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
