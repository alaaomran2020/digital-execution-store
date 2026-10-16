# Approved design-studio photo previews

The eight WebP files from the generated Digital Execution design image pack must be copied from images/ directory into assets/design-studio/ preserving the exact filenames:
brand-identity.webp, social-media.webp, digital-ads.webp, packaging.webp, print-design.webp, presentations.webp, ecommerce-visuals.webp, custom-design.webp.

Only eight landscape files are needed for first storefront integration. The portrait files remain in the downloadable pack. No API, extra package, external hosted image service or subscription is required.

Run: node qa/design-studio-images-qa.mjs
Verify PASS before requesting merge. The test compares local assets against approved SHA-256 to prevent accidentally using different images.

The page retains original CSS previews as safe fallbacks until each image loads. Do not merge or deploy while image test remains blocked.

## Final image integration
The eight original approved WebP previews are now checked into assets/design-studio/ as individual files, with their checksums protected by Store QA. The unextracted public ZIP is removed from the repository by this fix. The original CSS previews remain as a graceful visual fallback if an image cannot load.
