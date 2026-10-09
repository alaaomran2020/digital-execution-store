// Regression checks for independent public sections. Runs offline; no production access.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const exists=file=>fs.existsSync(path.join(root,file));
const routes=["tools/","services/","services/graphic-design/"];
let checks=0;
for(const route of routes){
  const file=route+"index.html";
  assert.ok(exists(file),"missing standalone route "+file); checks++;
  const html=read(file);
  assert.match(html,/<html[^>]+lang="ar"[^>]+dir="rtl"/);
  assert.ok(html.includes('href="https://digital-execution.cc/'+route+'"'),"canonical missing for "+route); checks++;
  assert.ok(html.includes('href="/sections.css"'),"shared section styling missing: "+route); checks++;
  assert.ok(html.includes('src="/header.js?'),"global navigation missing: "+route); checks++;
  assert.ok(html.includes('src="/footer.js?'),"global footer missing: "+route); checks++;
  assert.ok(read("sitemap.xml").includes("<loc>https://digital-execution.cc/"+route+"</loc>"),"sitemap entry missing: "+route); checks++;
}
for(const route of ["/products/","/tools/","/services/"]){
  assert.ok(read("header.js").includes('href="'+route+'"'),"shared nav route missing: "+route);checks++;
  assert.ok(read("index.html").includes('href="'+route+'"'),"homepage department route missing: "+route);checks++;
}
for(const file of ["tools/pricing-calculator/index.html","products/pricing-calculator/index.html","products/graphic-designer-business-os/index.html"]){
  assert.ok(exists(file),"existing free/commercial page must remain separate: "+file);checks++;
}
const toolHub=read("tools/index.html");
for(const tool of ["pricing-calculator","break-even-calculator","inventory-health-check"]){
  const route="tools/"+tool+"/index.html";
  assert.ok(exists(route),"linked tool does not exist: "+route);checks++;
  assert.ok(toolHub.includes('href="/tools/'+tool+'/">'),"hub missing tool "+tool);checks++;
}
assert.ok(read("services/index.html").includes('href="/services/graphic-design/"'));checks++;
assert.ok(read("services/graphic-design/index.html").includes('mailto:contact@digital-execution.cc'));checks++;
console.log("PASS "+checks+" independent department checks; no production deployment");
