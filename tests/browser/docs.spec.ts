import { expect, test, type Page } from "@playwright/test";

const contractedViewportWidths = [390, 768, 1280, 1440, 2560] as const;

async function expectPage(page: Page, path: string, title: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator(".docs-title")).toHaveText(title);
  await expect(page.locator("[data-docs-page]")).toHaveAttribute("data-docs-page", path);
}

test("the documentation shell remains bounded and functional type remains stable", async ({ page }) => {
  let buttonFontSize: string | undefined;
  let copyFontSize: string | undefined;

  for (const width of contractedViewportWidths) {
    await page.setViewportSize({ width, height: width === 2560 ? 1440 : 900 });
    await expectPage(page, "/components/actions/button", "Button");

    const metrics = await page.evaluate(() => {
      const button = document.querySelector<HTMLElement>("[data-example-preview] .nyx-button");
      const copyButton = document.querySelector<HTMLElement>(".docs-copy-button");
      if (!button || !copyButton) throw new Error("The Button example did not render its functional controls.");

      return {
        buttonFontSize: getComputedStyle(button).fontSize,
        copyFontSize: getComputedStyle(copyButton).fontSize,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    expect(metrics.overflow, `page overflow at ${width}px`).toBeLessThanOrEqual(1);
    buttonFontSize ??= metrics.buttonFontSize;
    copyFontSize ??= metrics.copyFontSize;
    expect(metrics.buttonFontSize, `button type changed at ${width}px`).toBe(buttonFontSize);
    expect(metrics.copyFontSize, `copy-button type changed at ${width}px`).toBe(copyFontSize);
  }
});

test("the focusable visually-hidden utility is bounded and returns to natural flow on focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expectPage(page, "/components/primitives/visually-hidden", "Visually Hidden");
  const skipLink = page.locator("[data-example-preview] .nyx-visually-hidden-focusable");

  for (const direction of ["ltr", "rtl"] as const) {
    await page.locator("html").evaluate((element, dir) => { element.dir = dir; }, direction);
    const hiddenStyles = await skipLink.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        clipPath: styles.clipPath,
        insetInlineStart: styles.insetInlineStart,
        position: styles.position,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    expect(hiddenStyles.position, `${direction} hidden positioning`).toBe("absolute");
    expect(hiddenStyles.insetInlineStart, `${direction} logical inline anchor`).toBe("0px");
    expect(hiddenStyles.clipPath, `${direction} hidden clipping`).not.toBe("none");
    expect(hiddenStyles.overflow, `${direction} page overflow`).toBeLessThanOrEqual(1);

    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveCSS("position", "static");
    await expect(skipLink).toHaveCSS("clip-path", "none");
    const focusedBox = await skipLink.boundingBox();
    expect(focusedBox?.width, `${direction} focused width`).toBeGreaterThan(1);
    expect(focusedBox?.height, `${direction} focused height`).toBeGreaterThan(1);
    await skipLink.evaluate((element) => element.blur());
  }
});

test("tabbed examples copy canonical source and survive client-side page cleanup", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await expectPage(page, "/components/actions/button", "Button");

  const example = page.locator("[data-docs-example]").first();
  const previewTab = example.getByRole("tab", { name: "Preview" });
  const htmlTab = example.getByRole("tab", { name: "HTML" });
  const source = example.locator("[data-nyx-code-source]");
  const copy = example.locator("[data-nyx-code-copy]");

  await expect(previewTab).toHaveAttribute("aria-selected", "true");
  await expect(source).not.toBeVisible();
  await htmlTab.click();
  await expect(htmlTab).toHaveAttribute("aria-selected", "true");
  await expect(source).toBeVisible();

  const canonicalSource = await source.textContent();
  await copy.click();
  await expect(copy).toHaveAttribute("data-state", "copied");
  await expect.poll(async () => (await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n"))
    .toBe(canonicalSource?.replaceAll("\r\n", "\n"));

  await page.locator("a[data-docs-path='/components/overlays/dialog']").evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page).toHaveURL(/\/components\/overlays\/dialog$/);
  await expect(page.locator(".docs-title")).toHaveText("Dialog");

  await page.goBack();
  await expect(page).toHaveURL(/\/components\/actions\/button$/);
  const restoredCopy = page.locator("[data-docs-example] [data-nyx-code-copy]").first();
  await expect(restoredCopy).toHaveAttribute("data-state", "idle");
  await restoredCopy.click();
  await expect(restoredCopy).toHaveAttribute("data-state", "copied");
});

test("the command palette supports keyboard-only navigation", async ({ page }) => {
  await expectPage(page, "/", "Foundations, components, motion, and application patterns.");

  await page.keyboard.press("Control+k");
  const palette = page.locator("#docs-command-palette");
  const search = palette.getByRole("combobox");
  await expect(palette).toHaveAttribute("data-state", "open");
  await expect(search).toBeFocused();
  await expect(search).toHaveAttribute("aria-expanded", "true");

  await search.fill("date picker");
  await page.keyboard.press("ArrowDown");
  const activeId = await search.getAttribute("aria-activedescendant");
  expect(activeId).toBeTruthy();
  await expect(page.locator(`#${activeId}`)).toContainText("Date Picker");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/components\/forms\/date-picker$/);
  await expect(page.locator(".docs-title")).toHaveText("Date Picker");
  await expect(palette).not.toHaveAttribute("open", "");
});

test("dialog keyboard dismissal restores state, scroll ownership, and focus", async ({ page }) => {
  await expectPage(page, "/components/overlays/dialog", "Dialog");

  const trigger = page.getByRole("button", { name: "Open dialog", exact: true });
  const dialog = page.locator("#nyx-example-dialog");
  await trigger.click();

  await expect(dialog).toHaveJSProperty("open", true);
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("body")).toHaveAttribute("data-nyx-scroll-locked", "true");
  await expect(page.locator("#nyx-example-change-note")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");

  await expect(dialog).toHaveJSProperty("open", false);
  await expect(dialog).toHaveAttribute("data-state", "closed");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("body")).not.toHaveAttribute("data-nyx-scroll-locked", "true");
  await expect(trigger).toBeFocused();
});

test("the three-page voice sample gives adoption guidance at different component scales", async ({ page }) => {
  const samples = [
    { path: "/components/primitives/blockquote", heading: "Choose it for quoted material", phrase: "Start with the native" },
    { path: "/components/overlays/dropdown-menu", heading: "Use a menu for compact command sets", phrase: "Keep frequent or high-consequence actions visible" },
    { path: "/components/ai/generation-queue", heading: "Keep transport outside the queue", phrase: "Give every job a stable identifier" },
  ];

  for (const sample of samples) {
    await page.goto(sample.path);
    const guidance = page.locator(".docs-prose-section");
    await expect(guidance.getByRole("heading", { name: sample.heading })).toBeVisible();
    await expect(guidance).toContainText(sample.phrase);
  }
});
