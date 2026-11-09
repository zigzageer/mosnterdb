import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
const assetDir = resolve(dist, 'assets');
const files = await readdir(assetDir);
const jsFile = files.find(f => /^index-.*\.js$/.test(f));
const cssFile = files.find(f => /^index-.*\.css$/.test(f));
if (!jsFile || !cssFile) throw new Error('Run npm run build first.');
const images = {};
for (const name of await readdir(resolve(root, 'public/cans'))) {
  const mime = extname(name) === '.png' ? 'image/png' : extname(name) === '.jpg' ? 'image/jpeg' : 'image/webp';
  images[name] = `data:${mime};base64,${(await readFile(resolve(root, 'public/cans', name))).toString('base64')}`;
}
let js = await readFile(resolve(assetDir, jsFile), 'utf8');
const imageExpression = /`(?:\.\/|\/)cans\/\$\{([A-Za-z_$][\w$]*)\}`/g;
let imageReplacements = 0;
js = js.replace(imageExpression, (_, name) => { imageReplacements++; return `window.__monsterImages[${name}]`; });
if (imageReplacements !== 1) throw new Error(`Unexpected can path format: ${imageReplacements} replacements`);
// Script contents are trusted build output; escaping protects HTML's script delimiter.
js = js.replace(/<\/script/gi, '<\\/script');
let css = await readFile(resolve(assetDir, cssFile), 'utf8');
const matches = [...css.matchAll(/url\(([^)]+)\)/g)];
for (const match of matches) {
  const path = match[1].replace(/^["']|["']$/g, '');
  if (path.startsWith('data:')) continue;
  const name = path.split('/').at(-1);
  if (!/\.woff2?$/.test(name)) throw new Error(`Unexpected CSS asset: ${name}`);
  const bytes = await readFile(resolve(assetDir, name));
  const mime = name.endsWith('.woff2') ? 'font/woff2' : 'font/woff';
  css = css.replaceAll(match[0], `url(data:${mime};base64,${bytes.toString('base64')})`);
}
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#050505"><meta name="color-scheme" content="dark"><title>MonsterDB — The Can Archive</title><style>${css}</style></head><body><div id="app"></div><script>window.__monsterImages=${JSON.stringify(images)};\n${js}</script></body></html>`;
await writeFile(resolve(root, 'MonsterDB.html'), html);
console.log(`Created MonsterDB.html (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB). Open directly in a browser; no server required.`);
