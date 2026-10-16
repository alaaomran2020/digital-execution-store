// Local-only description length guidance. No storage or network requests.
(() => {
  "use strict";
  const field = document.getElementById("ds-details");
  const count = document.getElementById("ds-details-count");
  if (!field || !count) return;
  const limit = field.maxLength;
  if (limit < 1) return;
  const update = () => {
    const remaining = Math.max(0, limit - field.value.length);
    count.textContent = "متبقّي " + remaining + " حرف";
    count.dataset.nearLimit = String(remaining <= 100);
  };
  field.addEventListener("input", update);
  update();
})();
