(() => {
  'use strict';
  const form = document.getElementById('pricingForm');
  if (!form) return;
  const money = new Intl.NumberFormat('ar-EG', {style:'currency', currency:'EGP', maximumFractionDigits:2});
  const percent = new Intl.NumberFormat('ar-EG', {maximumFractionDigits:1});
  const status = document.getElementById('pricingStatus');
  const value = id => Number(document.getElementById(id).value || 0);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const total = value('cost') + value('shipping') + value('extra');
    const sale = total * (1 + value('markup') / 100);
    const profit = sale - total;
    const margin = sale > 0 ? profit / sale * 100 : 0;
    if (![total, sale, profit, margin].every(Number.isFinite)) {
      for (const id of ['totalCost','salePrice','profit','margin']) document.getElementById(id).textContent = '—';
      status.textContent = 'الأرقام أكبر من نطاق الحساب. راجع المدخلات وحاول تاني.';
      return;
    }
    document.getElementById('totalCost').textContent = money.format(total);
    document.getElementById('salePrice').textContent = money.format(sale);
    document.getElementById('profit').textContent = money.format(profit);
    document.getElementById('margin').textContent = percent.format(margin) + '٪';
    status.textContent = 'تم الحساب. دي نتيجة حسابية وليست توصية سعر سوق؛ راجع الضرائب والطلب والمصاريف الفعلية قبل اعتماد السعر.';
  });
})();
