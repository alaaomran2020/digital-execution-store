(()=>{"use strict";
function currentPath(){return location.pathname.replace(/\/+$/,"")||"/"}
function renderHeader(){
  const existing=document.querySelector("header");
  const shell=document.createElement("header");
  shell.className="site-header-shell";
  shell.innerHTML=
    '<div class="site-announcement" aria-label="إعلانات المتجر"><div class="site-announcement-track">'+
      '<span class="site-announcement-item"><i aria-hidden="true"></i> منتجات رقمية عملية جاهزة للاستخدام</span>'+
      '<span class="site-announcement-item"><i aria-hidden="true"></i> دفع مرة واحدة بدون اشتراك شهري</span>'+
      '<a class="site-announcement-item" href="/updates/"><i aria-hidden="true"></i> اطلب أحدث نسخة من أي منتج اشتريته</a>'+
      '<span class="site-announcement-item"><i aria-hidden="true"></i> استلام رقمي بعد التحقق من الدفع</span>'+
      '<span class="site-announcement-item" aria-hidden="true"><i></i> منتجات رقمية عملية جاهزة للاستخدام</span>'+
      '<span class="site-announcement-item" aria-hidden="true"><i></i> دفع مرة واحدة بدون اشتراك شهري</span>'+
      '<a class="site-announcement-item" href="/updates/" aria-hidden="true"><i></i> اطلب أحدث نسخة من أي منتج اشتريته</a>'+
      '<span class="site-announcement-item" aria-hidden="true"><i></i> استلام رقمي بعد التحقق من الدفع</span>'+
    '</div></div>'+
    '<div class="site-header-nav">'+
      '<a class="site-header-brand" href="/"><span class="site-header-brand-mark" aria-hidden="true">DE</span><span class="site-header-brand-text"><strong>Digital Execution</strong><small>منتجات رقمية عملية</small></span></a>'+
      '<nav class="site-header-links" aria-label="التنقل الرئيسي">'+
        '<a href="/">الرئيسية</a>'+
        '<a href="/products/">المنتجات</a>'+
        '<a href="/updates/">التحديثات</a>'+
        '<a href="/licenses.html">التراخيص</a>'+
      '</nav>'+
      '<div class="site-header-actions">'+
        '<a class="site-header-cta" href="/products/">استكشف المنتجات</a>'+
        '<button class="site-header-menu-btn" type="button" aria-expanded="false" aria-controls="siteHeaderMobile" aria-label="فتح القائمة">☰</button>'+
      '</div>'+
    '</div>'+
    '<nav class="site-header-mobile" id="siteHeaderMobile" aria-label="قائمة الموبايل">'+
      '<a href="/">الرئيسية</a>'+
      '<a href="/products/">المنتجات</a>'+
      '<a href="/updates/">التحديثات</a>'+
      '<a href="/licenses.html">التراخيص</a>'+
      '<a href="/terms.html">الشروط</a>'+
      '<a class="site-header-cta" href="/products/">استكشف المنتجات</a>'+
    '</nav>';

  if(existing) existing.replaceWith(shell); else document.body.prepend(shell);

  const path=currentPath();
  shell.querySelectorAll(".site-header-links a,.site-header-mobile a").forEach(a=>{
    const target=(new URL(a.href,location.origin)).pathname.replace(/\/+$/,"")||"/";
    if(target===path || (target!=="/" && path.startsWith(target+"/"))) a.setAttribute("aria-current","page");
  });

  const btn=shell.querySelector(".site-header-menu-btn");
  const menu=shell.querySelector(".site-header-mobile");
  const setOpen=open=>{
    btn.setAttribute("aria-expanded",String(open));
    btn.setAttribute("aria-label",open?"إغلاق القائمة":"فتح القائمة");
    btn.textContent=open?"×":"☰";
    menu.classList.toggle("is-open",open);
  };
  btn.addEventListener("click",()=>setOpen(btn.getAttribute("aria-expanded")!=="true"));
  menu.addEventListener("click",e=>{if(e.target.closest("a"))setOpen(false)});
  document.addEventListener("click",e=>{if(!shell.contains(e.target))setOpen(false)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")setOpen(false)});
  window.addEventListener("resize",()=>{if(innerWidth>900)setOpen(false)});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",renderHeader,{once:true});else renderHeader();
})();