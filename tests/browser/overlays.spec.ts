import { expect, test, type Locator, type Page } from "@playwright/test";

function example(page: Page, name: string): Locator {
  const card = page.locator("[data-docs-example]", {
    has: page.getByRole("heading", { name, exact: true }),
  });
  return card.getByRole("tabpanel", { name: "Preview", exact: true });
}

test.use({ viewport: { width: 2560, height: 1440 } });

async function expectOverlayWithinViewport(page: Page, panel: Locator): Promise<void> {
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  const viewport = page.viewportSize();
  expect(box, "the open panel has a layout box").not.toBeNull();
  expect(viewport, "the test uses a fixed viewport").not.toBeNull();
  if (!box || !viewport) return;

  expect(box.x, "panel is not placed at the viewport origin").toBeGreaterThan(1);
  expect(box.y, "panel is not placed at the viewport origin").toBeGreaterThan(1);
  expect(box.x + box.width, "panel right edge stays in the viewport").toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height, "panel bottom edge stays in the viewport").toBeLessThanOrEqual(viewport.height + 1);

  const overflow = await panel.evaluate((element) => ({
    horizontal: element.scrollWidth - element.clientWidth,
    vertical: element.scrollHeight - element.clientHeight,
  }));
  expect(overflow.horizontal, "panel has no horizontal scrollbar").toBeLessThanOrEqual(1);
  expect(overflow.vertical, "panel has no vertical scrollbar").toBeLessThanOrEqual(1);
}

async function expectAnchored(trigger: Locator, panel: Locator, maximumGap = 16): Promise<void> {
  const triggerBox = await trigger.boundingBox();
  const panelBox = await panel.boundingBox();
  const viewport = trigger.page().viewportSize();
  expect(triggerBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(viewport, "the test uses a fixed viewport").not.toBeNull();
  if (!triggerBox || !panelBox || !viewport) return;

  expect(panelBox.width, "panel remains materially narrower than the page").toBeLessThan(viewport.width * 0.5);

  const triggerEdges = [triggerBox.x, triggerBox.x + triggerBox.width / 2, triggerBox.x + triggerBox.width];
  const panelEdges = [panelBox.x, panelBox.x + panelBox.width / 2, panelBox.x + panelBox.width];
  const horizontalAlignment = Math.min(
    ...triggerEdges.flatMap((triggerEdge) => panelEdges.map((panelEdge) => Math.abs(triggerEdge - panelEdge))),
  );
  expect(horizontalAlignment, "a panel edge or centre stays horizontally aligned with its trigger").toBeLessThanOrEqual(maximumGap);

  const horizontalGap = Math.max(
    triggerBox.x - (panelBox.x + panelBox.width),
    panelBox.x - (triggerBox.x + triggerBox.width),
    0,
  );
  const verticalGap = Math.max(
    triggerBox.y - (panelBox.y + panelBox.height),
    panelBox.y - (triggerBox.y + triggerBox.height),
    0,
  );
  expect(Math.hypot(horizontalGap, verticalGap), "panel remains adjacent to its trigger").toBeLessThanOrEqual(maximumGap);
}

test("dropdown positioning follows its trigger relationship", async ({ page }) => {
  await page.goto("/components/overlays/dropdown-menu");
  const demo = example(page, "Dropdown menu");
  const trigger = demo.getByRole("button", { name: /Open menu/ });
  const panel = demo.getByRole("menu", { name: /Open menu/ });

  await trigger.click();
  await expectOverlayWithinViewport(page, panel);
  const triggerBox = await trigger.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  if (!triggerBox || !panelBox) return;
  const gap = panelBox.y - (triggerBox.y + triggerBox.height);
  expect(gap, "dropdown opens just below its trigger").toBeGreaterThan(0);
  expect(gap, "dropdown gap stays small").toBeLessThanOrEqual(12);
  expect(Math.abs(panelBox.x - triggerBox.x), "dropdown and trigger left edges align").toBeLessThanOrEqual(2);
});

test("dropdown flips above a trigger near the viewport edge", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  await page.goto("/components/overlays/dropdown-menu");
  const demo = example(page, "Dropdown menu");
  const trigger = demo.getByRole("button", { name: /Open menu/ });
  const panel = demo.getByRole("menu", { name: /Open menu/ });
  await trigger.evaluate((element) => element.scrollIntoView({ block: "end" }));
  await trigger.click();

  await expectOverlayWithinViewport(page, panel);
  const triggerBox = await trigger.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  if (!triggerBox || !panelBox) return;
  expect(panelBox.y + panelBox.height, "the menu flips above the edge-adjacent trigger").toBeLessThanOrEqual(triggerBox.y + 1);
});

