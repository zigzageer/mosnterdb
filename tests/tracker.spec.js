import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import jsQR from 'jsqr';
import { catalog } from '../src/catalog.js';
import officialUs from '../src/official-us-index.json' with { type:'json' };
import { TRACKING_IDS, TRACKING_KEY, normalizeProfile, trackingHash, trackingLink, readTrackingHash } from '../src/tracking.js';

const sample = {name:'Alex',tried:['original-green','zero-ultra','ultra-red-white-blue-razz']};
async function seed(page,profile) {
  await page.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:TRACKING_KEY,value:profile});
}

test('tracking links preserve empty, sparse and full selections with stable identities',()=>{
  expect(new Set(TRACKING_IDS).size).toBe(TRACKING_IDS.length);
  expect(catalog.every(can=>TRACKING_IDS.includes(can.id))).toBe(true);
  for(const tried of [[],[TRACKING_IDS.at(-1)],sample.tried,TRACKING_IDS.filter((_,i)=>i%3===0),TRACKING_IDS]) {
    const expected=normalizeProfile({name:'  Zoë  ',tried});
    expect(readTrackingHash(trackingHash({name:'  Zoë  ',tried})).profile).toEqual(expected);
    expect(trackingLink(expected).length).toBeLessThan(250);
  }
  expect(readTrackingHash('#tried=v1.!').error).toBeTruthy();
  expect(readTrackingHash('#tried=v2.AA').error).toBeTruthy();
  expect(readTrackingHash('#catalog')).toBeNull();
});

test('cached official U.S. listing is covered, with distinct Razz and Rehab/Juice products',()=>{
  for(const product of officialUs.products) {
    const can=catalog.find(can=>can.id===product.catalogId);
    expect(can,product.name).toBeTruthy();
    expect(can.image,product.name).toBeTruthy();
  }
  expect(catalog.find(c=>c.id==='ultra-red-white-blue-razz').image).toContain('ultra-red-white-blue-razz');
  expect(catalog.find(c=>c.id==='ultra-red').image).not.toBe(catalog.find(c=>c.id==='ultra-red-white-blue-razz').image);
  expect(catalog.find(c=>c.id==='strawberry-lemonade').family).toBe('Rehab');
  expect(catalog.find(c=>c.id==='juiced-strawberry-lemonade').family).toBe('Juiced');
});

test('tried progress persists, filters remaining cans and keeps collection separate',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Mark Original Green as tried',exact:true}).click();
  await page.getByRole('searchbox').fill('red white blue');
  await expect(page.locator('.can-card')).toHaveCount(1);
  await expect(page.locator('.can-card img')).toHaveJSProperty('complete',true);
  await page.getByRole('button',{name:'Mark Ultra Red White Blue Razz as tried',exact:true}).click();
  await expect(page.locator('.tried-count')).toHaveText('2');
  await expect(page.locator('.collection-count')).toHaveText('0');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','2');
  await page.reload();
  await expect(page.locator('.can-card')).toHaveCount(2);
  await page.getByRole('button',{name:new RegExp(`LEFT TO TRY ${catalog.length-2}`)}).click();
  await expect(page.locator('.can-card')).toHaveCount(catalog.length-2);
  await expect(page.getByRole('button',{name:'View Original Green details',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Mark Zero Ultra as tried',exact:true}).click();
  await expect(page.locator('.can-card')).toHaveCount(catalog.length-3);
  await expect(page.locator('.tried-count')).toHaveText('3');
});

test('shared links preview safely, merge explicitly and restore on another browser',async({page,browser})=>{
  await seed(page,{name:'Mine',tried:['original-green']});
  const hash=trackingHash({name:'Jamie',tried:['mango-loco','ultra-red-white-blue-razz']});
  await page.goto('/'+hash);
  await expect(page.getByText('SHARED TRIED LIST // PREVIEW')).toBeVisible();
  await expect(page.locator('.can-card')).toHaveCount(2);
  await expect(page.locator('#grid [data-tried]').first()).toBeDisabled();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),TRACKING_KEY)).toEqual({name:'Mine',tried:['original-green']});
  await page.locator('#use-shared').click();
  await expect(page.locator('.can-card')).toHaveCount(3);
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).tried,TRACKING_KEY)).toEqual(expect.arrayContaining(['original-green','mango-loco','ultra-red-white-blue-razz']));
  const fresh=await browser.newContext();
  const other=await fresh.newPage();
  await other.goto(new URL('/'+hash,page.url()).href);
  await expect(other.locator('.can-card')).toHaveCount(2);
  await other.locator('#use-shared').click();
  await expect(other.getByText('SHARED TRIED LIST // PREVIEW')).toHaveCount(0);
  await other.getByRole('button',{name:'Mark Mango Loco as not tried',exact:true}).click();
  await expect(other.locator('.can-card')).toHaveCount(1);
  expect(new URL(other.url()).hash).not.toBe(hash);
  await other.reload();
  await expect(other.locator('.can-card')).toHaveCount(1);
  await fresh.close();
});

test('PNG download includes a QR code restoring exactly the selected list',async({page})=>{
  const ratedSample = {...sample,ratings:{'original-green':5,'ultra-red-white-blue-razz':4}};
  await seed(page,ratedSample);
  await page.goto('/');
  await page.locator('#tracker-panel [data-open-share]').click();
  await page.getByLabel('NAME ON YOUR CARD (OPTIONAL)').fill('Riley');
  await expect(page.locator('#download-png')).toBeEnabled({timeout:20000});
  const link=await page.getByLabel('Personal tracking link').inputValue();
  expect(readTrackingHash(new URL(link).hash).profile).toEqual(normalizeProfile({...ratedSample,name:'Riley'}));
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#download-png').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('monsterdb-riley-tried-3.png');
  const bytes=await readFile(await download.path());
  expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  const result=await page.evaluate(async base64=>{
    const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    return {width:canvas.width,height:canvas.height,pixels:[...ctx.getImageData(canvas.width-216,canvas.height-200,172,176).data]};
  },bytes.toString('base64'));
  expect(result.width).toBe(1080);
  expect(result.height).toBeGreaterThanOrEqual(1350);
  expect(jsQR(new Uint8ClampedArray(result.pixels),172,176)?.data).toBe(link);
  await page.getByRole('button',{name:'Close share card'}).click();
  await expect(page.locator('#tracker-panel [data-open-share]')).toBeFocused();
});

test('full catalog PNG generation fits mobile and contains every tried can',async({page})=>{
  await seed(page,{name:'Completionist',tried:TRACKING_IDS});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.locator('#tracker-panel [data-open-share]').click();
  await expect(page.locator('#download-png')).toBeEnabled({timeout:25000});
  await expect(page.locator('#share-status')).toHaveText(`${catalog.length} tried cans. PNG ready to share.`);
  const dimensions=await page.locator('#share-canvas').evaluate(canvas=>({width:canvas.width,height:canvas.height}));
  expect(dimensions.width).toBe(1080);
  expect(dimensions.height).toBeLessThan(6000);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('invalid links and unavailable storage leave usable progress and a backup link',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage unavailable','QuotaExceededError')};});
  await page.goto('/#tried=v1.!');
  await expect(page.locator('#toast')).toContainText('could not be read');
  await page.getByRole('button',{name:'Mark Original Green as tried',exact:true}).click();
  await expect(page.locator('.tried-count')).toHaveText('1');
  expect(readTrackingHash(new URL(page.url()).hash).profile.tried).toEqual(['original-green']);
  await page.reload();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','1');
  await expect(page.locator('.can-card')).toHaveCount(1);
});
