// Read-only SEO/GEO/AEO regression audit for the EXISTING GitHub Pages site.
// Strict on established public entry points and paused-product privacy;
// informational warnings expose broader debt without breaking unrelated work.
// Offline, dependency-free, no network calls or GSC credentials.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const ORIGIN = "https://digital-execution.cc";
const root = process.cwd();
const hard = [];
const warnings = [];
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const exists = p => fs.existsSync(path.join(root, p));
const requireCheck = (ok, why) => { if (!ok) hard.push(why); };
const note = (ok, why) => { if (!ok) warnings.push(why); };
const metaTag = (html, name) => {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  return tags.find(tag => new RegExp('\\bname\\s*=\\s*["\\\']' + name + '["\\\']', "i").test(tag)) || "";
};
const isNoindex = html => /\bnoindex\b/i.test(metaTag(html, "robots"));
const h1Count = html => (html.match(/<h1\b/gi) || []).length;
const canonical = html => {
  const tag = (html.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i) || [])[0] || "";
  return (tag.match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1] || "";
};
const docPath = pathname => {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes("..") || !decoded.startsWith("/")) return "";
  return decoded === "/" ? "index.html" : (decoded.endsWith("/") ? decoded.slice(1) + "index.html" : decoded.slice(1));
};
const robots = read("robots.txt");
requireCheck(/User-agent:\s*\*/i.test(robots), "robots.txt: User-agent * missing");
requireCheck(!/^Disallow:\s*\/\s*$/im.test(robots), "robots.txt: disallows entire site");
requireCheck(!/^Disallow:\s*\/(?:tools|services|guides)\/\s*$/im.test(robots), "robots.txt: blocks an active section");
requireCheck(/Sitemap:\s*https:\/\/digital-execution\.cc\/sitemap\.xml/i.test(robots), "robots.txt: canonical Sitemap missing");
requireCheck(/Allow:\s*\/products\//i.test(robots), "robots.txt: paused products must be crawlable so their noindex can be read");

const paused = JSON.parse(read("data/storefront-mode.json")).productsVisible === false;
requireCheck(paused, "Safety policy changed: commercial products are no longer paused");
for (const file of ["404.html", "products/index.html"]) {
  requireCheck(exists(file) && isNoindex(read(file)), file + ": intentional noindex removed");
}

const xml = read("sitemap.xml");
const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1]);
requireCheck(locs.length >= 25, "sitemap.xml: unexpected number of URLs");
requireCheck(new Set(locs).size === locs.length, "sitemap.xml: duplicate URLs");
requireCheck(locs.includes(ORIGIN + "/guides/"), "Indexable /guides/ hub missing from sitemap");
const files = [];
for (const loc of locs) {
  let u;
  try { u = new URL(loc); } catch { hard.push("Invalid sitemap URL: " + loc); continue; }
  requireCheck(u.origin === ORIGIN && !u.search && !u.hash, "Noncanonical sitemap URL: " + loc);
  requireCheck(!u.pathname.startsWith("/products/"), "Paused product in sitemap: " + loc);
  const file = docPath(u.pathname);
  if (!file || !exists(file)) { hard.push("Sitemap URL has no local HTML file: " + loc); continue; }
  files.push({ file, loc, html: read(file) });
}

const criticalHubs = [
  ["index.html", "/"], ["tools/index.html", "/tools/"],
  ["guides/index.html", "/guides/"], ["services/index.html", "/services/"],
  ["services/graphic-design/index.html", "/services/graphic-design/"]
];
for (const [file, route] of criticalHubs) {
  requireCheck(exists(file), "Public section missing: " + file);
  if (!exists(file)) continue;
  const html = read(file);
  requireCheck(!isNoindex(html), "Public section accidentally noindexed: " + file);
  requireCheck(/<title>[^<]+<\/title>/i.test(html), "Missing title: " + file);
  const desc = metaTag(html, "description");
  requireCheck(desc.length > 0 && /\bcontent\s*=\s*["'][^"']+["']/i.test(desc), "Missing meta description: " + file);
  requireCheck(h1Count(html) === 1, "Expected one static H1: " + file);
  requireCheck(canonical(html) === ORIGIN + route, "Wrong canonical: " + file);
  requireCheck(locs.includes(ORIGIN + route), "Public section absent from sitemap: " + route);
}

const home = read("index.html");
const homeSchemas = [...home.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
requireCheck(homeSchemas.length > 0, "Homepage has no static Organization/WebSite JSON-LD");
for (const match of homeSchemas) {
  try {
    const parsed = JSON.parse(match[1]);
    const nodes = parsed["@graph"] || [parsed];
    requireCheck(nodes.some(x => x["@type"] === "Organization" && x.name === "Digital Execution"), "Organization identity missing/changed");
    requireCheck(nodes.some(x => x["@type"] === "WebSite" && x.url === ORIGIN + "/"), "WebSite identity missing/changed");
  } catch { hard.push("Homepage JSON-LD is not valid JSON"); }
}

for (const { file, loc, html } of files) {
  note(!isNoindex(html), "Sitemap lists noindex page: " + file);
  note(!!canonical(html), "Canonical missing on sitemap page: " + file);
  note(h1Count(html) === 1, "H1 count=" + h1Count(html) + ": " + file);
  note(!!metaTag(html, "description"), "Meta description missing: " + file);
  for (const script of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(script[1]); } catch { warnings.push("Invalid JSON-LD: " + file); }
  }
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    note(/\balt\s*=\s*["'][^"']*["']/i.test(tag), "Image missing alt: " + file);
    note(/\bwidth\s*=\s*["']?\d+/i.test(tag) && /\bheight\s*=\s*["']?\d+/i.test(tag), "Image missing dimensions (CLS risk): " + file);
  }
  // Anchor destinations are checked only for local, static URLs; external and
  // dynamic routes require manual/browser checks. Warnings avoid false blockers.
  for (const a of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    const href = a[2].replace(/&amp;/g, "&").trim();
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    try {
      const target = new URL(href, loc);
      if (target.origin !== ORIGIN) continue;
      const dest = docPath(target.pathname);
      note(!!dest && exists(dest), "Unresolved local link: " + file + " -> " + target.pathname);
    } catch { warnings.push("Invalid href: " + file); }
  }
}
console.log("SEO visibility: " + locs.length + " sitemap URLs; " + criticalHubs.length + " public hubs checked; " + hard.length + " blockers; " + warnings.length + " advisory findings");
for (const w of warnings.slice(0, 25)) console.warn("ADVISORY " + w);
if (warnings.length > 25) console.warn("ADVISORY ... " + (warnings.length - 25) + " additional (see comprehensive review)");
for (const e of hard) console.error("FAIL " + e);
assert.equal(hard.length, 0, "SEO visibility regression checks failed");
console.log("PASS SEO visibility critical checks (commercial noindex preserved)");
