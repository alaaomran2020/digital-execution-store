// Local-only guidance for choosing what to include in a design brief.
(() => {
  "use strict";
  const select = document.getElementById("ds-kind");
  const guidance = document.getElementById("ds-kind-guidance");
  if (!select || !guidance) return;

  const tips = {
    "ds-brand": "اذكر اسم العلامة والجمهور المستهدف والألوان المفضلة وأماكن استخدام الشعار.",
    "ds-social": "حدد المنصات وعدد المنشورات والمقاسات والرسائل المطلوبة.",
    "ds-ads": "حدد هدف الحملة والجمهور والمنصات والمقاسات وموعد النشر.",
    "ds-packaging": "اذكر نوع المنتج ومقاسات العبوة ومحتوى الملصق ومتطلبات الطباعة.",
    "ds-print": "حدد نوع المطبوع والكمية والمقاس واللغة وبيانات التواصل.",
    "ds-presentations": "حدد الجمهور وعدد الشرائح واللغة والملفات المتاحة للعرض.",
    "ds-commerce": "حدد نوع المنتجات والمنصة والمقاسات وعدد الصور المطلوبة.",
    "ds-special": "اشرح المناسبة والمقاس وطريقة الاستخدام والموعد المطلوب."
  };

  const update = () => {
    guidance.textContent = tips[select.value] || "اختر نوع التصميم لعرض نصيحة تساعدك على كتابة موجز واضح.";
  };
  select.addEventListener("change", update);
  // Service cards set the select value programmatically without firing change.
  document.querySelectorAll(".ds-card-link[data-design-type]").forEach(link => {
    link.addEventListener("click", update);
  });
  update();
})();
