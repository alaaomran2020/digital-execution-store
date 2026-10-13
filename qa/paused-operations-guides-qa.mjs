import assert from 'node:assert/strict';
import fs from 'node:fs';
const targets = {"accounting-workflow-small-business":"/tools/break-even-calculator/","agricultural-season-cost-profit":"/tools/break-even-calculator/","clinic-appointments-collections":"/guides/","construction-project-control":"/guides/","freelancer-management":"/guides/professional-services-office-workflow/","graphic-designer-project-workflow":"/services/graphic-design/","law-office-case-management":"/guides/","online-orders-inventory":"/tools/inventory-health-check/","professional-services-office-workflow":"/guides/freelancer-management/","teacher-students-collections":"/guides/"};
assert.equal(JSON.parse(fs.readFileSync('data/storefront-mode.json','utf8')).productsVisible,false);
for(const [slug,target] of Object.entries(targets)) {
 const html=fs.readFileSync('guides/'+slug+'/index.html','utf8');
 assert.ok(html.includes('<link rel="canonical" href="https://digital-execution.cc/guides/'+slug+'/">'),'Canonical missing: '+slug);
 assert.ok(!/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html),'Accidentally noindex guide: '+slug);
 assert.ok(html.includes('href="'+target+'"'),'Contextual internal link absent: '+slug);
 assert.ok(!/href=["'][^"']*\/products\//.test(html),'Paused paid commerce link: '+slug);
 assert.ok(!/(guide_product_click|data-product-slug|data-guide-product|صفحة الباكدج|صفحة المنتج المرتبطة)/.test(html),'Product CTA/metadata remains: '+slug);
 assert.ok(html.includes('href="/guides/"') || html.includes('href="/guides/'),'No public learning directory link: '+slug);
}
console.log('PASS: '+Object.keys(targets).length+' indexable operating guides link to real free guidance, no paid commerce');
