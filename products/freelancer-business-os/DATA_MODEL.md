# نموذج البيانات — Freelancer Business OS v1.0.0

LEAD_ID → CLIENT_ID → BRIEF_ID → QUOTE_ID → PROJECT_ID → TASK_ID / DELIVERY_ID → INVOICE_ID → PAYMENT_ID
ويرتبط PROJECT_ID كذلك بـ EXPENSE_ID.

## الجداول والحقول
- Leads: id, name, contact, source, service, estimatedValue, status, nextFollowup, notes.
- Clients: id, name, contact, email, company, status, createdAt.
- Briefs: id, clientId, title, objective, scope, requirements, deadline, budget, status.
- Quotes: id, clientId, briefId, title, amount, depositPercent, validUntil, status.
- Projects: id, clientId, quoteId, name, startDate, deadline, agreedValue, status, estimatedHours, actualHours.
- Tasks: id, projectId, title, dueDate, priority, estimatedHours, actualHours, status.
- Deliveries: id, projectId, title, deliveredAt, revisionRound, status, notes.
- Invoices: id, projectId, clientId, amount, dueDate, status.
- Payments: id, invoiceId, projectId, amount, date, method, notes.
- Expenses: id, projectId, category, amount, date, notes.
- Pricing: service, hours, hourlyCost, directCosts, marginPercent, recommendedPrice.

## قواعد التكامل
- لا Brief أو عرض سعر بدون عميل موجود.
- لا مشروع بدون عميل؛ والعرض المرتبط يجب أن يكون لنفس العميل.
- لا مهمة أو تسليم أو مصروف بدون مشروع.
- لا فاتورة بدون مشروع وعميل متطابقين.
- لا دفعة بدون فاتورة، ولا تتجاوز المدفوعات قيمة الفاتورة.
- القيم المالية والساعات لا تكون سالبة.
- المشروع لا يغلق مع مهام مفتوحة أو فواتير غير محصلة.
- التحويل من Lead إلى Client يحافظ على مصدر العميل والخدمة المطلوبة.

## مؤشرات Dashboard
قيمة Pipeline، عروض معلقة، مشاريع نشطة، مهام متأخرة، فواتير مستحقة، التحصيل، المصروفات، صافي الربح، معدل Lead→Client، ومتوسط قيمة المشروع.
