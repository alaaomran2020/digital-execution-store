import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const expected = {
  "brand-identity.webp": "1f7e58c480bc258a9d195d4fc75ae89f0774ed48caf3c10240673b1ac47fc594",
  "social-media.webp": "07370fe4e8a79fbf7f399ff76bf804c9b8871ad4d724faf3fc63d06b6bb2beff",
  "digital-ads.webp": "3d3f93df219fc7c1d48f0eb38c798210bd1e522a7e6d1522e4dd2337d651eda5",
  "packaging.webp": "c0ef30d75a6004356c031a23d29078caca71e981f0059492e288567f716cd4f0",
  "print-design.webp": "dc1195d545642cc32a55f7f67445fe131a0608f95cd151b44a774c3276dfa0df",
  "presentations.webp": "22b2a8109e0c4c4343e9de7e5af8d83a323e869e363707f92930a992b5f2dead",
  "ecommerce-visuals.webp": "ff72d0c6af40ecbd8100985f53c668a02348bcd64182d03a8fc8e6ea425c29f6",
  "custom-design.webp": "cb5a93c83813aba66f6c72efcb7f10a46b3484132bf032605270cdcdd6f0363b"
};
const html = readFileSync("services/graphic-design/index.html", "utf8");
const pending = [];
for (const [name,sha] of Object.entries(expected)) {
  assert.ok(html.includes("/assets/design-studio/" + name), "Missing reference: " + name);
  const path = "assets/design-studio/" + name;
  if (!existsSync(path)) { pending.push(name); continue; }
  const data = readFileSync(path);
  assert.equal(data.subarray(0,4).toString("latin1"),"RIFF",name+" must be WebP");
  assert.equal(data.subarray(8,12).toString("latin1"),"WEBP",name+" must be WebP");
  assert.equal(createHash("sha256").update(data).digest("hex"),sha,name+" must match approved image");
}
if(pending.length){
  console.error("BLOCKED: "+pending.length+" approved design images missing: "+pending.join(", "));
  process.exitCode=1;
}else{
  console.log("PASS: eight approved WebP images present, linked and match SHA256");
}
