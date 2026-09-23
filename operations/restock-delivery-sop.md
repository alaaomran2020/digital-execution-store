# ReStock Desk — Post-Verification Self-Service Delivery SOP

## الهدف
تقليل التدخل اليدوي إلى خطوة واحدة فقط: التحقق من الدفع.

## الأصل التجاري المعتمد
- ReStock Desk v1.2.2 Commercial ZIP.
- SHA256 موجود بجانب الأصل التجاري.
- المصدر الأساسي: private GitHub release + نسخة Google Drive خاصة (غير عامة) داخل مجلد Commercial Delivery.
- النسخ القديمة ذات مشاركة anyone-with-link لا تُستخدم كأصل تسليم Canonical.
- لا يتم وضع رابط الأصل التجاري داخل صفحات عامة أو ملفات عامة في المستودع.

## المسار
1. العميل يدفع عبر Vodafone Cash.
2. يتم التحقق من الدفع يدويًا.
3. يسجل الطلب PAID في Customer/Delivery Log.
4. يتم إرسال رابط الأصل التجاري المعتمد فقط.
5. العميل يكمل ذاتيًا من START_HERE_AR.html ثم QUICK_START_AR.md ثم TROUBLESHOOTING_AR.md.
6. بعد التسليم يسجل delivery_complete.
7. بعد الاستخدام، يتم توجيه العميل إلى Business Control Pack كأول Upsell.

## قاعدة الأمان
لا يتم نشر رابط الأصل التجاري في HTML عام. إذا تغيّرت قناة الدفع مستقبلًا إلى بوابة تدعم webhook، يمكن أتمتة الخطوات 2–4 بدون تغيير رحلة العميل.

## Definition of Done
- التحقق من الدفع هو التدخل اليدوي الوحيد الإلزامي.
- لا يوجد تركيب أو إعداد فردي.
- لا يوجد إرسال ملفات متعددة يدويًا.
- نسخة واحدة Canonical لكل Version.
- START HERE + Quick Start + Troubleshooting موجودة داخل الحزمة.

## حالة الدفع
- الحالة: UNDER REVIEW — قيد المراجعة.
- التحقق الحالي: Vodafone Cash يدوي.
- بعد التحقق: التسليم والاستخدام Self-Service.
- لا تعتبر هذه الخطوة Release Blocker في Passive Revenue OS v1.
- يمكن أتمتتها لاحقًا عند اعتماد وسيلة دفع مناسبة.
