import { test, expect } from '@playwright/test';
import { catalog } from '../src/catalog.js';

test('catalog photos load and every indexed entry is browsable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.can-card')).toHaveCount(catalog.length);
  // Every entry has a photo, so the old "Photos only" switch would be a dead control.
  expect(catalog.every(c => c.image)).toBe(true);
  await expect(page.getByLabel('Photos only')).toHaveCount(0);
  await page.locator('footer').scrollIntoViewIfNeeded();
  // The expanded catalog spans many viewports; explicitly decode each lazy photo.
  await page.locator('.can-photo').evaluateAll(images => Promise.all(images.map(image => {
    image.loading = 'eager';
    return image.decode();
  })));
  await expect.poll(() => page.locator('.can-photo').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
  await page.getByRole('button', { name: 'View Original Green details', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Original Green', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('search, family and sorting combine correctly and reset', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ultra', exact: true }).click();
  await page.getByRole('searchbox').fill('gold');
  await expect(page.locator('.can-card')).toHaveCount(1);
  await expect(page.locator('.can-label h2')).toHaveText('Ultra Gold');
  await page.getByRole('searchbox').fill('not-a-monster-flavor');
  await expect(page.getByText('NOTHING IN THE VAULT.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.locator('.can-card')).toHaveCount(catalog.length);
  await page.getByLabel('Sort cans').selectOption('az');
  const names = await page.locator('.can-label h2').allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
});

test('collection persists after reload and can be removed from its own shelf', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Original Green to collection', exact: true }).click();
  await page.getByRole('button', { name: 'My collection' }).click();
  await expect(page.locator('.can-card')).toHaveCount(1);
  await expect(page.locator('.collection-count')).toHaveText('1');
  await page.reload();
  await page.getByRole('button', { name: 'My collection' }).click();
  await expect(page.locator('.can-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove Original Green from collection', exact: true }).click();
  await expect(page.getByText('YOUR COLLECTION STARTS HERE.')).toBeVisible();
  await expect(page.locator('.collection-count')).toHaveText('0');
  await page.getByRole('button', { name: 'Explore the archive', exact: true }).click();
  await expect(page.locator('.can-card')).toHaveCount(catalog.length);
});

test('detail collection actions, artwork labeling and modal keyboard support', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('Absolutely Zero');
  await page.getByRole('button', { name: 'View Absolutely Zero details', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Product photo', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Add Absolutely Zero to collection', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Remove Absolutely Zero from collection', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'View Absolutely Zero details', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'About the archive' }).click();
  await expect(page.getByRole('heading', { name: 'EVERY CAN HAS A STORY.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close about dialog' }).click();
});

test('mobile grid fits the viewport and family tabs can scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const cards = page.locator('.can-card');
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  const third = await cards.nth(2).boundingBox();
  expect(first.y).toBe(second.y);
  expect(third.y).toBeGreaterThan(first.y);
  await page.getByRole('button', { name: 'Hydro', exact: true }).click();
  await expect(page.locator('.can-card')).toHaveCount(catalog.filter(c => c.family === 'Hydro').length);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'View Blue Ice details', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close can details' }).click();
});
