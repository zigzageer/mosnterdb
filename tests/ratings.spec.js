import { test, expect } from '@playwright/test';
import { catalog } from '../src/catalog.js';
import { TRACKING_IDS, TRACKING_KEY, normalizeProfile, trackingHash, readTrackingHash } from '../src/tracking.js';

async function loadProfile(page,profile) {
  await page.goto('/');
  await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:TRACKING_KEY,value:profile});
  await page.reload();
}

test('rating links round-trip compactly and older tried-only links remain valid',()=>{
  const old=readTrackingHash('#tried=v1.BwAAAAAAAAAAAAAAAA');
  expect(old.profile.tried).toEqual(TRACKING_IDS.slice(0,3));
  expect(old.profile.ratings).toBeUndefined();
  const ratings=Object.fromEntries(TRACKING_IDS.map((id,index)=>[id,index%5+1]));
  const profile=normalizeProfile({name:'Riley',tried:TRACKING_IDS,ratings});
  const link=trackingHash(profile,{view:'left'});
  expect(readTrackingHash(link)).toEqual({profile,view:'left'});
  expect(link.length).toBeLessThan(250);
  expect(normalizeProfile({tried:['original-green'],ratings:{'original-green':6,'zero-ultra':5}}).ratings).toBeUndefined();
  expect(readTrackingHash(trackingHash({tried:['original-green']})+'&r=v1.Bw').error).toBeTruthy();
  expect(readTrackingHash(trackingHash({tried:['original-green']})+'&r=v2.AA').error).toBeTruthy();
});

test('rate, change and clear a tried can; removing tried status clears its rating',async({page})=>{
  await loadProfile(page,{name:'Sam',tried:['original-green','zero-ultra']});
  await page.getByRole('button',{name:'My tried list'}).click();
  const four=page.getByRole('button',{name:'Rate Original Green 4 out of 5 stars',exact:true});
  await four.click();
  await expect(four).toHaveAttribute('aria-pressed','true');
  await expect(four).toBeFocused();
  await expect(page.locator('.rating-summary')).toHaveText('1 RATED // 4.0/5 AVERAGE');
  await page.reload();
  await expect(four).toHaveAttribute('aria-pressed','true');
  expect(readTrackingHash(new URL(page.url()).hash).profile.ratings).toEqual({'original-green':4});
  await page.getByRole('button',{name:'View Original Green details',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByRole('button',{name:'Rate Original Green 2 out of 5 stars',exact:true}).click();
  await expect(dialog.getByRole('button',{name:'Rate Original Green 2 out of 5 stars',exact:true})).toHaveAttribute('aria-pressed','true');
  await dialog.getByRole('button',{name:'Clear rating for Original Green',exact:true}).click();
  await expect(dialog.getByText('UNRATED',{exact:true})).toBeVisible();
  await dialog.getByRole('button',{name:'Rate Original Green 5 out of 5 stars',exact:true}).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'View Original Green details',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Mark Original Green as not tried',exact:true}).click();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),TRACKING_KEY)).toEqual({name:'Sam',tried:['zero-ultra']});
});

test('top and lowest rated sorting both leave unrated tried cans at the end',async({page})=>{
  await loadProfile(page,{tried:['original-green','zero-ultra','mango-loco'],ratings:{'original-green':5,'zero-ultra':1}});
  await page.getByRole('button',{name:'My tried list'}).click();
  await page.getByLabel('Sort cans').selectOption('rating-desc');
  await expect(page.locator('.can-label h2')).toHaveText(['Original Green','Zero Ultra','Mango Loco']);
  await page.getByLabel('Sort cans').selectOption('rating-asc');
  await expect(page.locator('.can-label h2')).toHaveText(['Zero Ultra','Original Green','Mango Loco']);
});

test('shared ratings preview read-only and merging keeps existing personal ratings',async({page})=>{
  await loadProfile(page,{name:'Mine',tried:['original-green'],ratings:{'original-green':2}});
  const shared={name:'Friend',tried:['original-green','mango-loco'],ratings:{'original-green':5,'mango-loco':4}};
  await page.goto('/'+trackingHash(shared));
  await expect(page.getByRole('button',{name:'Rate Original Green 5 out of 5 stars',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Rate Mango Loco 4 out of 5 stars',exact:true})).toBeDisabled();
  await page.locator('#use-shared').click();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).ratings,TRACKING_KEY)).toEqual({'original-green':2,'mango-loco':4});
  await page.reload();
  await expect(page.getByRole('button',{name:'Rate Original Green 2 out of 5 stars',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('dedicated Left to try list clears discovery filters, stays current and restores from its link',async({page,browser})=>{
  const tried=TRACKING_IDS.slice(0,3);
  await loadProfile(page,{tried});
  await page.getByRole('button',{name:'Ultra',exact:true}).click();
  await page.getByRole('searchbox').fill('gold');
  await page.locator('nav [data-view="left"]').click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.locator('.can-card')).toHaveCount(catalog.length-3);
  await expect(page.locator('nav [data-view="left"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('#catalog-title')).toHaveText('YOUR NEXT OBSESSION.');
  await page.getByRole('button',{name:'Mark Pacific Punch as tried',exact:true}).click();
  await expect(page.locator('.can-card')).toHaveCount(catalog.length-4);
  await expect(page.locator('.left-count')).toHaveText(String(catalog.length-4));
  const hash=new URL(page.url()).hash;
  expect(readTrackingHash(hash).view).toBe('left');
  await page.reload();
  await expect(page.locator('nav [data-view="left"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('.can-card')).toHaveCount(catalog.length-4);
  const context=await browser.newContext();
  const other=await context.newPage();
  await other.goto(new URL('/'+hash,page.url()).href);
  await expect(other.locator('.can-card')).toHaveCount(catalog.length-4);
  await other.locator('#use-shared').click();
  await expect(other.locator('nav [data-view="left"]')).toHaveAttribute('aria-current','page');
  await context.close();
});

test('completed Left to try list has a clear empty state',async({page})=>{
  await loadProfile(page,{tried:TRACKING_IDS});
  await page.locator('nav [data-view="left"]').click();
  await expect(page.locator('.can-card')).toHaveCount(0);
  await expect(page.getByText('NOTHING LEFT. LEGEND STATUS.')).toBeVisible();
  await page.getByRole('button',{name:'VIEW MY TRIED LIST',exact:true}).click();
  await expect(page.locator('.can-card')).toHaveCount(catalog.length);
});
