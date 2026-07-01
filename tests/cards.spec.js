const { test, expect } = require('@playwright/test');
const { gotoApp, addCard } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test('creating a card adds it to the list and shows the editor', async ({ page }) => {
  await expect(page.locator('#card-editor')).toBeHidden();
  await addCard(page);
  await expect(page.locator('#card-editor')).toBeVisible();
  // The list shows the special back item plus the new card.
  await expect(page.locator('.card-list-item:not(.back-item)')).toHaveCount(1);
});

test('editing fields updates the live preview and the list', async ({ page }) => {
  await addCard(page);

  await page.fill('#field-name', 'Guitar Blue');
  await expect(page.locator('#card-preview .card-name-display')).toHaveText('Guitar Blue');
  await expect(page.locator('.card-list-item:not(.back-item) .card-list-name')).toHaveText(
    'Guitar Blue',
  );

  await page.selectOption('#field-rarity', 'epic');
  await expect(page.locator('#card-preview .card-rarity-display')).toHaveText('epic');
  await expect(page.locator('#card-preview .card-rarity-display')).toHaveAttribute(
    'data-rarity',
    'epic',
  );

  await page.fill('#field-type', 'Primary');
  await expect(page.locator('#card-preview .card-type-display')).toHaveText('Primary');
});

test('health shows without a percent sign', async ({ page }) => {
  await addCard(page);
  await page.fill('#field-health', '90');
  const health = page.locator('#card-preview .help-row');
  await expect(health).toContainText('Health:');
  await expect(health).toContainText('90');
  await expect(health).not.toContainText('%');
});

test('only filled-in powers are shown on the card', async ({ page }) => {
  await addCard(page);

  // No powers filled -> no power rows.
  await expect(page.locator('#card-preview .power-row')).toHaveCount(0);

  await page.fill('#field-power1-name', 'Blue sparkles');
  await page.fill('#field-power1-value', '80');
  await expect(page.locator('#card-preview .power-row')).toHaveCount(1);

  await page.fill('#field-power2-name', 'Blue dash');
  await page.fill('#field-power2-value', '50');
  await expect(page.locator('#card-preview .power-row')).toHaveCount(2);

  await expect(page.locator('#card-preview .power-row').first()).toContainText('Blue sparkles');
  await expect(page.locator('#card-preview .power-row').first()).toContainText('80');
});

test('cards persist across a reload', async ({ page }) => {
  await addCard(page);
  await page.fill('#field-name', 'Persisted');
  await page.reload();
  await expect(page.locator('.card-list-item:not(.back-item) .card-list-name')).toHaveText(
    'Persisted',
  );
});

test('a card can be duplicated and deleted', async ({ page }) => {
  await addCard(page);
  await page.fill('#field-name', 'Original');

  await page.click('button:has-text("Duplicate Card")');
  await expect(page.locator('.card-list-item:not(.back-item)')).toHaveCount(2);
  await expect(page.locator('#field-name')).toHaveValue('Original (copy)');

  await page.click('button:has-text("Delete Card")');
  await expect(page.locator('.card-list-item:not(.back-item)')).toHaveCount(1);
});
