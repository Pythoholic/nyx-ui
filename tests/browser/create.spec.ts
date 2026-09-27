import { expect, test, type Page } from "@playwright/test";

async function token(page: Page, name: string): Promise<string> {
  return page.locator("[data-create-canvas]").evaluate((element, property) => getComputedStyle(element).getPropertyValue(property).trim(), name);
}

test("every theme control updates the canvas without changing the docs chrome", async ({ page }) => {
  await page.goto("/create");
  const canvas = page.locator("[data-create-canvas]");
  const docsPanel = page.locator(".docs-topbar");
  const docsBackground = await docsPanel.evaluate((element) => getComputedStyle(element).backgroundColor);

  await page.locator('select[name="accent"]').selectOption("plasma");
  await expect.poll(() => token(page, "--nyx-accent")).toBe("#8b7cf6");

  await page.locator('select[name="palette"]').selectOption("slate");
  await expect.poll(() => token(page, "--nyx-panel")).toBe("#0d1921");

  await page.locator('label[for="create-radius-round"]').click();
  await expect.poll(() => token(page, "--nyx-radius-panel")).toBe("1.5rem");

  await page.locator('select[name="font"]').selectOption("space");
  await expect.poll(() => token(page, "--font-nyx")).toContain("Space Mono");

  await page.locator('label[for="create-borders-hairline"]').click();
  await expect.poll(() => token(page, "--nyx-border")).toBe("0.0625rem");

  await page.locator('label[for="create-shadows-flat"]').click();
  await expect.poll(() => token(page, "--nyx-shadow-raised")).toBe("none");

  await page.locator('label[for="create-motion-snappy"]').click();
  await expect.poll(() => token(page, "--nyx-duration-normal")).toBe("110ms");

  await page.locator('select[name="accent"]').selectOption("custom");
  await page.locator('input[name="customColor"]').fill("#ffffff");
  await expect.poll(() => token(page, "--nyx-accent-ink")).toBe("#000000");

  await expect(canvas).toHaveAttribute("data-palette", "slate");
  await expect.poll(() => docsPanel.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(docsBackground);
});

test("create state round-trips through reload and generated code reflects it", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/create");
  await page.locator('select[name="accent"]').selectOption("plasma");
  await page.locator('select[name="palette"]').selectOption("midnight");
  await page.locator('label[for="create-radius-round"]').click();
  await page.locator('select[name="font"]').selectOption("source-code");
  await page.locator('label[for="create-borders-hairline"]').click();
  await page.locator('label[for="create-shadows-flat"]').click();
  await page.locator('label[for="create-motion-calm"]').click();

  const savedUrl = page.url();
  expect(savedUrl).toContain("accent=plasma");
  expect(savedUrl).toContain("palette=midnight");
  await page.reload();
  expect(page.url()).toBe(savedUrl);
  await expect(page.locator('select[name="accent"]')).toHaveValue("plasma");
  await expect(page.locator('select[name="palette"]')).toHaveValue("midnight");
  await expect(page.locator('input[name="radius"][value="round"]')).toBeChecked();
  await expect.poll(() => token(page, "--nyx-panel")).toBe("#0e1329");

  const trigger = page.getByRole("button", { name: "Get code" });
  await trigger.click();
  const dialog = page.locator("#create-code-dialog");
  await expect(dialog).toHaveJSProperty("open", true);
  await expect(dialog.locator("[data-create-css]")).toContainText("--nyx-radius-panel: 1.5rem");
  await expect(dialog.locator("[data-create-css]")).toContainText("--nyx-shadow-raised: none");
  await expect(dialog.locator("[data-create-font-link]")).toContainText("Source+Code+Pro");
  await expect(dialog.locator("[data-create-html]")).toContainText('data-nyx-theme="plasma"');
  await expect(dialog.locator('[data-create-install="pnpm"]')).toContainText("@nyx-raul/core");
  const copyCss = dialog.locator("[data-create-css]").locator("xpath=ancestor::*[@data-nyx-code-block][1]").locator("[data-nyx-code-copy]");
  await copyCss.click();
  await expect(copyCss).toHaveAttribute("data-state", "copied");
  await expect(copyCss).toHaveAccessibleName("Copied");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveJSProperty("open", false);
  await expect(trigger).toBeFocused();
});

test("create has no console errors and stays bounded with both mobile panel states", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/create");
  const panel = page.locator("#create-control-panel");
  await expect(panel).not.toBeVisible();
  await expect(page.locator("[data-create-card]")).toHaveCount(14);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

  await page.getByRole("button", { name: "Customize" }).click();
  await expect(panel).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
