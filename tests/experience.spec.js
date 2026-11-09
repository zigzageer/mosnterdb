import { test, expect } from '@playwright/test';
import { catalog } from '../src/catalog.js';
import { TRACKING_KEY } from '../src/tracking.js';

const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), TRACKING_KEY);
async function loadProfile(page, profile) {
  await page.goto('/');
  await page.evaluate(({key,value}) => localStorage.setItem(key, JSON.stringify(value)), {key:TRACKING_KEY, value:profile});
  await page.reload();
}

test('rating an untried can marks it tried in one step', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Rate Mango Loco 4 out of 5 stars', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mark Mango Loco as not tried', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.tried-count')).toHaveText('1');
  await expect(page.locator('#toast')).toContainText('rated 4/5 and marked tried');
  expect(await stored(page)).toEqual({ name:'', tried:['mango-loco'], ratings:{'mango-loco':4} });
});

test('undo restores an accidental un-try together with its rating, and undoes collection changes', async ({ page }) => {
  await loadProfile(page, { name:'Sam', tried:['original-green'], ratings:{'original-green':5} });
  await page.getByRole('button', { name: 'Mark Original Green as not tried', exact: true }).click();
  expect(await stored(page)).toEqual({ name:'Sam', tried:[] });
  await expect(page.locator('#toast')).toContainText('rating cleared');
  await page.getByRole('button', { name: 'Undo' }).click();
  expect(await stored(page)).toEqual({ name:'Sam', tried:['original-green'], ratings:{'original-green':5} });
  await expect(page.getByRole('button', { name: 'Rate Original Green 5 out of 5 stars', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Add Zero Ultra to collection', exact: true }).click();
  await expect(page.locator('.collection-count')).toHaveText('1');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.collection-count')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Add Zero Ultra to collection', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('lists open as their own pages, navigation starts fresh and in-catalog tabs keep filters', async ({ page }) => {
  await loadProfile(page, { tried:['ultra-gold','original-green'] });
  await expect(page.locator('.hero')).toBeVisible();
  await page.getByRole('searchbox').fill('ultra');
  await page.getByRole('button', { name: /^TRIED 2$/ }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('ultra');
  await expect(page.locator('.can-card')).toHaveCount(1);
  await expect(page.locator('.hero')).toBeHidden();
  await expect(page.locator('nav [data-view="tracker"]')).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.can-card')).toHaveCount(2);
  await page.getByRole('searchbox').fill('gold');
  await page.getByRole('button', { name: 'My collection' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.locator('.hero')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'MY COLLECTION.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^COLLECTION 0$/ })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole('button', { name: 'The archive', exact: true }).click();
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.locator('.can-card')).toHaveCount(catalog.length);
});

test('search clears with its button and Escape, and the shortcut focuses it', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.keyboard.type('mango');
  await expect(page.locator('.can-card')).toHaveCount(2);
  await expect(page.locator('#result-summary')).toContainText('2 cans in the archive matching “mango”');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.locator('.can-card')).toHaveCount(catalog.length);
  await page.getByRole('searchbox').fill('punch');
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.locator('.can-card')).toHaveCount(catalog.length);
  await expect(page.getByRole('searchbox')).toBeFocused();
});

test('can details step through the visible list by button and arrow key, and feedback shows inside the dialog', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Juiced', exact: true }).click();
  const juiced = catalog.filter(can => can.family === 'Juiced');
  await page.getByRole('button', { name: `View ${juiced[0].name} details`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.detail-position')).toHaveText(`1 / ${juiced.length}`);
  await dialog.getByRole('button', { name: 'Next can' }).click();
  await expect(dialog.getByRole('heading', { name: juiced[1].name, exact: true })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading', { name: juiced[2].name, exact: true })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.getByRole('heading', { name: juiced.at(-1).name, exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: `Mark ${juiced.at(-1).name} as tried`, exact: true }).click();
  // The page behind a modal is inert, so the toast and its Undo have to live in the dialog.
  await expect(dialog.locator('#toast')).toBeVisible();
  await dialog.getByRole('button', { name: 'Undo' }).click();
  await expect(dialog.getByRole('button', { name: `Mark ${juiced.at(-1).name} as tried`, exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: `View ${juiced.at(-1).name} details`, exact: true })).toBeFocused();
});

test('surprise pick only offers flavors that are left to try', async ({ page }) => {
  const left = ['pacific-punch', 'khaotic'];
  await loadProfile(page, { tried: catalog.map(can => can.id).filter(id => !left.includes(id)) });
  await page.getByRole('button', { name: 'Surprise me' }).click();
  const dialog = page.getByRole('dialog');
  const first = await dialog.getByRole('heading').textContent();
  expect(['Pacific Punch', 'Khaotic']).toContain(first);
  await dialog.getByRole('button', { name: 'Roll again' }).click();
  await expect(dialog.getByRole('heading')).toHaveText(first === 'Khaotic' ? 'Pacific Punch' : 'Khaotic');
  await expect(dialog.getByRole('button', { name: 'Roll again' })).toBeFocused();
});

test('star ratings are a single tab stop with arrow-key movement', async ({ page }) => {
  await loadProfile(page, { tried:['original-green'], ratings:{'original-green':3} });
  const star = value => page.getByRole('button', { name: `Rate Original Green ${value} out of 5 stars`, exact: true });
  await expect(star(3)).toHaveAttribute('tabindex', '0');
  await expect(star(1)).toHaveAttribute('tabindex', '-1');
  await star(3).focus();
  await page.keyboard.press('ArrowRight');
  await expect(star(4)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(star(4)).toHaveAttribute('aria-pressed', 'true');
  await expect(star(4)).toBeFocused();
});

test('phones get a fixed bottom tab bar, a sticky search and tap-sized controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nav = page.locator('nav[aria-label="Main navigation"]');
  expect(await nav.evaluate(element => getComputedStyle(element).position)).toBe('fixed');
  const bar = await nav.boundingBox();
  expect(Math.round(bar.y + bar.height)).toBe(844);
  await page.locator('.can-card').nth(20).scrollIntoViewIfNeeded();
  expect((await page.locator('#filters').boundingBox()).y).toBe(0);
  await expect(page.getByRole('searchbox')).toBeInViewport();
  for (const control of [page.locator('.tried-toggle').nth(20), page.locator('.nav-link').first(), page.getByRole('searchbox')]) {
    expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(40);
  }
  await page.getByRole('button', { name: 'My tried list' }).click();
  await expect(page.locator('.hero')).toBeHidden();
  await expect(page.getByText('YOUR FIRST CAN IS OUT THERE.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
