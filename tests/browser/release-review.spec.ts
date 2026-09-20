import { expect, test } from "@playwright/test";

test("progress renders its declared value and animates pending work", async ({ page }) => {
  await page.goto("/components/feedback/progress");
  const bar = page.locator('[role="tabpanel"] .nyx-progress[aria-valuenow="68"]');
  const ratio = await bar.evaluate(element => element.firstElementChild!.getBoundingClientRect().width / element.getBoundingClientRect().width);
  expect(ratio).toBeCloseTo(0.68, 2);
  await expect(page.getByText("Upload progress: 68%", { exact: true })).toBeVisible();
  const pending = page.locator('[role="tabpanel"] [data-indeterminate] .nyx-progress-bar');
  expect((await pending.boundingBox())!.width).toBeGreaterThan(0);
  const first = await pending.evaluate(element => getComputedStyle(element).transform);
  await expect.poll(() => pending.evaluate(element => getComputedStyle(element).transform)).not.toBe(first);
});

test("rating offers an ordered native scale with a focused selected choice", async ({ page }) => {
  await page.goto("/components/media/rating");
  const radios = page.locator('[role="tabpanel"] .nyx-rating input');
  await expect(radios).toHaveCount(5);
  expect(await radios.evaluateAll(elements => elements.map(element => (element as HTMLInputElement).value))).toEqual(["1", "2", "3", "4", "5"]);
  await radios.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(radios.nth(1)).toBeChecked();
  await expect(radios.nth(1)).toBeFocused();
  const labels = page.locator('[role="tabpanel"] .nyx-rating label');
  const colors = await labels.evaluateAll(elements => elements.map(element => getComputedStyle(element).color));
  expect(colors[0]).toBe(colors[1]);
  expect(colors[1]).not.toBe(colors[2]);
  expect(await labels.nth(1).evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
});

test("table numeric pages follow filtered results including empty results", async ({ page }) => {
  await page.goto("/components/data-display/advanced-data-table");
  const demo = page.locator('[role="tabpanel"] [data-nyx-data-table]');
  const second = demo.locator('[data-nyx-data-table-page="2"]');
  await second.click();
  await expect(demo.locator('[data-nyx-data-table-page-status]')).toHaveText("Page 2 of 2");
  await demo.locator('[data-nyx-data-table-filter]').fill("render-025");
  await expect(second).toBeHidden();
  await expect(second).toBeDisabled();
  await expect(demo.locator('[data-nyx-data-table-page-status]')).toHaveText("Page 1 of 1");
  await demo.locator('[data-nyx-data-table-filter]').fill("no-such-job");
  await expect(demo.locator('[data-nyx-data-table-page="1"]')).toBeHidden();
  await expect(demo.locator('[data-nyx-data-table-page-status]')).toHaveText("No results");
  await demo.locator('[data-nyx-data-table-filter]').fill("");
  await expect(second).toBeVisible();
  await expect(second).toBeEnabled();
});
