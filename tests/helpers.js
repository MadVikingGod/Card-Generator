// Shared helpers for the Card Generator end-to-end tests.

/**
 * Load the app with a clean localStorage so each test starts from empty state.
 */
async function gotoApp(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

/**
 * Set a color input's value and fire the input/change events the app listens for.
 * (Playwright's fill() does not reliably drive native color inputs.)
 */
async function setColor(locator, value) {
  await locator.evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

/**
 * Create a new card and return the editor form locator.
 */
async function addCard(page) {
  await page.click('#btn-add-card');
  await page.locator('#card-editor').waitFor({ state: 'visible' });
}

module.exports = { gotoApp, setColor, addCard };
