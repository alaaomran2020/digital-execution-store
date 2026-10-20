(() => {
  "use strict";
  function renderHeader() {
    const path = location.pathname;
    const tools = path.startsWith("/tools/");
    const services = path.startsWith("/services/");
    const links = tools
      ? [["/tools/", "كل الأدوات"], ["/tools/pricing-calculator/", "التسعير"], ["/tools/break-even-calculator/", "نقطة التعادل"], ["/tools/inventory-health-check/", "المخزون"]]
      : services
      ? [["/services/", "الخدمات"], ["/services/graphic-design/", "استوديو التصميم"]]
      : [["/", "الرئيسية"], ["/tools/", "الأدوات المجانية"], ["/guides/", "الأدلة"], ["/services/", "الخدمات"]];
    const navigation = links.map(([href, label]) => {
      const selected = path === href || (href !== "/" && path.startsWith(href) && !links.some(([other]) => other !== href && other.startsWith(href) && path.startsWith(other)));
      return `<a href="${href}"${selected ? ' aria-current="page"' : ''}>${label}</a>`;
    }).join("");
    const root = tools ? "/tools/" : services ? "/services/" : "/";
    const cta = tools ? ["/tools/#tools-list", "اختار أداتك"] : ["/services/graphic-design/#design-contact", "ابدأ مشروعك ←"];
    const shell = document.createElement("header");
    shell.className = "site-header-shell";
    shell.innerHTML = `<div class="site-announcement"><span>أدوات عملية. أفكار واضحة. تنفيذ يليق بشغلك.</span><span lang="en" dir="ltr">MADE FOR YOUR NEXT STEP</span></div>
      <div class="site-header-nav"><a class="site-header-brand" href="${root}"><span class="site-header-brand-mark" aria-hidden="true">DE</span><span class="site-header-brand-text"><strong>ديجيتال إكسيكيوشن</strong><small lang="en" dir="ltr">DIGITAL EXECUTION</small></span></a>
      <nav class="site-header-links" aria-label="التنقل الرئيسي">${navigation}</nav>
      <div class="site-header-actions"><a class="site-header-cta" href="${cta[0]}">${cta[1]}</a><button class="site-header-menu-btn" type="button" aria-expanded="false" aria-controls="siteHeaderMobile" aria-label="فتح القائمة">☰</button></div></div>
      <nav class="site-header-mobile" id="siteHeaderMobile" aria-label="قائمة الهاتف" hidden>${navigation}</nav>`;
    const existing = document.querySelector("body > header");
    if (existing && !existing.classList.contains("app-header")) existing.replaceWith(shell); else document.body.prepend(shell);
    const button = shell.querySelector("button");
    const menu = shell.querySelector(".site-header-mobile");
    const setOpen = open => {
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
      button.textContent = open ? "×" : "☰";
      menu.hidden = !open;
    };
    button.addEventListener("click", () => setOpen(menu.hidden));
    menu.addEventListener("click", event => { if (event.target.closest("a")) setOpen(false); });
    document.addEventListener("click", event => { if (!shell.contains(event.target)) setOpen(false); });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !menu.hidden) { setOpen(false); button.focus(); }
    });
    window.addEventListener("resize", () => { if (innerWidth > 900) setOpen(false); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderHeader, {once:true}); else renderHeader();
})();
