// Static-only link and asset audit against the exact isolated Pages build output.
// Does not send requests, crawl external services, or alter storefront content.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve('dist-staging');
assert.ok(fs.existsSync(path.join(root, 'staging-build.json')), 'Build staging before running link integrity QA');
const errors = [];
let pages = 0, references = 0, images = 0, cssFiles = 0;

function walk(dir) {
  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...walk(file));
    else if (item.isFile()) out.push(file);
  }
  return out;
}

function checkReference(raw, source, label) {
  const link = raw.trim();
  if (!link) { errors.push(`${source}: empty ${label}`); return; }
  if (/^javascript:/i.test(link)) { errors.push(`${source}: unsafe javascript: ${label}`); return; }
  if (/^(?:https?:|mailto:|tel:|sms:|data:|blob:|about:|#|\/\/)/i.test(link)) return;
  const pathname = link.split(/[?#]/)[0];
  if (!pathname) return;
  if (pathname.includes('\\')) { errors.push(`${source}: backslash in URL ${link}`); return; }
  const urlPath = pathname.startsWith('/')
    ? path.posix.normalize(pathname)
    : path.posix.normalize(path.posix.join(path.posix.dirname('/' + source), pathname));
  const route = pathname.endsWith('/') || urlPath === '/' ? path.posix.join(urlPath, 'index.html') : urlPath;
  const absolute = path.resolve(root, '.' + route);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    errors.push(`${source}: URL escapes build root ${link}`); return;
  }
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    errors.push(`${source}: broken ${label} ${link} -> ${route}`);
  }
}

for (const file of walk(root)) {
  const source = path.relative(root, file).split(path.sep).join('/');
  if (source.endsWith('.html')) {
    pages++;
    const html = fs.readFileSync(file, 'utf8');
    const attrs = /\b(?:href|src|poster)\s*=\s*(["'])(.*?)\1/gi;
    for (const match of html.matchAll(attrs)) {
      references++;
      checkReference(match[2], source, 'HTML reference');
    }
    for (const match of html.matchAll(/\bhref\s*=\s*(["'])#([^#"']+)\1/gi)) {
      const fragment = decodeURIComponent(match[2]);
      if (!html.includes(`id="${fragment}"`) && !html.includes(`id='${fragment}'`)) {
        errors.push(`${source}: missing in-page anchor #${fragment}`);
      }
    }
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      images++;
      if (!/\balt\s*=\s*(["']).*?\1/i.test(match[0])) errors.push(`${source}: image without alt attribute`);
    }
    for (const match of html.matchAll(/<a\b[^>]*\btarget\s*=\s*(["'])_blank\1[^>]*>/gi)) {
      if (!/\brel\s*=\s*(["'])[^"']*\bnoopener\b[^"']*\1/i.test(match[0])) errors.push(`${source}: target=_blank anchor missing rel=noopener`);
    }
  } else if (source.endsWith('.css')) {
    cssFiles++;
    const css = fs.readFileSync(file, 'utf8');
    for (const match of css.matchAll(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi)) {
      references++;
      checkReference(match[2], source, 'CSS url');
    }
  }
}
if (errors.length) {
  for (const e of errors) console.error('FAIL ' + e);
  console.error(`FAIL: ${errors.length} static integrity issues in ${pages} pages, ${cssFiles} CSS files`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${pages} HTML pages, ${cssFiles} CSS files, ${references} local/external references, ${images} images inspected`);
}
