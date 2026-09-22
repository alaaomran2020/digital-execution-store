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

## المنتج الأول
**ReStock Desk v1.2.2**

السعر الحالي: 399 EGP  
الدفع: Vodafone Cash  
رقم الدفع / واتساب: 01011673107

## الاستضافة
المستودع مصمم للعمل كـ Static Site على:
- GitHub Pages
- أو Cloudflare Pages

## Single Source of Truth
هذا المستودع هو المصدر الوحيد للواجهة العامة لمتجر Digital Execution.

## Store Architecture v2
- الصفحة الرئيسية تمثل علامة Digital Execution بدل منتج واحد.
- كتالوج المنتجات: `/products/`.
- صفحة ReStock Desk: `/products/restock-desk/`.
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
