/* Metricool analytics — Digital Execution public pageview wrapper */
(() => {
  "use strict";
  if (window.__deMetricoolTrackerLoaded) return;
  window.__deMetricoolTrackerLoaded = true;
  const script = document.createElement("script");
  script.src = "https://tracker.metricool.com/resources/be.js";
  script.async = true;
  script.onload = () => {
    if (window.beTracker && typeof window.beTracker.t === "function")
      window.beTracker.t({ hash: "fd4d6a7225d8d2f128c7235b058ec2b" });
  };
  script.onerror = () => { window.__deMetricoolTrackerLoaded = false; };
  document.head.appendChild(script);
})();
