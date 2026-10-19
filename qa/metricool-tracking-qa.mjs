import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import vm from "node:vm";

const read = file => fs.readFileSync(file, "utf8");
const pages = [];
const standalone = new Set([
  "services/graphic-design/index.html"
]);
function walk(dir, result) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const f = path.posix.join(dir,e.name);
    if (e.isDirectory()) walk(f,result);
    else if (e.isFile() && f.endsWith(".html")) result.push(f);
  }
}
for (const f of ["index.html","404.html","licenses.html","privacy.html","terms.html"]) pages.push(f);
for (const dir of ["guides","services","tools","updates"]) walk(dir,pages);
assert.ok(pages.length >= 40, "Public page list unexpectedly short");
let globalCount = 0, directCount = 0;
for (const f of pages) {
  const html = read(f);
  const hasHeader = /src=["'][^"']*\/?header\.js(?:\?[^"']*)?["']/i.test(html);
  const directRefs = (html.match(/src=["']\/metricool-tracker\.js["']/g) || []).length;
  assert.equal(directRefs, standalone.has(f) ? 1 : 0, "Unexpected tracker tag in " + f);
  assert.ok(hasHeader || directRefs === 1, "Missing tracker in " + f);
  assert.ok(!(hasHeader && directRefs), "Duplicate include in " + f);
  assert.ok(!html.includes("tracker.metricool.com/resources/be.js"), "Vendor script embedded directly in " + f);
  if (hasHeader) globalCount++; else directCount++;
}
assert.equal(directCount, standalone.size, "Unexpected uncovered public page");
for (const f of ["resources/index.html", "resources/ai-tools/index.html", "resources/prompts/index.html"]) {
  assert.ok(!read(f).includes("/metricool-tracker.js"), "Free offline draft must not load third-party tracking: " + f);
}
const header = read("header.js");
assert.equal(header.split("/* Digital Execution Metricool tracker bootstrap */").length-1,1,"Missing or duplicate bootstrap");
assert.ok(header.includes("data-de-metricool-loader"),"No bootstrap dedupe");
assert.ok(header.includes("(?:products|after-purchase|operations)"),"Non-public route guard missing");
for (const dir of ["products","after-purchase","operations"]) {
  const restricted = [];
  if (fs.existsSync(dir)) walk(dir,restricted);
  for (const f of restricted)
    assert.ok(!read(f).includes("/metricool-tracker.js"),"Direct tracking on restricted page: " + f);
}
const wrapper = read("metricool-tracker.js");
assert.equal((wrapper.match(/beTracker\.t\(/g)||[]).length,1,"Duplicate tracking beacon");
assert.ok(wrapper.includes("window.__deMetricoolTrackerLoaded"),"Missing one-time guard");
assert.ok(!/localStorage|sessionStorage|document\.cookie|querySelectorAll|fetch\(/.test(wrapper),"Unexpected data access");
assert.ok(wrapper.includes("fd4d6a7225d8d2f128c7235b058ec2b"),"Unexpected brand hash");
assert.ok(Buffer.byteLength(wrapper) < 1200,"Loader > 1.2 KB local performance budget");
const marker = "/* Digital Execution Metricool tracker bootstrap */";
assert.ok(Buffer.byteLength(header.slice(header.indexOf(marker))) < 750,"Bootstrap > 750 byte budget");
const policy = read("privacy.html");
assert.ok(policy.includes("metricool-privacy-disclosure") && policy.includes("عنوان IP") && policy.includes("Cookies"),"Disclosure incomplete");
assert.ok(read("index.html").includes("مدخلات الحاسبة بتفضل عندك"),"Calculator privacy hint ambiguous");
assert.equal(JSON.parse(read("data/storefront-mode.json")).productsVisible,false,"Hidden products were made visible");

function bootstrapsAt(pagePath) {
  const tags = [];
  const document = {
    readyState: "loading",
    addEventListener() {},
    querySelector(selector) {
      if (selector !== "script[data-de-metricool-loader]") return null;
      return tags.find(tag => Object.hasOwn(tag.attributes, "data-de-metricool-loader")) || null;
    },
    createElement() {
      return { attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
    },
    head: { appendChild(tag) { tags.push(tag); } }
  };
  const sandbox = { document, location: { pathname: pagePath } };
  vm.runInNewContext(header, sandbox, { timeout: 1000 });
  vm.runInNewContext(header, sandbox, { timeout: 1000 });
  return tags;
}
for (const pagePath of ["/", "/tools/", "/guides/inventory-management-small-shops/"]) {
  const tags = bootstrapsAt(pagePath);
  assert.equal(tags.length, 1, "Unexpected number of analytics loaders at " + pagePath);
  assert.equal(tags[0].src, "/metricool-tracker.js");
  assert.equal(tags[0].async, true);
}
for (const pagePath of ["/products/", "/products/restock-desk/", "/after-purchase/business/", "/operations/"]) {
  assert.equal(bootstrapsAt(pagePath).length, 0, "Disallowed analytics bootstrap on " + pagePath);
}
{
  const tags = [], beacons = [];
  const sandbox = {
    window: { beTracker: { t: detail => beacons.push(detail) } },
    document: {
      createElement() { return {}; },
      head: { appendChild(tag) { tags.push(tag); } }
    }
  };
  vm.runInNewContext(wrapper, sandbox, { timeout: 1000 });
  vm.runInNewContext(wrapper, sandbox, { timeout: 1000 });
  assert.equal(tags.length, 1, "Third-party script must load only once");
  assert.equal(tags[0].src, "https://tracker.metricool.com/resources/be.js");
  assert.equal(tags[0].async, true);
  tags[0].onload();
  assert.equal(beacons.length, 1, "Only one pageview should be generated");
  assert.equal(beacons[0].hash, "fd4d6a7225d8d2f128c7235b058ec2b");
}

console.log("PASS Metricool QA: "+pages.length+" public pages, "+globalCount+" via shared header, "+directCount+" standalone; privacy, exclusions, dedupe, size guard");
