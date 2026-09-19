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

test("tag variants preserve label sizing and solid-fill contrast", async ({ page }) => {
  await page.goto("/components/primitives/tags-chips");
  const demo = example(page, "Tag emphasis variants");
  const tags = demo.locator(".nyx-tag");
  await expect(tags).toHaveCount(12);
  await expect(tags.first()).toHaveCSS("font-size", "14px");
  await expect(demo.locator('.nyx-tag[data-variant="minimal"]')).toHaveCount(4);

  const ratios = await demo.locator('.nyx-tag[data-variant="solid"]').evaluateAll((elements) => {
    const luminance = (value: string): number => {
      const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
      const linear = channels.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    return elements.map((element) => {
      const style = getComputedStyle(element);
      const foreground = luminance(style.color);
      const background = luminance(style.backgroundColor);
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
  });
  expect(ratios.every((ratio) => ratio >= 4.5), `solid tag contrast ratios: ${ratios.join(", ")}`).toBe(true);
});

test("the icon inventory contains every Nyx interface symbol and no sample-only folder", async ({ page }) => {
  await page.goto("/components/primitives/icons");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Icons Nyx Uses");
  const labels = await page.locator(".nyx-icon-sample code").allTextContents();
  expect(labels).toEqual([
    "alert", "arrow-left", "arrow-right", "chevron-down", "check", "close", "grid", "image", "lock",
    "menu", "plus", "records", "search", "settings", "star", "upload", "user",
  ]);
});

test("native date and time controls use the Nyx surface without changing semantics", async ({ page }) => {
  await page.goto("/components/forms/range-date-time");
  const demo = example(page, "Range, date, and time");
  const date = demo.locator('input[type="date"]');
  const time = demo.locator('input[type="time"]');

  await expect(date).toHaveValue("2026-09-17");
  await expect(time).toHaveValue("17:30");
  const surfaces = await Promise.all([date, time].map((control) => control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      appearance: style.appearance,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderColor: style.borderColor,
      fontFamily: style.fontFamily,
      height: element.getBoundingClientRect().height,
    };
  })));
  expect({ ...surfaces[0], backgroundImage: undefined }).toEqual({ ...surfaces[1], backgroundImage: undefined });
  expect(surfaces[0].appearance).toBe("none");
  expect(surfaces[0].backgroundImage).not.toBe("none");
  expect(surfaces[1].backgroundImage).not.toBe("none");
  expect(surfaces[0].height).toBe(47);

  await date.focus();
  await expect(date).not.toHaveCSS("box-shadow", "none");
});

test("calendar examples identify their selection and week-start modes", async ({ page }) => {
  await page.goto("/components/forms/calendar");
  const demo = example(page, "Single date and range");
  const examples = demo.locator(".nyx-calendar-example");
  await expect(examples).toHaveCount(2);
  await expect(examples.nth(0).getByRole("heading", { name: /Single date.*Sunday start/ })).toBeVisible();
  await expect(examples.nth(1).getByRole("heading", { name: /Date range.*Monday start/ })).toBeVisible();
  await expect(examples.nth(0).locator("[data-nyx-calendar]")).not.toHaveAttribute("data-nyx-calendar-selection", "range");
  await expect(examples.nth(1).locator("[data-nyx-calendar]")).toHaveAttribute("data-nyx-calendar-week-start", "1");
});

test("application shell reuses sidebar navigation and separates content regions", async ({ page }) => {
  await page.goto("/components/layouts/application-shell");
  const demo = example(page, "Application shell");
  const nav = demo.getByRole("navigation", { name: "Workspace" });
  const links = nav.getByRole("link");

  await expect(links).toHaveCount(3);
  await expect(links.first()).toHaveAttribute("aria-current", "page");
  const metrics = await demo.evaluate((root) => {
    const link = root.querySelector<HTMLElement>(".nyx-sidebar-nav a");
    const topbar = root.querySelector<HTMLElement>(".nyx-app-content > .nyx-topbar");
    const main = root.querySelector<HTMLElement>(".nyx-app-main");
    if (!link || !topbar || !main) throw new Error("Application shell regions did not render.");
    const linkStyle = getComputedStyle(link);
    const topbarStyle = getComputedStyle(topbar);
    return {
      linkHeight: link.getBoundingClientRect().height,
      linkDisplay: linkStyle.display,
      topbarBorder: parseFloat(topbarStyle.borderBottomWidth),
      regionGap: main.getBoundingClientRect().y - topbar.getBoundingClientRect().bottom,
    };
  });

  expect(metrics.linkDisplay).toBe("flex");
  expect(metrics.linkHeight).toBeGreaterThanOrEqual(44);
  expect(metrics.topbarBorder).toBeGreaterThan(0);
  expect(metrics.regionGap).toBe(0);
});

test("sidebar stays inside its shell and makes rail changes legible", async ({ page }) => {
  await page.goto("/components/layouts/sidebar");
  const demo = example(page, "Sidebar");
  const shell = demo.locator("[data-nyx-sidebar]");
  const panel = shell.locator("[data-nyx-sidebar-panel]");
  const content = shell.locator(".nyx-app-content");
  const toggle = shell.getByRole("button", { name: "Toggle workspace navigation" });

  const [shellBox, panelBox, contentBox] = await Promise.all([shell.boundingBox(), panel.boundingBox(), content.boundingBox()]);
  expect(shellBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(contentBox).not.toBeNull();
  if (!shellBox || !panelBox || !contentBox) return;
  expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(contentBox.x + 1);
  expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(shellBox.x + shellBox.width + 1);
  await expect(shell.getByRole("button", { name: "Create record" })).toBeVisible();
  await expect(shell.getByRole("button", { name: "View activity" })).toBeVisible();

  const transition = await shell.evaluate((root) => ({
    grid: getComputedStyle(root).transitionProperty,
    label: getComputedStyle(root.querySelector<HTMLElement>("[data-nyx-sidebar-label]")!).transitionProperty,
  }));
  expect(transition.grid).toContain("grid-template-columns");
  expect(transition.label).toContain("opacity");

  await toggle.click();
  await expect(shell).toHaveAttribute("data-state", "collapsed");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
