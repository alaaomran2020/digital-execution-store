(() => {
  'use strict';
  const form = document.getElementById('breakEvenForm');
  if (!form) return;
  const money = new Intl.NumberFormat('ar-EG', {style:'currency', currency:'EGP', maximumFractionDigits:2});
  const num = new Intl.NumberFormat('ar-EG', {maximumFractionDigits:2});
  const value = id => Number(document.getElementById(id).value || 0);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fixed = value('fixedCosts'), price = value('sellingPrice'), variable = value('variableCost');
    const contribution = price - variable;
    const status = document.getElementById('status');
    const clear = () => { for (const id of ['contribution','breakEvenUnits','breakEvenRevenue']) document.getElementById(id).textContent = '—'; };
    if (price <= 0 || contribution <= 0) {
      clear();
      status.textContent = 'سعر البيع لازم يكون أكبر من التكلفة المتغيرة للوحدة.';
      return;
    }
    const units = Math.ceil(fixed / contribution), revenue = fixed / (contribution / price);
    if (![units, revenue, contribution].every(Number.isFinite)) {
      clear();
      status.textContent = 'الأرقام أكبر من نطاق الحساب. راجع المدخلات وحاول تاني.';
      return;
    }
    document.getElementById('contribution').textContent = money.format(contribution);
    document.getElementById('breakEvenUnits').textContent = num.format(units) + ' وحدة';
    document.getElementById('breakEvenRevenue').textContent = money.format(revenue);
    status.textContent = 'تم الحساب. دي نتيجة للتخطيط وليست استشارة مالية؛ قيمة المبيعات هي حد التعادل النظري قبل تقريب عدد الوحدات.';
  });
})();
