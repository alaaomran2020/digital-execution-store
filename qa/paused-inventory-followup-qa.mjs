import assert from 'node:assert/strict';
import fs from 'node:fs';
const guides = ['inventory-counting','inventory-tracking-template','reorder-point','safety-stock','slow-moving-inventory','stockout-prevention'];
assert.equal(JSON.parse(fs.readFileSync('data/storefront-mode.json','utf8')).productsVisible,false);
for (const slug of guides) {
 const html = fs.readFileSync('guides/'+slug+'/index.html','utf8');
 assert.ok(!/href=["'][^"']*\/products\//.test(html),'Product links must be paused: '+slug);
 assert.ok(!/(guide_product_click|data-product-slug|ReStock Desk|شوف المنتج|\/assets\/restock\/)/.test(html),'Paid promotion must not remain: '+slug);
 assert.ok(html.includes('href="../../tools/inventory-health-check/"'),'Free inventory tool CTA missing: '+slug);
 assert.ok(html.includes('https://digital-execution.cc/assets/social/digital-execution-og.png'),'Neutral social image missing: '+slug);
 assert.ok(html.includes('href="../inventory-management-small-shops/"'),'Relevant inventory guide missing: '+slug);
 assert.ok(!/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html),'Public guide must remain indexable: '+slug);
}
console.log('PASS: '+guides.length+' supporting inventory guides preserve public education and block paused commerce');