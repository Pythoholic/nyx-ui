import { expect, test } from '@playwright/test';

test('admin products, inbox and member roles persist without connected services', async ({ page }) => {
  await page.goto('/admin/#products');
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Studio headphones' }) }).getByRole('button', { name: 'Edit product' }).click();
  await page.getByLabel('Stock quantity').fill('0');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('article').filter({ has: page.getByRole('heading', { name: 'Studio headphones' }) })).toContainText('Out of stock');
  await page.goto('/admin/#inbox');
  await page.getByLabel('Reply', { exact: true }).fill('Ready for the demo review.');
  await page.getByRole('button', { name: 'Save demo reply' }).click();
  await page.reload();
  await expect(page.locator('.admin-reply')).toContainText('Ready for the demo review.');
  await page.goto('/admin/#team');
  await page.getByLabel('Role for Sofia Chen').selectOption('Viewer');
  await page.reload();
  await expect(page.getByLabel('Role for Sofia Chen')).toHaveValue('Viewer');
});

test('admin order workflow persists edits, filters results, and exports selected records', async ({ page }) => {
  await page.goto('/admin/#orders');
  await page.getByRole('button', { name: 'Create order', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Customer name').fill('Test Customer');
  await dialog.getByLabel('Customer email').fill('test@example.com');
  await dialog.getByLabel('Amount (USD)').fill('250');
  await dialog.getByLabel('Payment status').selectOption('Paid');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('searchbox', { name: 'Search orders' }).fill('Test Customer');
  await expect(page.getByRole('cell', { name: 'Test Customer test@example.com' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Select visible orders' }).check();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export selected' }).click();
  expect((await download).suggestedFilename()).toBe('nyx-orders.csv');
  await page.reload();
  await page.getByRole('searchbox', { name: 'Search orders' }).fill('Test Customer');
  await expect(page.getByRole('cell', { name: '$250', exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search orders' }).fill('does not exist');
  await expect(page.getByRole('heading', { name: 'No matching orders' })).toBeVisible();
});

test('admin routes render, navigation responds, and the page stays bounded on mobile', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/admin/');
  await expect(page.getByRole('heading', { name: 'Workspace overview' })).toBeVisible();
  for (const width of [2560, 1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['overview', 'analytics', 'orders', 'customers', 'products', 'projects', 'inbox', 'calendar', 'team', 'billing', 'settings']) {
      await page.goto(`/admin/#${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main input:not([type=checkbox]):not([type=hidden]):not(.nyx-input), main select:not(.nyx-select), main textarea:not(.nyx-textarea)')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} at ${width}`).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: 'Products' }).click();
  await expect(page.locator('main h1')).toHaveText('Products');
  await page.getByLabel('Accent theme').selectOption('plasma');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-nyx-theme', 'plasma');
  expect(errors).toEqual([]);
});

test('admin project, calendar and settings controls update actual demo state', async ({ page }) => {
  await page.goto('/admin/#projects');
  await page.getByLabel('Autumn collection status').selectOption('Done');
  await expect(page.locator('.admin-board-column').filter({ has: page.getByRole('heading', { name: 'Done', exact: false }) }).getByRole('heading', { name: 'Autumn collection' })).toBeVisible();
  await page.goto('/admin/#calendar');
  await page.getByRole('button', { name: 'Add event', exact: true }).click();
  await page.getByLabel('Event name', { exact: true }).fill('Team demo review');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.admin-calendar-events').getByText('Team demo review', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.locator('#admin-calendar-heading')).toHaveText('October 2026');
  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(page.locator('#admin-calendar-heading')).toHaveText('September 2026');
  await page.goto('/admin/#settings');
  await page.getByLabel('Workspace name').fill('Demo Studio');
  await page.locator('#settings-form').getByRole('button', { name: 'Save changes' }).click();
  await page.reload();
  await expect(page.getByLabel('Workspace name')).toHaveValue('Demo Studio');
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('products');
  await page.locator('#admin-dialog').getByRole('link', { name: /Products/ }).click();
  await expect(page.locator('main h1')).toHaveText('Products');
});
