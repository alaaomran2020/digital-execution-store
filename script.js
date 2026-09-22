const phone="01011673107";
const wa="201011673107";
const price="399";
const PRODUCT_CONTEXT={
  product_slug:"restock-desk",
  version:"1.2.2",
  price:399
};
const msg=[
  "مرحبًا، أريد شراء ReStock Desk v1.2.2 من Digital Execution.",
  "",
  "السعر: "+price+" جنيه",
  "رقم Vodafone Cash: "+phone,
  "وسأرسل صورة أو رقم عملية الدفع هنا للتأكيد."
].join("\n");

const waBtn=document.getElementById("waBtn");
if(waBtn) waBtn.href="https://wa.me/"+wa+"?text="+encodeURIComponent(msg);
const copyBtn=document.getElementById("copyBtn");
if(copyBtn) copyBtn.addEventListener("click",async()=>{
  try{
    await navigator.clipboard.writeText(phone);
    const b=document.getElementById("copyBtn"),old=b.textContent;
    b.textContent="تم النسخ";
    setTimeout(()=>b.textContent=old,1400);
  }catch{alert("رقم Vodafone Cash: "+phone)}
});

function trackEvent(eventName,metadata={}){
  const detail={event:eventName,...metadata};
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push(detail);
  window.dispatchEvent(new CustomEvent("digital-execution:event",{detail}));
}

const pageType=document.body.dataset.page;
if(pageType==="store") trackEvent("store_view",{source:"homepage"});
if(pageType==="product_list") trackEvent("product_list_view",{source:"products"});
if(pageType==="product") trackEvent("product_view",{...PRODUCT_CONTEXT,source:"product_page"});

document.addEventListener("click",event=>{
  const tracked=event.target.closest("[data-track]");
  if(!tracked) return;
  const metadata={
    label:(tracked.textContent||"").trim().slice(0,100),
    source:tracked.dataset.source||pageType||"unknown",
    cta_location:tracked.dataset.ctaLocation||"unknown"
  };
  if(tracked.dataset.productSlug==="restock-desk"||pageType==="product") Object.assign(metadata,PRODUCT_CONTEXT);
  trackEvent(tracked.dataset.track,metadata);
});

const menuToggle=document.getElementById("menuToggle");
const mobileNav=document.getElementById("mobileNav");
if(menuToggle&&mobileNav) menuToggle.addEventListener("click",()=>{
  const open=menuToggle.getAttribute("aria-expanded")==="true";
  menuToggle.setAttribute("aria-expanded",String(!open));
  mobileNav.hidden=open;
});
if(mobileNav&&menuToggle) mobileNav.addEventListener("click",event=>{
  if(event.target.closest("a")){
    menuToggle.setAttribute("aria-expanded","false");
    mobileNav.hidden=true;
  }
});

const lightbox=document.getElementById("lightbox");
const lightboxImage=document.getElementById("lightboxImage");
const lightboxClose=document.getElementById("lightboxClose");
let previousFocus=null;
function closeLightbox(){
  if(!lightbox||!lightboxImage) return;
  lightbox.hidden=true;
  lightboxImage.removeAttribute("src");
  lightboxImage.alt="";
  if(previousFocus) previousFocus.focus();
}
document.querySelectorAll("[data-lightbox]").forEach(button=>{
  button.addEventListener("click",()=>{
    if(!lightbox||!lightboxImage||!lightboxClose) return;
    previousFocus=button;
    const image=button.querySelector("img");
    lightboxImage.src=button.dataset.lightbox;
    lightboxImage.alt=image?.alt||"لقطة من ReStock Desk";
    lightbox.hidden=false;
    lightboxClose.focus();
  });
});
if(lightboxClose) lightboxClose.addEventListener("click",closeLightbox);
if(lightbox) lightbox.addEventListener("click",event=>{if(event.target===lightbox) closeLightbox();});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&lightbox&&!lightbox.hidden) closeLightbox();
});

const observedOnce=new Set();
if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const eventName=entry.target.dataset.observe;
      if(eventName&&!observedOnce.has(eventName)){
        observedOnce.add(eventName);
        const metadata={source:pageType||"unknown"};
        if(pageType==="product") Object.assign(metadata,PRODUCT_CONTEXT);
        trackEvent(eventName,metadata);
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.25});
  document.querySelectorAll("[data-observe]").forEach(section=>observer.observe(section));
}

// purchase_confirmed is intentionally not emitted client-side.
// Payment confirmation remains a manual business event until a verified source exists.
