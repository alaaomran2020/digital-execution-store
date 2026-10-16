(() => {
  'use strict';
  for (const photo of document.querySelectorAll('.ds-preview-photo')) {
    const container = photo.closest('.ds-preview');
    if (!container) continue;
    const sync = () => container.classList.toggle('ds-has-photo', photo.complete && photo.naturalWidth > 0);
    photo.addEventListener('load', sync, { once: true });
    photo.addEventListener('error', sync, { once: true });
    sync();
  }
})();
