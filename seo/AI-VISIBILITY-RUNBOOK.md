# Digital Execution — SEO / AEO / GEO Execution Runbook

**Scope:** improve the existing `https://digital-execution.cc/` and the existing `alaaomran2020/digital-execution-store` repository. **Never create or migrate to a new website.**

**Status:** working plan and Codex/Claude Code prompts; PR #214 also implements the technical crawlability regression checks and canonical/sitemap repairs. Nothing here asserts that Google has indexed, recommended, or ranked the website.

## Non-negotiable boundaries

1. Production is GitHub Pages behind Cloudflare, **not Cloudflare Pages**. Keep static, crawlable HTML; do not introduce SSR, a backend, subscription, external API, new analytics tool, or `_redirects`/Cloudflare Pages `_headers` rules as though GitHub Pages supported them.
2. `data/storefront-mode.json` currently has `productsVisible: false`. All paid products stay hidden, product-placeholder `noindex,nofollow` remains, and products stay OUT of the sitemap and public navigation. Do not disallow `/products/` in robots.txt: crawlers must be able to read those `noindex` tags. Keep `404.html` noindex.
3. Tools, practical guides, and the graphic design studio are separate public areas. Never mix paid offers into hidden sections, remove working free tools, add admin banners, or change commercial delivery.
4. Never invent case studies, customer testimonials, certifications, author credentials, business addresses, ranking statistics, or proof. Never publish private assets or paid product source.
5. Changes go on an independent branch and a **Draft PR**, with tests and a changed-files report. Do **not** merge, deploy, submit Search Console changes, modify Cloudflare settings, or make third-party posts without separate explicit owner approval.
6. Preserve mobile performance, accessibility, RTL Arabic with natural Egyptian copy, and the existing zero-cost, low-complexity architecture.

## Existing assets and known overlaps (review before making changes)

- `sitemap.xml` and `robots.txt` exist and must be improved in place.
- `qa/storefront-paused-qa.mjs`, `qa/site-sections-qa.mjs`, `qa/premium-site-qa.mjs` already protect public site architecture.
- `qa/seo-visibility-qa.mjs` adds a read-only, dependency-free technical SEO audit; review warnings rather than blindly suppressing them.
- `seo/keyword-map.csv` and `seo/keyword-strategy.md` exist; rewrite outdated paid-product conversion paths to describe the **currently active** free-tool, guide, and design-service journey without erasing commercial history.
- `operations/seo-performance-dashboard.html` / `.js` already exist; respect the security review in Draft PR #213.
- The missing `/updates/` canonical is fixed within this SEO rollout using the current page; earlier Draft PR #207 is **superseded** for that specific issue and must not be merged blindly because it was prepared against an older page layout.
- Metricool integration is a separate unmerged Draft PR #208; **do not treat it as live** or combine its consent/security scope into SEO work.

## Prompt 1 — baseline audit and prioritization (read-only)

> أنت Senior Technical SEO + Frontend Engineer. افتح مستودع Digital Execution الحالي فقط، وحدد commit/branch بدقة. افحص ملفات HTML وSitemap وrobots.txt وسياسة إخفاء المنتجات، واكتشف: صفحات عامة مفقودة من الخريطة، canonical غير صحيح، noindex غير مقصود، مشاكل H1 وdescription وalt والأبعاد، الروابط الداخلية المكسورة أو اليتيمة، JSON-LD غير الصحيح، ومواضع الاعتماد على JavaScript لعرض المحتوى الأساسي. اقرأ اختبارات QA القائمة والـDraft PRs قبل تقرير أي خلل. لا تنشئ موقعًا، ولا تعدّل ملفات أو إعدادات أو تنشر. صنّف النتائج إلى Critical / High / Medium / Advisory مع رابط الملف والدليل وطريقة الإصلاح، وميّز العيوب الحقيقية عن حالات الإخفاء المقصود. اعرض baseline حقيقي، ولا تخمّن نتائج Google Search Console أو Lighthouse.

**Exit criteria:** evidence-backed issue list and a non-duplicative change plan.

## Prompt 2 — crawlability and technical SEO (isolated PR)

> داخل نفس المستودع، أنشئ فرعًا مستقلًا من main. أصلح فقط الأعطال التي ثبتت في تدقيق المرحلة الأولى: راجع sitemap الموجودة وأدرج الصفحات العامة القابلة للفهرسة فقط؛ حافظ على noindex للمنتجات المخفية و404؛ اختبر robots.txt لمحركات البحث؛ أصلح الروابط الداخلية المكسورة وتعارضات canonical وmeta descriptions وH1 والبيانات المنظمة. عالج redirects فقط عندما يتوفر دليل من HTTP فعلي أو إعداد Cloudflare حقيقي، ولا تخترع قواعد `_redirects` غير مدعومة. اجعل المحتوى المهم موجودًا في HTML المستضاف ثابتًا، ولا تضف SSR أو بنية استضافة جديدة. أضف اختبارات Node 22 تمنع رجوع الأخطاء. اذكر ما يتطلب Search Console أو Cloudflare أو موافقة المالك ولا تنفذه. شغّل اختبارات QA ثم افتح Draft PR فقط. لا دمج ولا نشر.