test("context menu anchors to the real pointer location", async ({ page }) => {
  await page.goto("/components/overlays/context-menu");
  const demo = example(page, "Context menu");
  const target = demo.getByText(/Right-click here/, { exact: true });
  const panel = demo.getByRole("menu", { name: "Canvas actions" });
  const targetBox = await target.boundingBox();
  expect(targetBox).not.toBeNull();
  if (!targetBox) return;
  const position = { x: 48, y: 32 };

  await target.click({ button: "right", position });
  await expectOverlayWithinViewport(page, panel);
  const panelBox = await panel.boundingBox();
  expect(panelBox).not.toBeNull();
  if (!panelBox) return;
  const pointer = { x: targetBox.x + position.x, y: targetBox.y + position.y };
  const xDistance = Math.max(panelBox.x - pointer.x, pointer.x - (panelBox.x + panelBox.width), 0);
  const yDistance = Math.max(panelBox.y - pointer.y, pointer.y - (panelBox.y + panelBox.height), 0);
  expect(Math.hypot(xDistance, yDistance), "menu is adjacent to the invocation point").toBeLessThanOrEqual(16);
});

test("menubar panel anchors to its active trigger", async ({ page }) => {
  await page.goto("/components/navigation/menubar");
  const demo = example(page, "Application menubar");
  const menubar = demo.getByRole("menubar", { name: "Workspace commands" });
  const trigger = menubar.getByRole("menuitem", { name: "File", exact: true });
  const panel = demo.getByRole("menu", { name: "File" });

  await trigger.click();
  await expectOverlayWithinViewport(page, panel);
  await expectAnchored(trigger, panel);
});

test("hover card opens from a real hover and remains anchored", async ({ page }) => {
  await page.goto("/components/overlays/hover-card");
  const demo = example(page, "Operator hover card");
  const trigger = demo.getByRole("link", { name: "Mira Chen" });
  const panel = demo.locator("[data-nyx-hover-card]");

  await trigger.hover();
  await expectOverlayWithinViewport(page, panel);
  await expectAnchored(trigger, panel);
});

test("combobox popover stays anchored and bounded", async ({ page }) => {
  await page.goto("/components/forms/combobox");
  const demo = example(page, "Combobox");
  const trigger = demo.getByRole("combobox", { name: "Deployment location" });
  const panel = demo.getByRole("listbox", { name: "Deployment locations" });

  await trigger.click();
  await expectOverlayWithinViewport(page, panel);
  await expectAnchored(trigger, panel);
});

test("tooltip opens from a real hover and stays anchored", async ({ page }) => {
  await page.goto("/components/overlays/tooltip");
  const demo = example(page, "Tooltip provider");
  const trigger = demo.getByRole("button", { name: "Settings" });
  const panel = demo.getByRole("tooltip", { name: "Manage workspace settings" });

  await trigger.hover();
  await expectOverlayWithinViewport(page, panel);
  await expectAnchored(trigger, panel);
});

test("date picker panel stays anchored and bounded", async ({ page }) => {
  await page.goto("/components/forms/date-picker");
  const demo = example(page, "Date picker");
  const trigger = demo.getByRole("button", { name: "Choose deployment date" });
  const panel = demo.getByRole("dialog", { name: "Choose deployment date" });

  await trigger.click();
  await expectOverlayWithinViewport(page, panel);
  await expectAnchored(trigger, panel);
});
