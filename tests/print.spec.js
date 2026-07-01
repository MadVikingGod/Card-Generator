const { test, expect } = require('@playwright/test');
const { gotoApp, addCard } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test('print view lays out 6 cards per page with a matching back page', async ({ page }) => {
  // Card A x4 and card B x3 = 7 copies -> 2 front pages + 2 back pages.
  await addCard(page);
  await page.fill('#field-name', 'Card A');
  await page.fill('#field-copies', '4');
  await page.dispatchEvent('#field-copies', 'change');

  await addCard(page);
  await page.fill('#field-name', 'Card B');
  await page.fill('#field-copies', '3');
  await page.dispatchEvent('#field-copies', 'change');

  await page.click('#btn-print');
  await expect(page.locator('#print-overlay')).toBeVisible();

  await expect(page.locator('.print-page.front-page')).toHaveCount(2);
  await expect(page.locator('.print-page.back-page')).toHaveCount(2);

  // 7 real front cards are rendered (visible, not the hidden filler slots).
  const visibleFronts = page.locator('.front-page .card-front:not([style*="visibility: hidden"])');
  await expect(visibleFronts).toHaveCount(7);
});

test('back cards are rotated 180 degrees for double-sided printing', async ({ page }) => {
  await addCard(page);
  await page.fill('#field-name', 'Solo');
  await page.click('#btn-print');

  const transform = await page
    .locator('.back-page .card-back')
    .first()
    .evaluate((el) => getComputedStyle(el).transform);
  // rotate(180deg) => matrix(-1, 0, 0, -1, 0, 0)
  expect(transform).toBe('matrix(-1, 0, 0, -1, 0, 0)');
});

test('closing the print view returns to the editor', async ({ page }) => {
  await addCard(page);
  await page.click('#btn-print');
  await expect(page.locator('#print-overlay')).toBeVisible();

  await page.click('button:has-text("Close")');
  await expect(page.locator('#print-overlay')).toBeHidden();
  await expect(page.locator('#app')).toBeVisible();
});

test('printing with no cards warns instead of opening the print view', async ({ page }) => {
  let dialogMessage = null;
  page.on('dialog', async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.dismiss();
  });

  await page.click('#btn-print');
  expect(dialogMessage).toContain('No cards to print');
  await expect(page.locator('#print-overlay')).toBeHidden();
});