**Exit criteria:** passing regression tests, inspectable diff, Draft PR.

## Prompt 3 — answer-ready content and verified authority

> حسّن الصفحات الموجودة لـSEO وAEO وGEO بدون حشو كلمات مفتاحية أو نسخ مقالات أو إنشاء صفحات متشابهة. الأولوية: /tools/pricing-calculator/ و/tools/break-even-calculator/ و/tools/inventory-health-check/ و/services/graphic-design/ ثم الأدلة المرتبطة بها. لكل صفحة: عرّف الغرض والفئة المستفيدة، اشرح الخطوات والحدود بمثال حسابي صحيح، واجب عن 3–5 أسئلة حقيقية عند الحاجة، مع روابط داخلية مفيدة بين الأقسام دون إظهار منتجات مدفوعة. حافظ على H1 واحد، العنوان/الوصف الفريد، canonical الصحيح، ومعلومات الكاتب/الجهة **إذا كانت موثقة وقابلة للإظهار للزائر**. استخدم Organization/WebSite/Article/BreadcrumbList/Service schema عندما يطابق المحتوى المرئي فعلًا؛ لا تستخدم FAQ schema كوسيلة مضمونة للظهور المميز. لا تخترع مراجعات أو نتائج عملاء. اعمل Draft PR منفصلًا واختبر التغييرات.

**Exit criteria:** helpful human-readable answers, matching visible content and schema, no false claims or keyword cannibalization.

## Prompt 4 — performance, measurement, and external visibility

> حافظ على الموقع الحالي سريعًا ومناسبًا للموبايل. دقّق HTML/CSS والموارد والصور المستخدمة بالفعل؛ أضف alt مناسبًا أو alt فارغًا للصور الزخرفية، وأبعاد الصور لمنع CLS، وأصلح تحميل الوسائط الثقيلة دون تغيير الصور المعتمدة أو كسر المعاينات. استخدم WebP عند وجود مبرر واحتفظ بجودة ملائمة. قارن Lighthouse على نفس شروط التشغيل قبل/بعد، ولا تعلن وصول أقل من ثانيتين قبل قياسه. ابدأ من لوحة SEO القائمة؛ جهّز مؤشرات GSC (clicks, impressions, indexed pages), referral sources من AI حيث يمكن قياسها فعليًا، استفسارات التصميم، وتحميلات الأدوات. لا تضف تتبعًا ثالثًا أو cookies قبل المراجعة القانونية. جهّز قائمة backlinks تحريرية حقيقية من مجتمعات/شركاء ذوي صلة، **ولا تشترِ روابط ولا تنشر رسائل جماعية**. أنشئ Draft PR فقط، مع تقرير الفروق وما يلزم المالك.

**Exit criteria:** reproducible before/after evidence, privacy review, a realistic outreach checklist; no invented conversion or AI visibility numbers.

## Practical 30-day cycle

| Period | Work | Proof |
| --- | --- | --- |
| Days 1–7 | Baseline, crawling and canonical/sitemap cleanup | QA + inspected indexable URLs |
| Days 8–14 | Pricing, break-even and inventory page clarity | Answer-quality checklist + QA |
| Days 15–21 | Design Studio evidence, relevant guides, ethical citations | Verified claims and relevant links |
| Days 22–30 | Mobile Core Web Vitals and visibility baseline | Lighthouse protocol, GSC exports, referral report |

## Google Search Console — owner-approved/manual step

1. Open <https://search.google.com/search-console> and select the existing **domain property** for `digital-execution.cc`. Do not create a second unrelated site.
2. Under **Indexing → Sitemaps**, submit `https://digital-execution.cc/sitemap.xml` after the related PR is approved, merged and visibly live. If already submitted, inspect its current success/error status before resubmitting.
3. Use **URL Inspection** for `/`, `/tools/`, `/guides/`, `/services/graphic-design/`, and one practical guide. Compare live/crawled status and canonical chosen by Google. A sitemap submission is not an indexing guarantee.
4. Export 28-day pages/queries from Performance before and after. Keep dates, CTR, impressions, clicks and device split. Export only necessary analytics and remove sensitive fields.
5. Report indexing errors verbatim and leave unrelated products in their intentionally paused/noindex state.

## SEO quality scorecard (report real results, no fake percentage)

| Item | Pass condition |
| --- | --- |
| Technical indexability | Public hubs return valid pages, one H1, meta description, canonical and no noindex |
| Hidden product safety | Every paused commercial route is noindex; none added to sitemap |
| Content credibility | Named responsible party and proof only where real |
| AI discoverability | Search-friendly, excerptable factual answers; organic mentions observed, not promised |
| Speed | Measured LCP/CLS/INP, with mobile baseline and comparable after |
| Search Console | Confirmed submission/index coverage from actual property, not an assumption |
| Ethical links | Editorially earned relevance, no purchased/spam links |
| Change safety | CI PASS, draft review, owner approval before merge/deploy |

**Important:** SEO, AEO, and GEO are practices to improve eligibility and discoverability; none can guarantee top ranking, AI recommendations, citations, or customers.
