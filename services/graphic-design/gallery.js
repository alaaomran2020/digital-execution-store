// Static design gallery: no uploads, tracking or storage.
(() => {
  "use strict";
  const root = document.getElementById("design-gallery");
  const dialog = document.getElementById("ds-gallery-dialog");
  if (!root || !dialog) return;
  const cards = [...root.querySelectorAll(".ds-gallery-card")];
  const filters = [...root.querySelectorAll("[data-ds-filter]")];
  const count = document.getElementById("ds-gallery-count");
  const art = document.getElementById("ds-gallery-dialog-art");
  const title = document.getElementById("ds-gallery-dialog-title");
  const description = document.getElementById("ds-gallery-dialog-description");
  const type = document.getElementById("ds-kind");
  const nav = document.createElement("div");
  nav.className = "ds-gallery-filters";
  nav.setAttribute("role", "group");
  nav.setAttribute("aria-label", "التنقل بين نماذج المعرض");
  const button = (id, label) => {
    const element = document.createElement("button");
    element.type = "button";
    element.id = id;
    element.textContent = label;
    return element;
  };
  const previous = button("ds-gallery-prev", "السابق");
  const next = button("ds-gallery-next", "التالي");
  const position = document.createElement("span");
  position.id = "ds-gallery-position";
  position.className = "ds-gallery-count";
  position.setAttribute("role", "status");
  position.setAttribute("aria-live", "polite");
  position.setAttribute("aria-atomic", "true");
  nav.append(previous, position, next);
  dialog.insertBefore(nav, document.getElementById("ds-gallery-request"));

  let selectedCard = null;
  let focusRequestOnClose = false;
  const visible = () => cards.filter(card => !card.hidden);
  const show = card => {
    selectedCard = card;
    art.replaceChildren(card.querySelector(".ds-gallery-art").cloneNode(true));
    title.textContent = card.querySelector("h3").textContent;
    description.textContent = card.querySelector(".ds-gallery-info p").textContent;
    const shown = visible();
    position.textContent = (shown.indexOf(card) + 1) + " من " + shown.length;
    previous.disabled = next.disabled = shown.length < 2;
  };
  const move = step => {
    const shown = visible();
    const index = shown.indexOf(selectedCard);
    if (shown.length > 1 && index >= 0) show(shown[(index + step + shown.length) % shown.length]);
  };
  dialog.addEventListener("close", () => {
    if (!focusRequestOnClose) return;
    focusRequestOnClose = false;
    requestAnimationFrame(() => {
      if (!type?.isConnected) return;
      type.focus({ preventScroll: true });
      type.scrollIntoView({ behavior: "auto", block: "center" });
    });
  });
  filters.forEach(filter => filter.addEventListener("click", () => {
    const category = filter.dataset.dsFilter;
    filters.forEach(item => item.setAttribute("aria-pressed", String(item === filter)));
    cards.forEach(card => { card.hidden = category !== "all" && card.dataset.galleryCategory !== category; });
    count.textContent = "عرض " + visible().length + " من " + cards.length + " نماذج توضيحية";
  }));
  root.querySelectorAll("[data-gallery-open]").forEach(opener => opener.addEventListener("click", () => {
    const card = opener.closest(".ds-gallery-card");
    if (!card || card.hidden || !dialog.showModal) return;
    show(card);
    dialog.showModal();
  }));
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  dialog.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? 1 : -1); // RTL
    }
  });
  document.getElementById("ds-gallery-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  document.getElementById("ds-gallery-request").addEventListener("click", () => {
    if (selectedCard && type) {
      type.value = selectedCard.dataset.designType;
      type.dispatchEvent(new Event("change", { bubbles: true }));
      focusRequestOnClose = true;
    }
    dialog.close();
  });
})();
