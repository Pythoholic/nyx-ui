import { expect, test, type Locator, type Page } from "@playwright/test";

function example(page: Page, name: string): Locator {
  return page.locator("[data-docs-example]", {
    has: page.getByRole("heading", { name, exact: true }),
  }).getByRole("tabpanel", { name: "Preview", exact: true });
}

test.use({ viewport: { width: 1440, height: 1000 } });

test("buttons keep one declared height when their contents differ", async ({ page }) => {
  await page.goto("/components/actions/command-bar");
  const buttons = example(page, "Document commands").locator(".nyx-command-bar-group").first().getByRole("button");
  const heights = await buttons.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));

  expect(new Set(heights).size, "plain and keyboard-shortcut buttons share a height").toBe(1);
  expect(heights[0], "small buttons use the declared 2.25rem height").toBe(36);
});

test("the documented accent is present in the first response and hydrated controls", async ({ page, request }) => {
  const response = await request.get("/");
  expect(await response.text()).toContain('data-nyx-theme="signal"');

  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-nyx-theme", "signal");
  await expect(page.getByRole("button", { name: "Signal", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Solar", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("toggle labels retain space before their control row", async ({ page }) => {
  await page.goto("/components/actions/toggles");
  const demo = example(page, "Toggle patterns");
  const legend = demo.getByText("View mode", { exact: true });
  const controls = demo.locator(".nyx-segmented");
  const [legendBox, controlsBox] = await Promise.all([legend.boundingBox(), controls.boundingBox()]);

  expect(legendBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  if (!legendBox || !controlsBox) return;
  expect(controlsBox.y - (legendBox.y + legendBox.height), "legend-to-control spacing").toBeGreaterThanOrEqual(7);
});

test("bulk selection bands keep usable vertical rhythm", async ({ page }) => {
  await page.goto("/components/actions/bulk-action-toolbar");
  const demo = example(page, "Deployment target actions");
  await demo.getByRole("checkbox", { name: /edge-tokyo-03/ }).check();

  const toolbar = demo.getByRole("toolbar", { name: "Selected target actions" });
  await expect(toolbar).toBeVisible();
  const metrics = await toolbar.evaluate((element) => {
    const item = element.parentElement?.querySelector<HTMLElement>(".nyx-bulk-item");
    if (!item) throw new Error("Bulk-selection list item did not render.");
    const toolbarStyles = getComputedStyle(element);
    const itemStyles = getComputedStyle(item);
    return {
      itemPaddingBottom: parseFloat(itemStyles.paddingBottom),
      itemPaddingTop: parseFloat(itemStyles.paddingTop),
      toolbarPaddingBottom: parseFloat(toolbarStyles.paddingBottom),
      toolbarPaddingTop: parseFloat(toolbarStyles.paddingTop),
    };
  });

  expect(metrics.toolbarPaddingTop).toBeGreaterThanOrEqual(16);
  expect(metrics.toolbarPaddingBottom).toBeGreaterThanOrEqual(16);
  expect(metrics.itemPaddingTop).toBeGreaterThanOrEqual(20);
  expect(metrics.itemPaddingBottom).toBeGreaterThanOrEqual(20);
});

test("paired text fields keep aligned controls and reserve feedback space", async ({ page }) => {
  await page.goto("/components/forms/text-fields");
  const demo = example(page, "Text fields");
  const invalid = demo.getByLabel("Invalid value");
  const disabled = demo.getByLabel("Disabled");
  const [invalidBox, disabledBox, invalidFieldBox, disabledFieldBox] = await Promise.all([
    invalid.boundingBox(),
    disabled.boundingBox(),
    invalid.locator("..").boundingBox(),
    disabled.locator("..").boundingBox(),
  ]);

  expect(invalidBox).not.toBeNull();
  expect(disabledBox).not.toBeNull();
  expect(invalidFieldBox).not.toBeNull();
  expect(disabledFieldBox).not.toBeNull();
  if (!invalidBox || !disabledBox || !invalidFieldBox || !disabledFieldBox) return;
  expect(Math.abs(invalidBox.y - disabledBox.y), "paired controls share a baseline").toBeLessThanOrEqual(1);
  expect(Math.abs(invalidFieldBox.height - disabledFieldBox.height), "both columns reserve a feedback row").toBeLessThanOrEqual(1);
});

test("card separators do not compound container and component spacing", async ({ page }) => {
  await page.goto("/components/primitives/static-primitives");
  const demo = example(page, "Avatar, card, separator, and keys");
  const [avatars, separator] = await Promise.all([
    demo.locator(".nyx-avatar-group").boundingBox(),
    demo.locator(".nyx-panel-body > .nyx-separator").boundingBox(),
  ]);

  expect(avatars).not.toBeNull();
  expect(separator).not.toBeNull();
  if (!avatars || !separator) return;
  const gap = separator.y - (avatars.y + avatars.height);
  expect(gap, "the separator uses only the panel-body gap").toBeGreaterThanOrEqual(12);
  expect(gap, "the separator does not add a second margin").toBeLessThanOrEqual(20);
});

test("notification rows keep internal breathing room", async ({ page }) => {
  await page.goto("/components/feedback/notification-centre");
  const notification = example(page, "Workspace notifications").locator(".nyx-notification").first();
  const metrics = await notification.evaluate((element) => {
    const body = element.querySelector<HTMLElement>(".nyx-notification-body");
    if (!body) throw new Error("Notification body did not render.");
    const rowStyles = getComputedStyle(element);
    const bodyStyles = getComputedStyle(body);
    return {
      columnGap: parseFloat(rowStyles.columnGap),
      paddingBottom: parseFloat(rowStyles.paddingBottom),
      paddingTop: parseFloat(rowStyles.paddingTop),
      rowGap: parseFloat(bodyStyles.rowGap),
    };
  });

  expect(metrics.paddingTop).toBeGreaterThanOrEqual(20);
  expect(metrics.paddingBottom).toBeGreaterThanOrEqual(20);
  expect(metrics.columnGap).toBeGreaterThanOrEqual(16);
  expect(metrics.rowGap).toBeGreaterThanOrEqual(12);
});

test("navigation peers share typography and color", async ({ page }) => {
  await page.goto("/components/navigation/navigation-menu");
  const demo = example(page, "Product navigation");
  const peers = [
    demo.getByRole("link", { name: "Overview", exact: true }),
    demo.getByRole("button", { name: /Products/ }),
    demo.getByRole("link", { name: "Changelog", exact: true }),
  ];
  const styles = await Promise.all(peers.map((peer) => peer.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, fontSize: style.fontSize, fontWeight: style.fontWeight, height: element.getBoundingClientRect().height };
  })));

  expect(styles[1]).toEqual(styles[0]);
  expect(styles[2]).toEqual(styles[0]);
});

test("notification links and buttons use one native action treatment", async ({ page }) => {
  await page.goto("/components/feedback/notification-centre");
  const demo = example(page, "Workspace notifications");
  const firstActions = demo.locator(".nyx-notification-actions").first();
  const actions = [
    firstActions.getByRole("link", { name: "View release" }),
    firstActions.getByRole("button", { name: "Mark notification read" }),
    firstActions.getByRole("button", { name: "Dismiss" }),
  ];
  const styles = await Promise.all(actions.map((action) => action.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderColor: style.borderColor,
      borderWidth: style.borderWidth,
      color: style.color,
      height: element.getBoundingClientRect().height,
      textDecoration: style.textDecorationLine,
      textTransform: style.textTransform,
    };
  })));

  expect(styles[1]).toEqual(styles[0]);
  expect(styles[2]).toEqual(styles[0]);
  await expect(demo.locator(".nyx-notification").nth(2).getByRole("button", { name: "Mark notification unread" })).toHaveText("Mark unread");
});
