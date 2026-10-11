// Static concept gallery; no tracking, server calls, uploads or personal data storage.
(() => {
  "use strict";
  const root = document.getElementById("design-gallery");
  const dialog = document.getElementById("ds-gallery-dialog");
  if (!root || !dialog) return;
  const cards = [...root.querySelectorAll(".ds-gallery-card")];
  const buttons = [...root.querySelectorAll("[data-ds-filter]")];
  const count = document.getElementById("ds-gallery-count");
  const art = document.getElementById("ds-gallery-dialog-art");
  const title = document.getElementById("ds-gallery-dialog-title");
  const description = document.getElementById("ds-gallery-dialog-description");
  const type = document.getElementById("ds-kind");
  let selectedCard = null;
  let focusRequestOnClose = false;
  dialog.addEventListener("close", () => {
    if (!focusRequestOnClose) return;
    focusRequestOnClose = false;
    requestAnimationFrame(() => {
      if (!type?.isConnected) return;
      type.focus({ preventScroll: true });
      type.scrollIntoView({ behavior: "auto", block: "center" });
    });
  });
  buttons.forEach(button => button.addEventListener("click", () => {
    const category = button.dataset.dsFilter;
    buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    cards.forEach(card => {
      card.hidden = category !== "all" && card.dataset.galleryCategory !== category;
    });
    count.textContent = "عرض " + cards.filter(card => !card.hidden).length + " من " + cards.length + " نماذج توضيحية";
  }));
  // Keep normal Tab navigation; arrow/Home/End keys offer quicker keyboard filtering.
  buttons.forEach((button, index) => button.addEventListener("keydown", event => {
    const direction = getComputedStyle(button).direction === "rtl" ? -1 : 1;
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + direction + buttons.length) % buttons.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - direction + buttons.length) % buttons.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[nextIndex].focus();
    buttons[nextIndex].click();
  }));
  root.querySelectorAll("[data-gallery-open]").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".ds-gallery-card");
      if (!card || card.hidden || !dialog.showModal) return;
      selectedCard = card;
      art.replaceChildren(card.querySelector(".ds-gallery-art").cloneNode(true));
      title.textContent = card.querySelector("h3").textContent;
      description.textContent = card.querySelector(".ds-gallery-info p").textContent;
      dialog.showModal();
    });
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
