import { expect, test, type Page } from "@playwright/test";

async function token(page: Page, name: string): Promise<string> {
  return page.locator("[data-create-canvas]").evaluate((element, property) => getComputedStyle(element).getPropertyValue(property).trim(), name);
}

test("every theme control updates the canvas without changing the docs chrome", async ({ page }) => {
  await page.goto("/create");
  const canvas = page.locator("[data-create-canvas]");
  const docsPanel = page.locator(".docs-topbar");
  const docsBackground = await docsPanel.evaluate((element) => getComputedStyle(element).backgroundColor);

  await expect(page.locator('select[name="accent"]')).toHaveValue("signal");
  await expect.poll(() => token(page, "--nyx-accent")).toBe("#00e08a");

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
  for (const manager of ["pnpm", "npm", "yarn", "bun"]) {
    await expect(dialog.locator(`[data-create-install="${manager}"]`)).toContainText("@nyx-raul/core@beta");
    await expect(dialog.locator(`[data-create-install="${manager}"]`)).toContainText("@nyx-raul/plugins@beta");
  }
  const copyCss = dialog.locator("[data-create-css]").locator("xpath=ancestor::*[@data-nyx-code-block][1]").locator("[data-nyx-code-copy]");
  await copyCss.click();
  await expect(copyCss).toHaveAttribute("data-state", "copied");
  await expect(copyCss).toHaveAccessibleName("Copied");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveJSProperty("open", false);
  await expect(trigger).toBeFocused();
});

test("default code needs no CSS overrides and puts the accent snippet after install", async ({ page }) => {
  await page.goto("/create");
  await page.getByRole("button", { name: "Get code" }).click();
  const dialog = page.locator("#create-code-dialog");

  await expect(dialog.locator("[data-create-css-label]")).toHaveText("3 / No CSS overrides needed");
  await expect(dialog.locator("[data-create-css]")).toHaveText("/* Nyx theme overrides */\n:root {\n}");
  await expect(dialog.locator("[data-create-html]")).toHaveText('<html data-nyx-theme="signal">');

  const installBox = await dialog.locator(".create-code-tabs").boundingBox();
  const accentBox = await dialog.locator(".create-code-primary").boundingBox();
  expect(installBox).not.toBeNull();
  expect(accentBox).not.toBeNull();
  expect(accentBox!.y).toBeGreaterThan(installBox!.y + installBox!.height - 1);
});

test("canvas adds responsive columns without clipped ellipses", async ({ page }) => {
  const wideTitles = ["Generation queue", "Prompt composer", "Batch progress", "Activity feed", "Advanced data table"];
  const viewports = [
    { width: 1440, height: 900, minimumColumns: 3, minimumVisibleCards: 4 },
    { width: 1920, height: 1080, minimumColumns: 4, minimumVisibleCards: 6 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/create");
    const grid = page.locator(".create-canvas-grid");
    const gridBox = await grid.boundingBox();
    const headerBox = await page.locator(".docs-page-header").boundingBox();
    const canvasBox = await page.locator("[data-create-canvas]").boundingBox();
    expect(gridBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();
    expect(headerBox!.height).toBeLessThanOrEqual(165);
    expect(canvasBox!.y - (headerBox!.y + headerBox!.height)).toBeLessThanOrEqual(20);
    const columns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
    expect(columns).toBeGreaterThanOrEqual(viewport.minimumColumns);

    const visibleCards = await page.locator("[data-create-card]").evaluateAll((cards) => cards.filter((card) => {
      const bounds = card.getBoundingClientRect();
      return bounds.top < window.innerHeight && bounds.bottom > 0;
    }).length);
    expect(visibleCards).toBeGreaterThanOrEqual(viewport.minimumVisibleCards);

    for (const title of wideTitles) {
      const card = page.locator("[data-create-card]", { has: page.locator("header", { hasText: title }) });
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(gridBox!.width / columns);
      expect(box!.width).toBeLessThan(gridBox!.width * 0.8);
    }

    const clippedEllipses = await page.locator("[data-create-canvas] *").evaluateAll((elements) => elements
      .filter((element) => {
        const htmlElement = element as HTMLElement;
        const style = getComputedStyle(htmlElement);
        return style.textOverflow === "ellipsis"
          && (htmlElement.scrollWidth > htmlElement.clientWidth || htmlElement.scrollHeight > htmlElement.clientHeight);
      })
      .map((element) => element.textContent?.trim())
      .filter(Boolean));
    expect(clippedEllipses).toEqual([]);
    await expect(page.getByText("release-notes.pdf", { exact: true })).toBeVisible();
    await expect(page.getByText("audit-sample.csv", { exact: true })).toBeVisible();
    await expect(page.getByText("Lobby concept", { exact: true })).toBeVisible();
    await expect(page.getByText("Night crop", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});

test("code dialog wraps the font link and scrolls its body on a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 560 });
  await page.goto("/create");
  await page.locator('select[name="font"]').selectOption("source-code");
  await page.getByRole("button", { name: "Get code" }).click();

  const dialog = page.locator("#create-code-dialog");
  const body = dialog.locator(".nyx-dialog-body");
  const fontCode = dialog.locator("[data-create-font-block] pre");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".nyx-dialog-footer")).toBeVisible();
  expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  expect(await fontCode.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
});

test("canvas uses two tablet columns and one phone column", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("/create");
  const tabletColumns = await page.locator(".create-canvas-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
  expect(tabletColumns).toBe(2);
  const tabletWide = await page.locator(".create-card-wide").first().boundingBox();
  const tabletSingle = await page.locator("[data-create-card]:not(.create-card-wide)").first().boundingBox();
  expect(tabletWide).not.toBeNull();
  expect(tabletSingle).not.toBeNull();
  expect(Math.abs(tabletWide!.width - tabletSingle!.width)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });
  const phoneColumns = await page.locator(".create-canvas-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
  expect(phoneColumns).toBe(1);
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
