(() => {
  "use strict";
  function renderFooter() {
    let footer = document.querySelector("body > footer");
    if (!footer) { footer = document.createElement("footer"); document.body.append(footer); }
    const tools = location.pathname.startsWith("/tools/");
    const services = location.pathname.startsWith("/services/");
    const links = tools
      ? '<a href="/tools/">كل الأدوات</a><a href="/tools/pricing-calculator/">حاسبة التسعير</a><a href="/tools/break-even-calculator/">نقطة التعادل</a><a href="/tools/inventory-health-check/">صحة المخزون</a>'
      : services
      ? '<a href="/services/">الخدمات</a><a href="/services/graphic-design/">استوديو التصميم الجرافيكي</a>'
      : '<a href="/tools/">الأدوات المجانية</a><a href="/guides/">مركز الأدلة</a><a href="/services/">الخدمات</a><a href="/updates/">الدعم والتحديثات</a>';
    footer.className = "site-footer-pro";
    footer.innerHTML = `<div class="footer-shell"><div class="footer-brand-block"><a class="site-header-brand" href="${tools ? '/tools/' : services ? '/services/' : '/'}"><span class="site-header-brand-mark" aria-hidden="true">DE</span><span class="site-header-brand-text"><strong>ديجيتال إكسيكيوشن</strong><small lang="en" dir="ltr">DIGITAL EXECUTION</small></span></a><p>أدوات تساعدك تحسبها، وأدلة توضّح لك الخطوة، وتصميم يعبّر عن مشروعك.</p><span class="footer-trust-pill">فكرتك تستاهل تنفيذًا مدروسًا.</span></div><nav class="footer-nav-pro" aria-label="اكتشف المنصة"><strong>خطوتك الجاية</strong>${links}</nav><div class="footer-contact-grid"><strong>خلّينا نتكلم</strong><p>للاستفسار عن الأدوات أو مناقشة مشروعك.</p><a href="mailto:contact@digital-execution.cc" dir="ltr">contact@digital-execution.cc</a><a href="https://wa.me/201011673107" target="_blank" rel="noopener noreferrer">تواصل على واتساب ←</a></div><div class="footer-bottom"><p>© 2026 Digital Execution — جميع الحقوق محفوظة.</p><nav aria-label="الصفحات القانونية"><a href="/privacy.html">الخصوصية</a><a href="/terms.html">الشروط</a><a href="/licenses.html">التراخيص</a></nav></div></div>`;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderFooter, {once:true}); else renderFooter();
})();
