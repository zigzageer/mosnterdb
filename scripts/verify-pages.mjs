import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { catalog } from '../src/catalog.js';

const docs = fileURLToPath(new URL('../docs/', import.meta.url));
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff':'font/woff', '.woff2':'font/woff2' };
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!pathname.startsWith('/mosnterdb/')) { res.writeHead(404).end(); return; }
  const relative = pathname.slice('/mosnterdb/'.length) || 'index.html';
  const file = resolve(docs, relative);
  if (!file.startsWith(docs)) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox'] });
  const page = await browser.newPage({ viewport:{width:1440,height:1000} });
  const errors = [];
  const failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  await page.goto(`http://127.0.0.1:${server.address().port}/mosnterdb/`);
  await page.locator('.can-card').first().waitFor();
  assert.equal(await page.locator('.can-card').count(), catalog.length);
  await page.locator('img').evaluateAll(images => Promise.all(images.map(image => { image.loading='eager'; return image.decode(); })));
  assert.equal(await page.locator('.can-photo').count(), catalog.length);
  await page.getByRole('searchbox').fill('mango');
  assert.equal(await page.locator('.can-card').count(), 2);
  await page.getByRole('button', { name:'Add Mango Loco to collection', exact:true }).click();
  await page.getByRole('button', { name:'Mark Mango Loco as tried', exact:true }).click();
  await page.getByRole('button', { name:'Rate Mango Loco 5 out of 5 stars', exact:true }).click();
  await page.reload();
  await page.getByRole('button', { name:'My collection', exact:false }).click();
  assert.equal(await page.locator('.can-card').count(), 1);
  assert.equal(await page.locator('.can-label h2').textContent(), 'Mango Loco');
  assert.equal(await page.getByRole('button', {name:'Rate Mango Loco 5 out of 5 stars',exact:true}).getAttribute('aria-pressed'),'true');
  // The collection has its own shelf header; the share card lives with the tried list.
  await page.getByRole('button', { name:'My tried list', exact:false }).click();
  assert.equal(await page.locator('.can-card').count(), 1);
  await page.locator('#tracker-panel [data-open-share]').click();
  await page.locator('#download-png').waitFor();
  await page.waitForFunction(() => !document.querySelector('#download-png').disabled);
  assert.equal(await page.locator('#share-canvas').getAttribute('width'),'1080');
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  console.log('PASS: GitHub Pages /mosnterdb/ loads all catalog photos, fonts, search, saved collections, tried tracking, persistent ratings and PNG export with no browser or HTTP errors.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
