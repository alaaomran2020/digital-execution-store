/* Local, progressive catalogue filtering for tools and the knowledge directory. */
(() => {
  'use strict';
  const controls = document.querySelector('[data-catalog-controls]');
  if (!controls) return;
  const search = controls.querySelector('input[type="search"]');
  const clear = controls.querySelector('[data-catalog-clear]');
  const count = controls.querySelector('[data-catalog-count]');
  const filters = [...controls.querySelectorAll('[data-catalog-filter]')];
  const cards = [...document.querySelectorAll('[data-catalog-item]')];
  const empty = document.querySelector('[data-catalog-empty]');
  let category = 'all';
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ar').replace(/[\u064b-\u065f\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');
  const indexed = cards.map(card => ({card, text: normalize(card.textContent)}));
  function update() {
    const query = normalize(search.value.trim());
    const words = query.split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const {card, text} of indexed) {
      card.hidden = (category !== 'all' && card.dataset.category !== category) || !words.every(word => text.includes(word));
      if (!card.hidden) shown++;
    }
    for (const filter of filters) filter.setAttribute('aria-pressed', String(filter.dataset.catalogFilter === category));
    clear.hidden = !search.value;
    count.textContent = `عرض ${shown} من ${cards.length}`;
    empty.hidden = shown !== 0;
  }
  search.addEventListener('input', update);
  clear.addEventListener('click', () => { search.value = ''; update(); search.focus(); });
  for (const filter of filters) filter.addEventListener('click', () => { category = filter.dataset.catalogFilter; update(); });
  empty.querySelector('button').addEventListener('click', () => { category = 'all'; search.value = ''; update(); search.focus(); });
  update();
})();
