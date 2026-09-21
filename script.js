const phone="01011673107";
const wa="201011673107";
const price="399";
const msg=[
  "مرحبًا، أريد شراء ReStock Desk v1.2.2 من Digital Execution.",
  "",
  "السعر: "+price+" جنيه",
  "رقم Vodafone Cash: "+phone,
  "وسأرسل صورة أو رقم عملية الدفع هنا للتأكيد."
].join("\n");

document.getElementById("waBtn").href="https://wa.me/"+wa+"?text="+encodeURIComponent(msg);
document.getElementById("copyBtn").addEventListener("click",async()=>{
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

document.addEventListener("click",event=>{
  const tracked=event.target.closest("[data-track]");
  if(tracked) trackEvent(tracked.dataset.track,{label:(tracked.textContent||"").trim().slice(0,100)});
});

const menuToggle=document.getElementById("menuToggle");
const mobileNav=document.getElementById("mobileNav");
menuToggle.addEventListener("click",()=>{
  const open=menuToggle.getAttribute("aria-expanded")==="true";
  menuToggle.setAttribute("aria-expanded",String(!open));
  mobileNav.hidden=open;
});
mobileNav.addEventListener("click",event=>{
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
  lightbox.hidden=true;
  lightboxImage.removeAttribute("src");
  lightboxImage.alt="";
  if(previousFocus) previousFocus.focus();
}
document.querySelectorAll("[data-lightbox]").forEach(button=>{
  button.addEventListener("click",()=>{
    previousFocus=button;
    const image=button.querySelector("img");
    lightboxImage.src=button.dataset.lightbox;
    lightboxImage.alt=image?.alt||"لقطة من ReStock Desk";
    lightbox.hidden=false;
    lightboxClose.focus();
  });
});
lightboxClose.addEventListener("click",closeLightbox);
lightbox.addEventListener("click",event=>{if(event.target===lightbox) closeLightbox();});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!lightbox.hidden) closeLightbox();
});

const observedOnce=new Set();
if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const eventName=entry.target.dataset.observe;
      if(eventName&&!observedOnce.has(eventName)){
        observedOnce.add(eventName);
        trackEvent(eventName);
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.25});
  document.querySelectorAll("[data-observe]").forEach(section=>observer.observe(section));
}
