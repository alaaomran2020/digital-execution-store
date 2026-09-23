# Digital Execution Store

المتجر العام لمنتجات **Digital Execution**.

## النطاق
هذا المستودع يحتوي فقط على:
- واجهة المتجر العامة
- صفحات المنتجات
- ملفات CSS / JavaScript العامة
- معلومات المنتجات المنشورة

## ممنوع
لا يتم وضع أي ملفات مدفوعة أو أكواد منتجات تجارية خاصة داخل هذا المستودع.

خصوصًا:
- ReStock Desk source package
- Commercial ZIP files
- Private release assets
- Customer delivery files

## المنتجات المنشورة
- **ReStock Desk v1.2.2** — أدوات الأعمال — 399 EGP.
- **Career Kit v1.0.0** — أدوات مهنية — 249 EGP.

الدفع الحالي للمنتجات المنشورة: Vodafone Cash، والتسليم بعد التحقق عبر WhatsApp.

## الاستضافة
المستودع مصمم للعمل كـ Static Site على:
- GitHub Pages
- أو Cloudflare Pages

## Single Source of Truth
هذا المستودع هو المصدر الوحيد للواجهة العامة لمتجر Digital Execution.

## Store Architecture Finalization
- الصفحة الرئيسية تمثل علامة Digital Execution بدل منتج واحد.
- كتالوج المنتجات: `/products/`.
- صفحة ReStock Desk: `/products/restock-desk/`.
- صفحة Career Kit: `/products/career-kit/`.
- سجل المنتجات العام: `/data/products.json`.
- دليل التراخيص: `/licenses.html`.
- المنتجات التجارية المدفوعة وملفات التسليم تظل خارج هذا المستودع.

## Product Schema v3
`/data/products.json` يحتفظ بالحقول العامة الحالية للحفاظ على التوافق، ويضيف طبقات منظمة لكل منتج:

- `identity`: نوع المنتج والإصدار/المسار والعلامة.
- `market`: الجمهور والمشكلة والبدائل والتميّز.
- `offer`: النتيجة والآلية والمحتويات والقيود.
- `commerce`: السعر والعملة ونموذج الدفع والباقة/الترقية.
- `trust`: المعاينات والترخيص وسياسة الدعم.
- `delivery`: طريقة التسليم وقناة التسليم وسياسة التحديثات.
- `analytics`: هوية المنتج المطلوبة للقياس.
- `lifecycle`: المرحلة التجارية الحالية للمنتج.

عقد البيانات المرجعي موجود في:
`/data/products.schema.json`

مراحل دورة الحياة المعتمدة:
`IDEA → VALIDATING → VALIDATED → BUILDING → OFFER_READY → DELIVERY_READY → COMMERCIAL_QA → PUBLISHED → OPTIMIZING → SCALING`

**مهم:** Product Schema v3 لا ينقل أي ملفات تجارية مدفوعة إلى المستودع العام، ولا يغيّر صفحات البيع أو التصميم الحالي.

## Store QA
يتم تشغيل `qa/store-qa.mjs` تلقائيًا عبر GitHub Actions على Pull Requests وعلى `main` لفحص اتساق Product Registry، بيانات صفحات المنتجات، Tracking، Sitemap والروابط المحلية.
