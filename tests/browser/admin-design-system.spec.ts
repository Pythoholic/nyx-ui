import { expect, test } from '@playwright/test';

test('admin primitives match unmodified Nyx components in every theme', async ({ page, context }) => {
  const reference = await context.newPage();
  await reference.goto('/');
  await reference.addStyleTag({ content: '#nyx-reference, #nyx-reference * { transition: none !important; animation: none !important; }' });
  await reference.evaluate(() => {
    const fixture = document.createElement('section');
    fixture.id = 'nyx-reference';
    fixture.innerHTML = `<button class="nyx-button" data-variant="primary">Create</button>
      <input class="nyx-input"><select class="nyx-select"><option>Signal</option></select>
      <span class="nyx-avatar">AM</span><span class="nyx-badge" data-tone="success">Paid</span>
      <section class="nyx-panel"><h2 class="nyx-panel-title">Panel</h2></section>
      <article class="nyx-stat"><strong class="nyx-stat-value">123</strong></article>
      <table class="nyx-table"><thead><tr><th>Order</th></tr></thead><tbody><tr><td>123</td></tr></tbody></table>`;
    document.body.append(fixture);
  });
  const properties = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'textTransform', 'borderTopWidth', 'borderTopColor', 'borderTopLeftRadius', 'backgroundColor', 'color'] as const;
  for (const theme of ['signal', 'solar', 'flux', 'plasma']) {
    await reference.evaluate(theme => document.documentElement.dataset.nyxTheme = theme, theme);
    await page.goto('/admin/');
    await page.getByLabel('Accent theme').selectOption(theme);
    for (const [actual, expected] of [
      ['main .nyx-button[data-variant=primary]', '.nyx-button'],
      ['.admin-theme-label select', '.nyx-select'],
      ['main .nyx-avatar', '.nyx-avatar'],
      ['main .nyx-badge[data-tone=success]', '.nyx-badge'],
      ['main .admin-panel', '.nyx-panel'],
      ['main .nyx-panel-title', '.nyx-panel-title'],
      ['main .nyx-stat-value', '.nyx-stat-value'],
      ['main .nyx-table th', '.nyx-table th'],
      ['main .nyx-table td', '.nyx-table td'],
    ]) {
      const read = (element: Element, props: readonly string[]) => Object.fromEntries(props.map(p => [p, (getComputedStyle(element) as unknown as Record<string, string>)[p]]));
      const baseline = await reference.locator(`#nyx-reference ${expected}`).first().evaluate(read, properties);
      await expect.poll(() => page.locator(actual!).first().evaluate(read, properties), `${theme}: ${actual}`).toEqual(baseline);
    }
    await page.goto('/admin/#settings');
    const fonts = await page.locator('body').evaluate(el => ({ actual: getComputedStyle(el).fontFamily, expected: getComputedStyle(el).getPropertyValue('--font-nyx').trim() }));
    expect(fonts.actual).toBe(fonts.expected);
    await expect(page.locator('input:not([type=checkbox]):not(.nyx-input), select:not(.nyx-select), textarea:not(.nyx-textarea)')).toHaveCount(0);
  }
  await reference.close();
});

test('Nyx sidebar and dialog retain keyboard containment and focus return on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/');
  const toggle = page.getByRole('button', { name: 'Toggle navigation' });
  await toggle.click();
  await expect(page.locator('#admin')).toHaveAttribute('data-nyx-sidebar-mode', 'mobile');
  await expect(page.locator('#admin-sidebar')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-nyx-scroll-locked', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('#admin-sidebar')).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await page.getByRole('button', { name: 'Create order', exact: true }).click();
  await expect(page.locator('#admin-dialog .nyx-dialog-header')).toBeVisible();
  await expect(page.locator('#admin-dialog .nyx-dialog-body')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#admin-dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Create order', exact: true })).toBeFocused();
});
