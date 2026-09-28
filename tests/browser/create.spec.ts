import { expect, test, type Page } from "@playwright/test";

async function token(page: Page, name: string): Promise<string> {
  return page.locator("[data-create-scope]").evaluate((element, property) => getComputedStyle(element).getPropertyValue(property).trim(), name);
}

async function chooseOption(page: Page, name: string, value: string): Promise<void> {
  await page.locator(`[data-create-trigger="${name}"]`).click();
  await page.locator(`#create-picker-${name} [data-create-option-value="${value}"]`).click();
}

test("picker rows update the shared panel and canvas theme scope", async ({ page }) => {
  await page.goto("/create");
  const canvas = page.locator("[data-create-canvas]");
  const panel = page.locator("#create-control-panel");
  const docsPanel = page.locator(".docs-topbar");
  const docsBackground = await docsPanel.evaluate((element) => getComputedStyle(element).backgroundColor);

  await expect(page.locator('input[name="accent"]')).toHaveValue("signal");
  await expect.poll(() => token(page, "--nyx-accent")).toBe("#00e08a");
  await expect(page.locator(".docs-theme-list")).toBeHidden();
  await expect.poll(() => panel.evaluate((element) => getComputedStyle(element).getPropertyValue("--nyx-accent").trim())).toBe("#00e08a");
  await expect.poll(() => page.getByRole("button", { name: "Get code" }).evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(0, 224, 138)");

  await chooseOption(page, "accent", "plasma");
  await expect.poll(() => token(page, "--nyx-accent")).toBe("#8b7cf6");

  await chooseOption(page, "palette", "slate");
  await expect.poll(() => token(page, "--nyx-panel")).toBe("#0d1921");

  await chooseOption(page, "radius", "round");
  await expect.poll(() => token(page, "--nyx-radius-panel")).toBe("1.5rem");

  await chooseOption(page, "font", "space");
  await expect.poll(() => token(page, "--font-nyx")).toContain("Space Mono");

  await chooseOption(page, "borders", "hairline");
  await expect.poll(() => token(page, "--nyx-border")).toBe("0.0625rem");

  await chooseOption(page, "shadows", "flat");
  await expect.poll(() => token(page, "--nyx-shadow-raised")).toBe("none");

  await chooseOption(page, "motion", "snappy");
  await expect.poll(() => token(page, "--nyx-duration-normal")).toBe("110ms");

  await chooseOption(page, "accent", "custom");
  await page.locator('[data-create-trigger="accent"]').click();
  await page.locator('input[name="customColor"]').fill("#ffffff");
  await expect.poll(() => token(page, "--nyx-accent-ink")).toBe("#000000");

  await expect(canvas).toHaveAttribute("data-palette", "slate");
  await expect.poll(() => docsPanel.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(docsBackground);
});

test("pickers support keyboard selection and Escape focus return", async ({ page }) => {
  await page.goto("/create");
  const accent = page.locator('[data-create-trigger="accent"]');
  await accent.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#create-picker-accent")).toBeVisible();
  await expect(page.locator('#create-picker-accent [data-create-option-value="solar"]')).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(accent).toBeFocused();
  await expect(page).toHaveURL(/accent=plasma/);
  await expect.poll(() => token(page, "--nyx-accent")).toBe("#8b7cf6");

  const radius = page.locator('[data-create-trigger="radius"]');
  await radius.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#create-picker-radius")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#create-picker-radius")).toBeHidden();
  await expect(radius).toBeFocused();
});

test("create state round-trips through reload and generated code reflects it", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/create");
  await chooseOption(page, "accent", "plasma");
  await chooseOption(page, "palette", "midnight");
  await chooseOption(page, "radius", "round");
  await chooseOption(page, "font", "source-code");
  await chooseOption(page, "borders", "hairline");
  await chooseOption(page, "shadows", "flat");
  await chooseOption(page, "motion", "calm");

  const savedUrl = page.url();
  expect(savedUrl).toContain("accent=plasma");
  expect(savedUrl).toContain("palette=midnight");
  await page.reload();
  expect(page.url()).toBe(savedUrl);
  await expect(page.locator('input[name="accent"]')).toHaveValue("plasma");
  await expect(page.locator('input[name="palette"]')).toHaveValue("midnight");
  await expect(page.locator('input[name="radius"]')).toHaveValue("round");
  await expect.poll(() => token(page, "--nyx-panel")).toBe("#0e1329");

  const trigger = page.getByRole("button", { name: "Get code" });
  await trigger.click();
  const dialog = page.locator("#create-code-dialog");
  await expect(dialog).toHaveJSProperty("open", true);
  await expect(dialog.locator("[data-create-css]")).toContainText("--nyx-radius-panel: 1.5rem");
  await expect(dialog.locator("[data-create-css]")).toContainText("--nyx-shadow-raised: none");
  await expect(dialog.locator("[data-create-font-link]")).toContainText("Source+Code+Pro");
  await expect(dialog.locator("[data-create-html]")).toContainText('data-nyx-theme="plasma"');
  const dialogPrimary = dialog.getByRole("button", { name: "Done" });
  const canvasPrimary = page.locator("[data-create-canvas]").getByRole("button", { name: "Primary" });
  await expect.poll(() => dialogPrimary.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(await canvasPrimary.evaluate((element) => getComputedStyle(element).backgroundColor));
  for (const manager of ["pnpm", "npm", "yarn", "bun"]) {
    await expect(dialog.locator(`[data-create-install="${manager}"]`)).toContainText("@nyx-raul/core@beta");
    await expect(dialog.locator(`[data-create-install="${manager}"]`)).toContainText("@nyx-raul/plugins@beta");
  }
  const copyCss = dialog.locator("[data-create-css]").locator("xpath=ancestor::*[@data-nyx-code-block][1]").locator("[data-nyx-code-copy]");
  await copyCss.click();
  await expect(copyCss).toHaveAttribute("data-state", "copied");
  await expect(copyCss).toHaveAccessibleName("Copied");
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveJSProperty("open", false);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveJSProperty("open", false);
  await expect(trigger).toBeFocused();
});

test("default code omits empty overrides and package tabs stay inside step one", async ({ page }) => {
  await page.goto("/create");
  await page.getByRole("button", { name: "Get code" }).click();
  const dialog = page.locator("#create-code-dialog");

  await expect(dialog.locator("[data-create-empty-overrides]")).toHaveText("Your choices match the defaults, so no overrides are needed.");
  await expect(dialog.locator("[data-create-empty-overrides]")).toBeVisible();
  await expect(dialog.locator("[data-create-overrides-block]")).toBeHidden();
  await expect(dialog).not.toContainText(":root {");
  await expect(dialog.locator("[data-create-html]")).toHaveText('<html data-nyx-theme="signal">');
  await expect(dialog.locator("[data-create-font-link]")).toContainText("JetBrains+Mono");

  const fontBefore = await dialog.locator("[data-create-font-link]").textContent();
  await dialog.getByRole("tab", { name: "npm", exact: true }).click();
  await expect(dialog.locator("#create-npm-panel")).toBeVisible();
  await expect(dialog.locator("#create-pnpm-panel")).toBeHidden();
  await expect(dialog.locator("[data-create-font-link]")).toHaveText(fontBefore ?? "");
  await expect(dialog.locator(".create-code-step").nth(1)).toBeVisible();
  expect(await dialog.locator(".nyx-tab-panel").evaluateAll((panels) => panels.every((panel) => panel.closest(".create-code-step")?.querySelector(".create-code-step-number")?.textContent === "01"))).toBe(true);
});

test("canvas builds a gapless masonry wall without clipped ellipses", async ({ page }) => {
  const viewports = [
    { width: 2560, height: 1440, expectedColumns: 7 },
    { width: 1920, height: 1080, expectedColumns: 5 },
    { width: 1440, height: 900, expectedColumns: 3 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/create");
    const grid = page.locator(".create-canvas-grid");
    const gridBox = await grid.boundingBox();
    const mainBox = await page.locator(".docs-main-create").boundingBox();
    const headerBox = await page.locator(".docs-page-header").boundingBox();
    const canvasBox = await page.locator("[data-create-canvas]").boundingBox();
    expect(gridBox).not.toBeNull();
    expect(mainBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();
    expect(headerBox!.height).toBeLessThanOrEqual(130);
    expect(canvasBox!.y - mainBox!.y).toBeLessThanOrEqual(170);
    expect(canvasBox!.y - (headerBox!.y + headerBox!.height)).toBeLessThanOrEqual(20);
    const codeButton = page.getByRole("button", { name: "Get code" });
    await expect(codeButton).toBeVisible();
    const codeButtonBox = await codeButton.boundingBox();
    expect(codeButtonBox).not.toBeNull();
    expect(codeButtonBox!.y + codeButtonBox!.height).toBeLessThanOrEqual(viewport.height);
    await expect(grid).toHaveAttribute("data-create-columns", /\d/);
    const columns = await grid.locator(".create-masonry-column").count();
    expect(Math.abs(columns - viewport.expectedColumns)).toBeLessThanOrEqual(1);

    const geometry = await grid.evaluate((element) => {
      const gap = Number.parseFloat(getComputedStyle(element).columnGap);
      const cards = Array.from(element.querySelectorAll<HTMLElement>("[data-create-card]"));
      const overlaps: string[] = [];
      cards.forEach((first, firstIndex) => cards.slice(firstIndex + 1).forEach((second) => {
        const a = first.getBoundingClientRect();
        const b = second.getBoundingClientRect();
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5
          && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5) {
          overlaps.push(`${first.dataset.createCardTitle} / ${second.dataset.createCardTitle}`);
        }
      }));
      const verticalGaps = Array.from(element.querySelectorAll<HTMLElement>(".create-masonry-column")).flatMap((column) => {
        const columnCards = Array.from(column.children).map((card) => card.getBoundingClientRect()).sort((a, b) => a.top - b.top);
        return columnCards.slice(1).map((card, index) => card.top - columnCards[index]!.bottom);
      });
      return { gap, overlaps, verticalGaps };
    });
    expect(geometry.overlaps).toEqual([]);
    expect(Math.max(...geometry.verticalGaps)).toBeLessThanOrEqual(geometry.gap + 2);

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
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});

test("generation queue stays compact", async ({ page }) => {
  await page.goto("/create");
  const queue = page.locator('[data-create-card-title="Render queue"]');
  await expect(queue.locator("[data-nyx-generation-item]")).toHaveCount(3);
  expect(await queue.locator("[data-nyx-generation-item]").evaluateAll((jobs) => jobs.map((job) => job.getAttribute("data-state"))))
    .toEqual(["running", "queued", "complete"]);
});

test("code dialog wraps the font link and scrolls its body on a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 560 });
  await page.goto("/create");
  await chooseOption(page, "font", "source-code");
  await page.getByRole("button", { name: "Get code" }).click();

  const dialog = page.locator("#create-code-dialog");
  const body = dialog.locator(".nyx-dialog-body");
  const fontCode = dialog.locator("[data-create-font-block] pre");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".nyx-dialog-footer")).toBeVisible();
  expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  expect(await fontCode.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
});

test("code dialog is a full-screen readable sheet on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/create");
  await page.getByRole("button", { name: "Customize" }).click();
  await page.getByRole("button", { name: "Get code" }).click();

  const dialog = page.locator("#create-code-dialog");
  await expect.poll(() => dialog.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
  })).toEqual({ x: 0, y: 0, width: 390, height: 844 });
  expect(await dialog.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  expect(await dialog.locator(".nyx-dialog-body").evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  await expect(dialog.getByRole("button", { name: "Copy share link" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Done" })).toBeVisible();
});

test("canvas uses two tablet columns and one phone column", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("/create");
  const tabletColumns = await page.locator(".create-masonry-column").count();
  expect(tabletColumns).toBe(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".create-canvas-grid")).toHaveAttribute("data-create-columns", "1");
  const phoneColumns = await page.locator(".create-masonry-column").count();
  expect(phoneColumns).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
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
  await expect(page.locator("[data-create-card]")).toHaveCount(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

  await page.getByRole("button", { name: "Customize" }).click();
  await expect(panel).toBeVisible();
  const panelBox = await panel.boundingBox();
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(panelBox).not.toBeNull();
  expect(panelBox!.x).toBe(0);
  expect(panelBox!.width).toBe(clientWidth);
  await expect(panel.getByRole("button", { name: "Get code" })).toBeVisible();
  await chooseOption(page, "accent", "plasma");
  await expect(page).toHaveURL(/accent=plasma/);
  await expect.poll(() => token(page, "--nyx-accent")).toBe("#8b7cf6");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
