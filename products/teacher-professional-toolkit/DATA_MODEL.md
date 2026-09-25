# نموذج البيانات — v1.0.0

STUDENT_ID → ENROLLMENT_ID → GROUP_ID → SESSION_ID
ويرتبط STUDENT_ID/GROUP_ID كذلك بـ ATTENDANCE_ID / ASSIGNMENT_ID / ASSESSMENT_ID / PAYMENT_ID / FOLLOWUP_ID.

قواعد التكامل:
- لا تسجيل طالب في مجموعة غير موجودة.
- لا حضور أو تقييم أو دفعة لطالب غير موجود.
- لا حصة بدون مجموعة.
- القيم المالية والدرجات القصوى موجبة.
- يمنع تكرار تسجيل نفس الطالب في نفس المجموعة النشطة.
