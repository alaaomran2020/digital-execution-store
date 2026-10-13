// A fresh manifest URL for each check prevents a CDN-cached earlier
// staging-build.json from contradicting the current deployment readiness check.
export function stagingManifestUrl(origin, nonce) {
  if (typeof nonce !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(nonce)) {
    throw new TypeError('A unique, safe manifest request nonce is required');
  }
  const url = new URL('/staging-build.json', origin);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.pages.dev')) {
    throw new Error('Manifest may only be requested from HTTPS Cloudflare Pages');
  }
  url.searchParams.set('qa', nonce);
  return url;
}
