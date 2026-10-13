// Reviewed, explicit public file list for the isolated Cloudflare Pages STAGING bundle.
// Updating the source tree cannot implicitly publish a new file or product preview.
// Review additions in a separate PR before making them part of this list.
const rootFiles = [
  '_headers', '404.html', 'index.html', 'licenses.html', 'privacy.html',
  'terms.html', 'robots.txt', 'sitemap.xml', 'favicon.ico',
  'brand.css', 'footer.css', 'footer.js', 'global-visual.css',
  'header.css', 'header.js', 'script.js', 'sections.css',
  'storefront-premium.css', 'styles.css'
];

const guideSlugs = [
  'accounting-workflow-small-business', 'agricultural-season-cost-profit',
  'ats-cv-arabic', 'ats-keywords', 'clinic-appointments-collections',
  'construction-project-control', 'cover-letter-guide', 'cv-achievements',
  'cv-experienced', 'cv-fresh-graduates', 'cv-skills',
  'cv-summary-examples', 'freelancer-management',
  'graphic-designer-project-workflow', 'inventory-counting',
  'pricing-with-fees', 'markup-vs-margin', 'break-even-examples',
  'brand-identity-brief',
  'inventory-management-mistakes', 'inventory-management-small-shops',
  'inventory-tracking-template', 'law-office-case-management',
  'linkedin-profile-job-search', 'online-orders-inventory',
  'professional-services-office-workflow', 'reorder-point', 'safety-stock',
  'slow-moving-inventory', 'star-interview', 'stockout-prevention',
  'supplier-order-planning', 'teacher-students-collections'
];

const pausedProductSlugs = [
  'accountant-professional-toolkit', 'agricultural-engineer-toolkit',
  'boq-manager', 'break-even-calculator', 'business-bundle',
  'business-control-pack', 'career-kit', 'civil-engineer-toolkit',
  'civil-quantity-takeoff', 'clinic-medical-center-os',
  'customer-sales-tracker', 'expense-profit-tracker',
  'freelancer-business-os', 'graphic-designer-business-os',
  'lawyer-professional-toolkit', 'material-procurement-tracker',
  'payment-certificates', 'pricing-calculator',
  'professional-services-office-os', 'restock-desk', 'site-daily-report',
  'social-seller-ecommerce-os', 'teacher-professional-toolkit',
  'technical-office-toolkit'
];

// Product paths are ONLY their harmless noindex pause notices; no media, offers,
// checkout code, product scripts or catalog/registry metadata is permitted.
export const STAGING_PUBLIC_FILES = Object.freeze([
  ...rootFiles,
  'favicon/favicon.svg',
  'assets/brand/logo-horizontal-dark.svg',
  'assets/brand/logo-horizontal.svg',
  'assets/brand/logo-mark.svg',
  'assets/brand/logo-monochrome.svg',
  'assets/social/digital-execution-og.png',
  'guides/index.html',
  ...guideSlugs.map(slug => `guides/${slug}/index.html`),
  'products/index.html',
  ...pausedProductSlugs.map(slug => `products/${slug}/index.html`),
  'services/index.html',
  'services/graphic-design/index.html',
  'services/graphic-design/studio.css',
  'services/graphic-design/gallery.js',
  'services/graphic-design/brief.js',
  'tools/index.html',
  'tools/break-even-calculator/index.html',
  'tools/break-even-calculator/break-even.css',
  'tools/break-even-calculator/break-even.js',
  'tools/career-cv-studio/index.html',
  'tools/career-cv-studio/app.js',
  'tools/career-cv-studio/styles.css',
  'tools/inventory-health-check/index.html',
  'tools/inventory-health-check/inventory-health-check.css',
  'tools/inventory-health-check/inventory-health-check.js',
  'tools/pricing-calculator/index.html',
  'tools/pricing-calculator/pricing.css',
  'tools/pricing-calculator/pricing.js',
  'updates/index.html'
].sort());

// Intentionally NOT allowed:
// - data/* (the build creates a harmless [] placeholder at /data/products.json)
// - assets/products/*, assets/restock/*, assets/career-kit/* and product social art
// - downloads/*, after-purchase/*, operations/*, analytics/*, growth/*, seo/*
// - QA source, build outputs, .github, archives, private data and CNAME.
