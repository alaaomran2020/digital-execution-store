// Design Studio project brief helper: runs entirely in the browser.
// Never submits a form, saves personal information, or contacts a server.
(() => {
  "use strict";
  const form = document.getElementById("ds-brief-form");
  if (!form) return;

  const type = document.getElementById("ds-kind");
  const result = document.getElementById("ds-brief-result");
  const preview = document.getElementById("ds-brief-preview");
  const emailLink = document.getElementById("ds-brief-email");
  const copyButton = document.getElementById("ds-brief-copy");
  const status = document.getElementById("ds-brief-status");

  const valueOf = (fields, name) => String(fields.get(name) || "").trim();
  const addIfProvided = (lines, label, value) => {
    if (value) lines.push(label + ": " + value);
  };

  document.querySelectorAll(".ds-card-link[data-design-type]").forEach(link => {
    link.addEventListener("click", () => {
      const option = type.querySelector('option[value="' + link.dataset.designType + '"]');
      if (option) {
        type.value = option.value;
        result.hidden = true;
      }
    });
  });

  // A previously generated brief is no longer current once its fields change.
  form.addEventListener("input", () => { result.hidden = true; });
  form.addEventListener("change", () => { result.hidden = true; });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const project = valueOf(fields, "project");
    const kind = type.selectedOptions[0]?.textContent.trim() || "تصميم جرافيكي";
    const details = valueOf(fields, "details");
    const lines = [
      "موجز طلب تصميم - Digital Execution",
      "",
      "اسم المشروع: " + project,
      "نوع التصميم: " + kind,
      "وصف المطلوب: " + details
    ];
    addIfProvided(lines, "منصات الاستخدام والمقاسات", valueOf(fields, "usage"));
    addIfProvided(lines, "الموعد المتوقع", valueOf(fields, "deadline"));
    addIfProvided(lines, "بريد التواصل", valueOf(fields, "contactEmail"));
    lines.push("", "يرجى التواصل لتحديد نطاق العمل والمخرجات والمدة والتكلفة قبل التنفيذ.");

    const brief = lines.join("\n");
    const subject = "طلب تصميم: " + kind + " - " + project;
    preview.value = brief;
    emailLink.href = "mailto:contact@digital-execution.cc?subject=" +
      encodeURIComponent(subject) + "&body=" + encodeURIComponent(brief);
    result.hidden = false;
    status.textContent = "الموجز جاهز. راجعه ثم افتح البريد، أو انسخه إلى تطبيق التواصل المناسب.";
    preview.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: "auto", block: "nearest" });
  });

  copyButton.addEventListener("click", async () => {
    const brief = preview.value;
    if (!brief) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(brief);
      status.textContent = "تم نسخ الموجز. يمكنك لصقه في رسالة إلى contact@digital-execution.cc.";
    } catch {
      preview.focus();
      preview.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch { /* May be disallowed */ }
      status.textContent = copied
        ? "تم نسخ الموجز. يمكنك لصقه في رسالة بريد."
        : "تم تحديد النص. انسخه يدويًا وأرسله إلى contact@digital-execution.cc.";
    }
  });
})();
