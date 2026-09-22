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

  await expect(page.getByRole("heading", { name: "Quarterly report for Tokyo operations", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Quarterly report for Tokyo operations, PDF", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download quarterly report for Tokyo operations", exact: true })).toBeVisible();

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
  await expectPage(page, "/", "Interface foundations for operational software");

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

test("registry guidance explains adoption, dependencies, ownership, and update responsibility", async ({ page }) => {
  await expectPage(page, "/guides/registry", "Registry and Open Code");
  await expect(page.getByRole("heading", { name: "Source you can inspect, adapt, and maintain" })).toBeVisible();
  await expect(page.locator(".docs-registry-steps > li")).toHaveCount(6);
  await expect(page.locator(".docs-registry-manifest")).toContainText("Requires");
  await expect(page.locator(".docs-registry-ownership")).toContainText("does not overwrite copied files or silently merge upstream changes");
});

test("AI integration renders its pilot contract from the registry", async ({ page }) => {
  await expectPage(page, "/guides/ai-integration", "AI Integration");
  await expect(page.locator(".docs-ai-flow > li")).toHaveCount(3);
  await expect(page.locator(".docs-ai-contract")).toContainText('"name": "tooltip"');
  await expect(page.locator(".docs-ai-contract")).toContainText('"function": "initTooltips"');
  await expect(page.locator(".docs-ai-contract-notes")).toContainText("components/tooltip.html");
  await expect(page.locator(".docs-ai-tools > li")).toHaveCount(4);
  await expect(page.locator(".docs-ai-skill")).toContainText("skills add Pythoholic/nyx-ui");
  await expect(page.locator(".docs-ai-agents > article")).toHaveCount(6);
  await expect(page.locator(".docs-ai-agents")).toContainText("Claude Code");
  await expect(page.locator(".docs-ai-connect")).toContainText(".codex/config.toml");
  await expect(page.locator(".docs-ai-connect")).toContainText(".mcp.json");
  await expect(page.locator(".docs-ai-connect")).toContainText("@nyx-ui/mcp@beta");
  await expect(page.locator(".docs-ai-boundary")).toContainText("Use the beta release");

  const exchangeCards = page.locator(".docs-ai-example > .docs-code");
  const requestBox = await exchangeCards.nth(0).boundingBox();
  const decisionBox = await exchangeCards.nth(1).boundingBox();
  expect(requestBox?.height).toBeLessThan(decisionBox?.height ?? 0);
  const horizontalOverflow = await exchangeCards.locator("pre").evaluateAll((elements) =>
    elements.map((element) => element.scrollWidth - element.clientWidth),
  );
  expect(horizontalOverflow.every((overflow) => overflow <= 1)).toBe(true);
});

test("motion examples show their resting state and can be replayed independently", async ({ page }) => {
  await expectPage(page, "/foundations/motion", "Motion Language");
  await expect(page.locator(".docs-motion-example")).toHaveCount(6);
  const panel = page.locator("#motion-spatial");
  await page.getByRole("button", { name: "Replay", exact: true }).nth(1).click();
  await expect(panel).toHaveCSS("animation-name", "docs-panel-arrival");
  const panelJourney = await panel.evaluate(element => {
    const animation = element.getAnimations()[0];
    if (!animation) throw new Error("Panel arrival animation is missing.");
    animation.pause();
    animation.currentTime = 0;
    const start = new DOMMatrixReadOnly(getComputedStyle(element).transform).m41;
    animation.currentTime = 280;
    const end = new DOMMatrixReadOnly(getComputedStyle(element).transform).m41;
    return { start, end };
  });
  expect(panelJourney.start).toBeGreaterThan(8);
  expect(panelJourney.start).toBeLessThan(20);
  expect(Math.abs(panelJourney.end)).toBeLessThan(0.1);
  const exit = page.locator("#motion-exit");
  await expect(exit).toBeVisible();
  await expect(exit).not.toHaveAttribute("data-motion-playing", "true");

  await page.getByRole("button", { name: "Replay", exact: true }).nth(3).click();
  await expect(page.locator("#motion-exit")).toHaveAttribute("data-motion-playing", "true");
  await expect(page.locator("#motion-exit")).toHaveCSS("animation-name", "nyx-slide-out");

  await page.getByRole("button", { name: /Replay all examples/ }).click();
  await expect(page.locator(".docs-motion-example [id^='motion-']")).toHaveCount(6);
});
