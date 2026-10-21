// Non-mutating HTTPS check of the public site from a GitHub-hosted runner.
// No Search Console credentials, user data, tracking or external packages.
import assert from "node:assert/strict";

const ORIGIN = "https://digital-execution.cc";
const results = [];
let failures = 0;

async function load(path) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(ORIGIN + path, {
        headers: {
          "accept": "text/html,application/xml,text/plain;q=0.9,*/*;q=0.5",
          "user-agent": "DigitalExecution-Public-SEO-Smoke/1.0"
        },
        signal: AbortSignal.timeout(15000),
        redirect: "follow"
      });
      const text = await response.text();
      return {
        status: response.status,
        url: response.url,
        type: response.headers.get("content-type") || "",
        ray: response.headers.get("cf-ray") || "",
        text
      };
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

async function check(path, inspect) {
  try {
    const response = await load(path);
    const challenge = /cf-chl|challenge-platform|just a moment|checking your browser/i.test(response.text.slice(0, 4000));
    const verdict = inspect(response);
    const ok = response.status === 200 && !challenge && response.url.startsWith(ORIGIN + "/") && verdict === true;
    results.push({path, status: response.status, type: response.type, ray: response.ray, ok, finalURL: response.url});
    if (!ok) {
      failures++;
      console.error("FAIL " + path + ": HTTP " + response.status + "; cloudflareChallenge=" + challenge +
        "; responseType=" + response.type + "; finalURL=" + response.url +
        "; cfRay=" + (response.ray || "none") + "; contentCheck=" + verdict);
    } else {
      console.log("PASS " + path + " HTTP 200; " + response.type);
    }
  } catch (error) {
    failures++;
    results.push({path, error: String(error), ok: false});
    console.error("FAIL " + path + ": " + String(error));
  }
}

const canonical = (html, route) =>
  html.includes('rel="canonical" href="' + ORIGIN + route + '"') ||
  html.includes('href="' + ORIGIN + route + '" rel="canonical"');

await check("/robots.txt", r =>
  /user-agent:\\s*\\*/i.test(r.text) &&
  r.text.includes("Sitemap: " + ORIGIN + "/sitemap.xml") &&
  !/^Disallow:\\s*\\/\\s*$/im.test(r.text)
);
await check("/sitemap.xml", r => {
  const locs = [...r.text.matchAll(/<loc>\\s*([^<]+)\\s*<\\/loc>/gi)].map(x => x[1]);
  return locs.length >= 40 &&
    new Set(locs).size === locs.length &&
    locs.includes(ORIGIN + "/guides/") &&
    !locs.some(x => x.startsWith(ORIGIN + "/products/"));
});
await check("/", r =>
  /<h1\\b/i.test(r.text) &&
  r.text.includes('"@type": "Organization"') &&
  r.text.includes('"@type": "WebSite"') &&
  canonical(r.text, "/")
);
await check("/tools/pricing-calculator/", r =>
  r.text.includes('id="pricingForm"') &&
  r.text.includes('id="pricing-example"') &&
  canonical(r.text, "/tools/pricing-calculator/")
);
await check("/tools/break-even-calculator/", r =>
  r.text.includes('id="breakEvenForm"') &&
  r.text.includes('id="break-even-example"') &&
  canonical(r.text, "/tools/break-even-calculator/")
);
await check("/guides/", r =>
  /<h1\\b/i.test(r.text) && canonical(r.text, "/guides/")
);
await check("/services/graphic-design/", r =>
  r.text.includes('id="ds-brief-form"') &&
  canonical(r.text, "/services/graphic-design/")
);
await check("/updates/", r =>
  /<h1\\b/i.test(r.text) && canonical(r.text, "/updates/")
);
await check("/products/", r => {
  const robotsTag = (r.text.match(/<meta\\b[^>]*name=["']robots["'][^>]*>/i) || [""])[0];
  return /noindex/i.test(robotsTag) && !r.text.includes('data-product-offer="active"');
});

console.log("LIVE SEO SUMMARY: " + results.length + " checked; " + failures + " failures");
if (failures) {
  console.error("This is public HTTP evidence, not a Google Search Console indexing result.");
  process.exitCode = 1;
} else {
  console.log("PASS live crawlability smoke; Search Console indexing still requires separate verification");
}
