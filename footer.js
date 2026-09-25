(()=>{"use strict";
const phone="01011673107",wa="201011673107";
function render(){
  let footer=document.querySelector("footer");
  if(!footer){footer=document.createElement("footer");document.body.appendChild(footer)}
  footer.className="site-footer-pro";
  footer.innerHTML='<div class="footer-shell">'+
  '<div class="footer-brand-block"><span class="footer-brand-mark" aria-hidden="true">DE</span><span class="footer-trust-pill"><i aria-hidden="true"></i> متجر منتجات رقمية جاهزة</span><strong>Digital Execution</strong><p>منتجات رقمية عملية تساعدك تنجز المهمة أسرع، مع سعر وترخيص وطريقة شراء واستلام واضحة قبل الدفع.</p></div>'+
  '<div class="footer-contact-grid" aria-label="بيانات التواصل والدفع">'+
  '<a class="footer-contact-card" href="mailto:contact@digital-execution.cc"><span class="footer-contact-icon" aria-hidden="true">@</span><span>البريد الرسمي</span><strong>contact@digital-execution.cc</strong><small>للتواصل والاستفسارات</small></a>'+
  '<a class="footer-contact-card" href="https://wa.me/'+wa+'" target="_blank" rel="noopener noreferrer"><span class="footer-contact-icon" aria-hidden="true">WA</span><span>واتساب</span><strong>'+phone+'</strong><small>للتواصل وإرسال إثبات الدفع</small></a>'+
  '<div class="footer-contact-card"><span class="footer-contact-icon" aria-hidden="true">VC</span><span>فودافون كاش</span><strong>'+phone+'</strong><button class="footer-copy-btn" type="button" data-copy-footer-cash>نسخ رقم الدفع</button></div></div>'+
  '<div class="footer-service-row"><span><b>الدفع:</b> فودافون كاش</span><span><b>التواصل:</b> واتساب والبريد الرسمي</span><span><b>الاستلام:</b> رقمي بعد التحقق من الدفع</span></div>'+
  '<nav class="footer-nav-pro" aria-label="روابط مهمة"><a href="/products/">المنتجات</a><a href="/licenses.html">التراخيص</a><a href="/updates/">التحديثات</a><a href="/terms.html">الشروط</a><a href="/privacy.html">الخصوصية</a></nav>'+
  '<div class="footer-divider" aria-hidden="true"></div><div class="footer-bottom"><p>رقم واتساب هو نفسه رقم فودافون كاش المعتمد للدفع.</p><p>© 2026 Digital Execution — جميع الحقوق محفوظة.</p></div></div>';
  const btn=footer.querySelector("[data-copy-footer-cash]");
  btn?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(phone);const old=btn.textContent;btn.textContent="تم نسخ الرقم";setTimeout(()=>btn.textContent=old,1400)}catch{alert("رقم فودافون كاش: "+phone)}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render,{once:true});else render();
})();