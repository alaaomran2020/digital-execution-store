(() => {
  'use strict';
  const filters = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.ds-work-card')];
  const status = document.querySelector('#ds-filter-status');
  for (const button of filters) {
    button.addEventListener('click', () => {
      for (const filter of filters) filter.setAttribute('aria-pressed', String(filter === button));
      for (const card of cards) card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      status.textContent = `${cards.filter(card => !card.hidden).length} نماذج معروضة`;
    });
  }
  const dialog = document.querySelector('.ds-preview-dialog');
  const image = document.querySelector('#ds-dialog-image');
  const title = document.querySelector('#ds-dialog-title');
  for (const button of document.querySelectorAll('[data-preview]')) {
    button.addEventListener('click', () => {
      const thumbnail = button.querySelector('img');
      image.src = thumbnail.src;
      image.alt = thumbnail.alt;
      title.textContent = button.closest('article').querySelector('h3').textContent;
      dialog.showModal();
    });
  }
  document.querySelector('.ds-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  for (const link of document.querySelectorAll('[data-service]')) {
    link.addEventListener('click', () => {
      document.querySelector('#brief-service').value = link.dataset.service;
    });
  }
  const form = document.querySelector('#ds-brief-form');
  const copy = document.querySelector('#ds-brief-copy');
  const copyStatus = document.querySelector('#ds-copy-status');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = new FormData(form);
    const body = `مرحبًا فريق Digital Execution،\n\nاسم المشروع: ${values.get('project').trim()}\nنوع التصميم: ${values.get('service')}\n\nتفاصيل المشروع:\n${values.get('details').trim()}\n\nأرغب في مناقشة النطاق والمخرجات والتكلفة والمدة قبل التنفيذ.`;
    copy.value = body;
    copyStatus.textContent = '';
    document.querySelector('#ds-send-email').href = `mailto:contact@digital-execution.cc?subject=${encodeURIComponent('طلب تصميم — ' + values.get('service'))}&body=${encodeURIComponent(body)}`;
    document.querySelector('#ds-brief-result').hidden = false;
    document.querySelector('#ds-send-email').focus();
  });
  document.querySelector('#ds-copy-brief').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copy.value);
      copyStatus.textContent = 'تم نسخ الموجز. أرسله إلى بريد الاستوديو.';
    } catch {
      copy.focus();
      copy.select();
      copyStatus.textContent = 'حددنا لك الموجز؛ انسخه وأرسله عبر البريد الإلكتروني.';
    }
  });
})();
