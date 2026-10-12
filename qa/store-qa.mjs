// Match local QA behavior to the storefront mode selected in CI.
// Full commercial checks remain in store-qa-full.mjs for future restoration.
import { readFileSync } from "node:fs";
const mode = JSON.parse(readFileSync("data/storefront-mode.json", "utf8"));
if (mode.productsVisible === false) {
  console.log("Store QA: paused products; checking safe public placeholders.");
  await import("./storefront-paused-qa.mjs");
} else {
  console.log("Store QA: visible products; checking commercial catalog.");
  await import("./store-qa-full.mjs");
}
