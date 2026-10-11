/* Home-only local preview; no network calls, storage, or financial transactions. */
(() => {
  "use strict";
  const costInput = document.getElementById("landing-cost");
  const markupInput = document.getElementById("landing-markup");
  const priceOutput = document.getElementById("landing-price");
  const profitOutput = document.getElementById("landing-profit");
  if (!costInput || !markupInput || !priceOutput || !profitOutput) return;

  const formatter = new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const formatEGP = number => formatter.format(number) + " جنيه";

  function updatePreview() {
    const cost = Number(costInput.value);
    const markup = Number(markupInput.value);
    const valid = costInput.value.trim() !== "" &&
      markupInput.value.trim() !== "" &&
      costInput.validity.valid &&
      markupInput.validity.valid &&
      Number.isFinite(cost) && Number.isFinite(markup) &&
      cost >= 0 && cost <= 1e9 && markup >= 0 && markup <= 1000;

    if (!valid) {
      priceOutput.textContent = "راجع المدخلات";
      profitOutput.textContent = "—";
      return;
    }
    const profit = cost * markup / 100;
    const price = cost + profit;
    priceOutput.textContent = formatEGP(price);
    profitOutput.textContent = formatEGP(profit);
  }

  costInput.addEventListener("input", updatePreview);
  markupInput.addEventListener("input", updatePreview);
  updatePreview();
})();
