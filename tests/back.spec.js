const { test, expect } = require('@playwright/test');
const { gotoApp, setColor, addCard } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test('the card back is a special item at the top of the list', async ({ page }) => {
  const backItem = page.locator('.card-list-item.back-item');
  await expect(backItem).toHaveCount(1);
  await expect(backItem.locator('.card-list-name')).toHaveText('Card Back');
});

test('selecting the back opens a dedicated back editor', async ({ page }) => {
  await page.click('.card-list-item.back-item');

  await expect(page.locator('#editor-title')).toHaveText('Edit Card Back');
  await expect(page.locator('#back-editor')).toBeVisible();
  await expect(page.locator('#card-editor')).toBeHidden();
  await expect(page.locator('#back-preview-container')).toBeVisible();
  await expect(page.locator('#card-preview-container')).toBeHidden();
});

test('the back has only a color and image (no text field)', async ({ page }) => {
  await page.click('.card-list-item.back-item');
  await expect(page.locator('#field-back-color')).toBeVisible();
  await expect(page.locator('#back-upload-area')).toBeVisible();
  await expect(page.locator('#field-back-text')).toHaveCount(0);
});

test('changing the back color updates the preview and list swatch', async ({ page }) => {
  await page.click('.card-list-item.back-item');
  await setColor(page.locator('#field-back-color'), '#8b0000');

  await expect(page.locator('#back-preview .card-back-inner')).toHaveAttribute(
    'style',
    /rgb\(139, 0, 0\)|#8b0000/,
  );
  await expect(page.locator('.card-list-item.back-item .card-swatch')).toHaveAttribute(
    'style',
    /rgb\(139, 0, 0\)|#8b0000/,
  );
});

test('the back is shared and persists when switching to a card', async ({ page }) => {
  await page.click('.card-list-item.back-item');
  await setColor(page.locator('#field-back-color'), '#123456');

  await addCard(page);
  await expect(page.locator('#card-editor')).toBeVisible();

  // Re-select the back; the color is preserved.
  await page.click('.card-list-item.back-item');
  await expect(page.locator('#field-back-color')).toHaveValue('#123456');
});
