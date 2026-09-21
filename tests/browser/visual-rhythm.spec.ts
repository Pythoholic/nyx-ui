import { expect, test, type Locator, type Page } from "@playwright/test";

function example(page: Page, name: string): Locator {
  return page.locator("[data-docs-example]", {
    has: page.getByRole("heading", { name, exact: true }),
  }).getByRole("tabpanel", { name: "Preview", exact: true });
}

test.use({ viewport: { width: 1440, height: 1000 } });

test("documentation content shares a responsive measure", async ({ page }) => {
  const measure = async (width: number) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/guides/installation");
    await page.evaluate(() => document.fonts.ready);
    return page.locator(".docs-section").evaluate((section) => {
      const box = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Documentation measure target did not render: ${selector}`);
        return element.getBoundingClientRect();
      };
      const sectionBox = section.getBoundingClientRect();
      const introBox = box(".docs-intro");
      const proseBox = box(".docs-prose-section > p");
      const frameBox = box(".docs-prose-section > .docs-code");
      const headerBox = box(".docs-page-header");
      return {
        frameWidth: frameBox.width,
        headerWidth: headerBox.width,
        introWidth: introBox.width,
        leftEdges: [sectionBox.x, headerBox.x, introBox.x, proseBox.x, frameBox.x],
        proseWidth: proseBox.width,
        sectionWidth: sectionBox.width,
      };
    });
  };

  const measurements = [];
  for (const width of [390, 1280, 1920, 2560]) measurements.push(await measure(width));
  const [mobile, medium, wide, ultrawide] = measurements;

  for (const metrics of [mobile, medium, wide, ultrawide]) {
    expect(Math.max(...metrics.leftEdges) - Math.min(...metrics.leftEdges), "prose and frames share a left edge").toBeLessThanOrEqual(1);
    expect(metrics.headerWidth, "the header rule uses the content measure").toBeCloseTo(metrics.sectionWidth, 0);
    expect(metrics.frameWidth, "code frames use the content measure").toBeCloseTo(metrics.sectionWidth, 0);
  }
  expect(medium.sectionWidth, "the content column grows beyond mobile").toBeGreaterThan(mobile.sectionWidth);
  expect(wide.sectionWidth, "the content column responds between desktop widths").toBeGreaterThan(medium.sectionWidth);
  expect(ultrawide.sectionWidth, "the content column has one deliberate wide-screen cap").toBeCloseTo(wide.sectionWidth, 0);
  expect(wide.proseWidth, "long-form copy grows with the content column").toBeGreaterThan(medium.proseWidth);
  expect(ultrawide.proseWidth, "copy holds the shared measure once frames reach their cap").toBeCloseTo(ultrawide.frameWidth, 0);
  expect(ultrawide.introWidth, "intro copy holds the shared measure too").toBeCloseTo(ultrawide.frameWidth, 0);
  expect(wide.proseWidth, "copy ends where the frames beneath it end").toBeCloseTo(wide.frameWidth, 0);
  expect(ultrawide.proseWidth, "copy keeps matching the frame measure on wide screens").toBeCloseTo(ultrawide.frameWidth, 0);
  expect(mobile.introWidth, "narrow copy fills the available content column").toBeCloseTo(mobile.sectionWidth, 0);

  await page.setViewportSize({ width: 1920, height: 1000 });
  for (const [path, frameSelector] of [
    ["/components/actions/button", ".docs-grid"],
    ["/components/data-display/advanced-data-table", ".docs-table-wrap"],
  ] as const) {
    await page.goto(path);
    const edges = await page.locator(".docs-section").evaluate((section, selector) => {
      const frame = document.querySelector<HTMLElement>(selector);
      if (!frame) throw new Error(`Documentation frame did not render: ${selector}`);
      const sectionBox = section.getBoundingClientRect();
      const frameBox = frame.getBoundingClientRect();
      return { frameLeft: frameBox.x, frameRight: frameBox.right, sectionLeft: sectionBox.x, sectionRight: sectionBox.right };
    }, frameSelector);
    expect(Math.abs(edges.frameLeft - edges.sectionLeft), `${path} frame left edge`).toBeLessThanOrEqual(1);
    expect(Math.abs(edges.frameRight - edges.sectionRight), `${path} frame right edge`).toBeLessThanOrEqual(1);
  }
});

test("documentation copy grows consistently across guides and components", async ({ page }) => {
  for (const path of ["/guides/behavior", "/guides/installation", "/components/actions/button", "/components/forms/text-fields", "/components/overlays/dropdown-menu"]) {
    let previousWidth = 0;
    for (const width of [390, 1280, 1920, 2560]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.locator(".docs-section").evaluate(section => {
        const sectionBox = section.getBoundingClientRect();
        const copy = Array.from(section.querySelectorAll(".docs-intro, .docs-prose-section > :is(p, ol, ul), .docs-reference-section > :is(p, ol, ul)"));
        const intro = copy[0].getBoundingClientRect();
        return {
          width: intro.width,
          available: sectionBox.width,
          widths: copy.map(element => element.getBoundingClientRect().width),
          edges: copy.map(element => element.getBoundingClientRect().x - sectionBox.x),
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect(metrics.width, `${path} copy never narrows as the viewport grows`).toBeGreaterThanOrEqual(previousWidth);
      for (const copyWidth of metrics.widths) expect(copyWidth, `${path} uses one copy rule`).toBeCloseTo(metrics.width, 0);
      for (const edge of metrics.edges) expect(Math.abs(edge), `${path} copy shares the frame origin`).toBeLessThanOrEqual(1);
      expect(metrics.overflow).toBeLessThanOrEqual(1);
      if (width === 390) expect(metrics.width).toBeCloseTo(metrics.available, 0);
      previousWidth = metrics.width;
    }
  }
});

test("long documentation titles use the available header width", async ({ page }) => {
  for (const width of [1920, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/guides/behavior", "/components/forms/password-input", "/components/primitives/container-responsive-columns", "/components/ai/chat-thread"]) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const lines = await page.locator(".docs-title").evaluate(title => title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight));
      expect(lines, `${path} fits on one line at ${width}px`).toBeCloseTo(1, 1);
    }
  }
});

test("buttons keep one declared height when their contents differ", async ({ page }) => {
  await page.goto("/components/actions/command-bar");
  const buttons = example(page, "Document commands").locator(".nyx-command-bar-group").first().getByRole("button");
  const heights = await buttons.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));

  expect(new Set(heights).size, "plain and keyboard-shortcut buttons share a height").toBe(1);
  expect(heights[0], "small buttons use the declared 2.25rem height").toBe(36);
});

test("buttons and fields in compound form controls share a level continuous edge", async ({ page }) => {
  for (const path of ["/components/forms/text-fields", "/components/forms/date-picker"]) {
    for (const width of [1280, 1920, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const groups = page.locator("[data-example-preview] :is(.nyx-input-group, .nyx-date-picker-control)");
      await expect(groups).toHaveCount(1);
      const geometry = await groups.first().evaluate(group => {
        const controls = Array.from(group.children) as HTMLElement[];
        const boxes = controls.map(control => control.getBoundingClientRect());
        return {
          heights: boxes.map(box => box.height),
          seams: boxes.slice(1).map((box, index) => box.left - boxes[index].right),
        };
      });

      expect(Math.max(...geometry.heights) - Math.min(...geometry.heights), `${path} control levels at ${width}px`).toBeLessThanOrEqual(0.1);
      expect(geometry.seams.every(seam => seam <= 0 && seam >= -2), `${path} control seams at ${width}px`).toBe(true);
    }
  }
});

test("component documentation uses one major-section rhythm", async ({ page }) => {
  for (const path of [
    "/components/overlays/hover-card",
    "/components/overlays/dropdown-menu",
    "/components/forms/number-input",
  ]) {
    await page.goto(path);
    const gaps = await page.locator(".docs-section").evaluate(section => {
      const blocks = Array.from(section.children).filter(element => element.matches(
        ".docs-component-card, .docs-grid, .docs-prose-section, .docs-reference",
      ));
      return blocks.slice(1).map((block, index) => {
        const previous = blocks[index].getBoundingClientRect();
        const current = block.getBoundingClientRect();
        return current.top - previous.bottom;
      });
    });
    expect(gaps.every(gap => gap >= 47), `${path} major sections retain a 3rem interval`).toBe(true);
    const adjacentCode = page.locator(".docs-reference-section > .docs-code + .docs-code");
    if (await adjacentCode.count()) {
      const gap = await adjacentCode.first().evaluate(element => {
        const previous = element.previousElementSibling!.getBoundingClientRect();
        return element.getBoundingClientRect().top - previous.bottom;
      });
      expect(gap, `${path} adjacent code examples remain separated`).toBeGreaterThanOrEqual(15);
    }
  }
});

test("mixed data-display regions keep a consistent internal rhythm", async ({ page }) => {
  for (const width of [1280, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/components/data-display/metrics-records-activity");
    const gaps = await page.locator("[data-example-preview] .nyx-data-display-stack").evaluate(stack => {
      const regions = Array.from(stack.children);
      return regions.slice(1).map((region, index) => {
        const previous = regions[index].getBoundingClientRect();
        return region.getBoundingClientRect().top - previous.bottom;
      });
    });
    expect(gaps.length).toBe(5);
    expect(gaps.every(gap => Math.abs(gap - 24) <= 0.1), `data-display gaps at ${width}px`).toBe(true);
  }
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
  const precedingControls = demo.locator(".nyx-cluster");
  const legend = demo.getByText("View mode", { exact: true });
  const controls = demo.locator(".nyx-segmented");
  const [precedingBox, legendBox, controlsBox] = await Promise.all([
    precedingControls.boundingBox(),
    legend.boundingBox(),
    controls.boundingBox(),
  ]);

  expect(precedingBox).not.toBeNull();
  expect(legendBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  if (!precedingBox || !legendBox || !controlsBox) return;
  expect(legendBox.y - (precedingBox.y + precedingBox.height), "preceding-controls-to-legend spacing").toBeGreaterThanOrEqual(11);
  expect(controlsBox.y - (legendBox.y + legendBox.height), "legend-to-control spacing").toBeGreaterThanOrEqual(7);
});

test("password strength status sits below the full-width meter", async ({ page }) => {
  await page.goto("/components/forms/password-input");
  const demo = example(page, "Password strength and visibility");
  const meter = demo.locator(".nyx-password-meter");
  const status = demo.locator(".nyx-password-status");
  const feedback = demo.locator(".nyx-password-feedback");
  const [meterBox, statusBox, feedbackBox] = await Promise.all([
    meter.boundingBox(),
    status.boundingBox(),
    feedback.boundingBox(),
  ]);

  expect(meterBox).not.toBeNull();
  expect(statusBox).not.toBeNull();
  expect(feedbackBox).not.toBeNull();
  if (!meterBox || !statusBox || !feedbackBox) return;
  expect(statusBox.y).toBeGreaterThanOrEqual(meterBox.y + meterBox.height);
  expect(Math.abs(meterBox.width - feedbackBox.width), "meter fills feedback width").toBeLessThanOrEqual(1);
  await expect(status).toHaveText("Enter a password");
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
  const demo = example(page, "Release handoff anatomy");
  const [section, separator] = await Promise.all([
    demo.locator(".nyx-primitives-section").boundingBox(),
    demo.locator(".nyx-panel-body > .nyx-separator").boundingBox(),
  ]);

  expect(section).not.toBeNull();
  expect(separator).not.toBeNull();
  if (!section || !separator) return;
  const gap = separator.y - (section.y + section.height);
  expect(gap, "the separator uses only the panel-body gap").toBeGreaterThanOrEqual(12);
  expect(gap, "the separator does not add a second margin").toBeLessThanOrEqual(20);
});

test("static primitive anatomy keeps its examples separated", async ({ page }) => {
  await page.goto("/components/primitives/static-primitives");
  const demo = example(page, "Release handoff anatomy");
  const [panel, checklist] = await Promise.all([
    demo.locator(".nyx-panel").boundingBox(),
    demo.locator(".nyx-list-group").boundingBox(),
  ]);

  expect(panel).not.toBeNull();
  expect(checklist).not.toBeNull();
  if (!panel || !checklist) return;
  const horizontalGap = checklist.x - (panel.x + panel.width);
  const verticalGap = checklist.y - (panel.y + panel.height);
  expect(Math.max(horizontalGap, verticalGap), "the panel and checklist have a visible gutter").toBeGreaterThanOrEqual(16);
});

test("styled link patterns keep a consistent internal rhythm", async ({ page }) => {
  await page.goto("/components/primitives/styled-links");
  const demo = example(page, "Link hierarchy in context");
  const patterns = demo.locator(".nyx-link-pattern");

  await expect(patterns).toHaveCount(3);
  const metrics = await patterns.evaluateAll((elements) => elements.map((element) => {
    const styles = getComputedStyle(element);
    return {
      columnGap: parseFloat(styles.columnGap),
      paddingInline: parseFloat(styles.paddingInlineStart),
      rowGap: parseFloat(styles.rowGap),
    };
  }));
  for (const metric of metrics) {
    expect(metric.paddingInline).toBeGreaterThanOrEqual(20);
    expect(metric.rowGap).toBeGreaterThanOrEqual(12);
  }
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
  expect(surfaces[0].height).toBe(46);

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
  const links = nav.getByRole("button");

  await expect(links).toHaveCount(3);
  await expect(links.first()).toHaveAttribute("aria-current", "page");
  const metrics = await demo.evaluate((root) => {
    const link = root.querySelector<HTMLElement>(".nyx-sidebar-nav button");
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

  await links.nth(1).click();
  await expect(links.nth(1)).toHaveAttribute("aria-current", "page");
  await expect(demo.getByRole("heading", { name: "Recent deployments" })).toBeVisible();
  await expect(demo.getByRole("heading", { name: "Operational overview" })).toBeHidden();
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

  await panel.getByRole("link", { name: "Records" }).click();
  await expect(panel.getByRole("link", { name: "Records" })).toHaveAttribute("aria-current", "page");
  await expect(shell.getByRole("heading", { name: "Deployment records" })).toBeVisible();
  await expect(shell.locator("[data-nyx-shell-title]")).toHaveText("Records");

  await panel.getByRole("link", { name: "Settings" }).click();
  await expect(panel.getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
  await expect(shell.getByRole("heading", { name: "Workspace settings" })).toBeVisible();
  await expect(shell.getByRole("heading", { name: "Deployment records" })).toBeHidden();

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

test("sidebar destinations switch content at each desktop review width", async ({ page }) => {
  for (const width of [1280, 1920, 2560]) {
    await page.setViewportSize({ width, height: width === 2560 ? 1440 : 1080 });
    await page.goto("/components/layouts/sidebar");
    const demo = example(page, "Sidebar");
    const shell = demo.locator("[data-nyx-sidebar]");

    for (const destination of [
      { link: "Records", heading: "Deployment records" },
      { link: "Settings", heading: "Workspace settings" },
      { link: "Overview", heading: "System status" },
    ]) {
      const link = shell.getByRole("link", { name: destination.link });
      await link.click();
      await expect(link, `${destination.link} selected at ${width}px`).toHaveAttribute("aria-current", "page");
      await expect(shell.getByRole("heading", { name: destination.heading }), `${destination.link} panel at ${width}px`).toBeVisible();
    }
  }
});

test("resizable separators expose a visible responsive grip", async ({ page }) => {
  await page.goto("/components/layouts/resizable-panels");
  const demo = example(page, "Nested deployment workspace");
  const handle = demo.getByRole("separator", { name: "Resize release editor" });

  await expect(handle).toHaveCSS("cursor", "col-resize");
  const idle = await handle.evaluate((element) => {
    const grip = getComputedStyle(element, "::before");
    const style = getComputedStyle(element);
    return { background: grip.backgroundImage, blockSize: grip.blockSize, transition: style.transitionProperty };
  });
  expect(idle.background).toContain("radial-gradient");
  expect(parseFloat(idle.blockSize)).toBeGreaterThanOrEqual(32);
  expect(idle.transition).toContain("background-color");

  await handle.focus();
  const focused = await handle.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    gripColor: getComputedStyle(element, "::before").color,
  }));
  expect(focused.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(focused.gripColor).not.toBe("rgb(52, 65, 74)");

  const regionHandle = demo.getByRole("separator", { name: "Resize deployment regions" });
  const before = Number(await regionHandle.getAttribute("aria-valuenow"));
  const box = await regionHandle.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 60, { steps: 4 });
  await page.mouse.up();
  expect(Number(await regionHandle.getAttribute("aria-valuenow"))).toBeGreaterThan(before);

  await regionHandle.focus();
  const pointerValue = Number(await regionHandle.getAttribute("aria-valuenow"));
  await page.keyboard.press("ArrowUp");
  expect(Number(await regionHandle.getAttribute("aria-valuenow"))).toBeLessThan(pointerValue);
});

test("activity feed keeps avatars, copy, and the timeline on shared columns", async ({ page }) => {
  for (const width of [1280, 1920, 2560]) {
    await page.setViewportSize({ width, height: width === 2560 ? 1440 : 1080 });
    await page.goto("/components/data-display/activity-feed");
    await page.evaluate(() => document.fonts.ready);

    const demo = example(page, "Workspace activity");
    const metrics = await demo.locator(".nyx-activity-feed").evaluate((feed) => {
      const boxes = (selector: string) => [...feed.querySelectorAll<HTMLElement>(selector)].map((element) => element.getBoundingClientRect());
      const items = boxes(".nyx-activity-list:not([hidden]) .nyx-activity-item");
      const avatars = boxes(".nyx-activity-list:not([hidden]) .nyx-activity-item > .nyx-avatar");
      const bodies = boxes(".nyx-activity-list:not([hidden]) .nyx-activity-body");
      const firstItem = feed.querySelector<HTMLElement>(".nyx-activity-item");
      const firstAvatar = feed.querySelector<HTMLElement>(".nyx-activity-item > .nyx-avatar");
      const sentence = feed.querySelector<HTMLElement>(".nyx-activity-heading p");
      const inlineLink = sentence?.querySelector<HTMLElement>("a");
      if (!firstItem || !firstAvatar || !sentence || !inlineLink) throw new Error("Activity feed structure did not render.");
      const itemBox = firstItem.getBoundingClientRect();
      const avatarBox = firstAvatar.getBoundingClientRect();
      const list = feed.querySelector<HTMLElement>(".nyx-activity-list")!;
      const listStyle = getComputedStyle(list);
      return {
        itemLefts: items.map(({ left }) => left),
        avatarLefts: avatars.map(({ left }) => left),
        bodyLefts: bodies.map(({ left }) => left),
        avatarSizes: avatars.map(({ width, height }) => ({ width, height })),
        railCenter: itemBox.left + parseFloat(getComputedStyle(firstItem, "::after").insetInlineStart),
        avatarCenter: avatarBox.left + avatarBox.width / 2,
        sentenceFontSize: getComputedStyle(sentence).fontSize,
        linkFontSize: getComputedStyle(inlineLink).fontSize,
        overflow: feed.scrollWidth - feed.clientWidth,
        feedWidth: feed.getBoundingClientRect().width,
        listWidth: list.getBoundingClientRect().width,
        listPaddingStart: parseFloat(listStyle.paddingInlineStart),
        listPaddingEnd: parseFloat(listStyle.paddingInlineEnd),
      };
    });

    expect(new Set(metrics.itemLefts).size, `${width}px row starts`).toBe(1);
    expect(new Set(metrics.avatarLefts).size, `${width}px avatar column`).toBe(1);
    expect(new Set(metrics.bodyLefts).size, `${width}px content column`).toBe(1);
    for (const avatar of metrics.avatarSizes) expect(avatar.width, `${width}px avatar shape`).toBe(avatar.height);
    expect(Math.abs(metrics.railCenter - metrics.avatarCenter), `${width}px timeline alignment`).toBeLessThanOrEqual(1);
    expect(metrics.linkFontSize, `${width}px inline-link typography`).toBe(metrics.sentenceFontSize);
    expect(metrics.overflow, `${width}px activity feed overflow`).toBeLessThanOrEqual(0);
    expect(metrics.listWidth / metrics.feedWidth, `${width}px feed uses its card width`).toBeGreaterThan(0.99);
    expect(metrics.listPaddingStart, `${width}px activity feed has a substantial leading gutter`).toBeGreaterThanOrEqual(32);
    expect(metrics.listPaddingEnd, `${width}px activity feed gutters remain balanced`).toBeCloseTo(metrics.listPaddingStart, 1);
  }
});

test("activity feed composes compact file cards with exposed filenames", async ({ page }) => {
  await page.goto("/components/data-display/activity-feed");
  const demo = example(page, "Workspace activity");
  const feed = demo.locator("[data-nyx-activity-feed]");

  await expect(feed).toHaveAttribute("aria-label", "Workspace activity");
  await expect(feed.locator(".nyx-activity-header")).toHaveCount(0);
  const surface = await feed.evaluate((element) => {
    const style = getComputedStyle(element);
    return { borderWidth: style.borderWidth, backgroundColor: style.backgroundColor };
  });
  expect(surface.borderWidth).toBe("0px");
  expect(surface.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  await expect(feed.locator(".nyx-activity-files .nyx-file-item")).toHaveCount(2);
  await expect(feed.locator(".nyx-file-details strong")).toHaveText(["release-notes.pdf", "audit-sample.csv"]);
});

test("activity feed composes media thumbnails with an overflow count", async ({ page }) => {
  await page.goto("/components/data-display/activity-feed");
  const feed = example(page, "Workspace activity").locator("[data-nyx-activity-feed]");
  await expect(feed.locator(".nyx-activity-media .nyx-attachment-preview")).toHaveCount(3);
  await expect(feed.locator(".nyx-activity-overflow")).toContainText("+3");
});

test("activity feed renders status transitions inline", async ({ page }) => {
  await page.goto("/components/data-display/activity-feed");
  const feed = example(page, "Workspace activity").locator("[data-nyx-activity-feed]");
  await expect(feed.locator(".nyx-activity-heading .nyx-tag")).toHaveText("Completed");
});

test("activity feed distinguishes system actors from people", async ({ page }) => {
  await page.goto("/components/data-display/activity-feed");
  const feed = example(page, "Workspace activity").locator("[data-nyx-activity-feed]");
  await expect(feed.locator(".nyx-activity-icon")).toHaveCount(2);
  await expect(feed.getByText("Deployment pipeline completed checks", { exact: false })).toBeVisible();
});

test("activity feed uses shared real and fallback avatars with complete timestamps", async ({ page }) => {
  await page.goto("/components/data-display/activity-feed");
  const feed = example(page, "Workspace activity").locator("[data-nyx-activity-feed]");
  const photoAvatar = feed.locator("object.nyx-avatar");
  await expect(photoAvatar).toHaveAttribute("aria-label", "Akira K.");
  await expect(photoAvatar).toHaveAttribute("data", "/assets/activity-avatar-akira.svg");
  await expect(photoAvatar.locator("span")).toHaveText("AK");
  expect((await page.request.get("/assets/activity-avatar-akira.svg")).ok()).toBe(true);
  await expect(feed.locator("span.nyx-avatar").filter({ hasText: "SM" })).toHaveCount(1);
  await expect(feed.locator("time:not([datetime])")).toHaveCount(0);
  await expect(feed.getByText("Today", { exact: true })).toBeVisible();
});

test("activity feed reveals dated history and moves focus into it", async ({ page }) => {
  await page.goto("/components/data-display/activity-feed");
  const feed = example(page, "Workspace activity").locator("[data-nyx-activity-feed]");
  const toggle = feed.locator("[data-nyx-activity-toggle]");
  const history = feed.locator("[data-nyx-activity-history]");
  await expect(history).toBeHidden();
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(feed).toHaveAttribute("data-state", "expanded");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(history).toBeVisible();
  await expect(feed.getByText("May 04", { exact: true })).toBeVisible();
  await expect(history.locator("a").first()).toBeFocused();
  await toggle.click();
  await expect(history).toBeHidden();
  await expect(feed).toHaveAttribute("data-state", "collapsed");
});

test("activity feed status semantics remain distinct across accent themes", async ({ page }) => {
  await page.goto("/components/data-display/activity-feed");
  const feed = example(page, "Workspace activity").locator("[data-nyx-activity-feed]");
  for (const theme of ["solar", "signal", "flux", "plasma"]) {
    await page.locator("html").evaluate((root, value) => { root.dataset.nyxTheme = value; }, theme);
    const colors = await feed.evaluate((element) => {
      const tag = element.querySelector<HTMLElement>(".nyx-tag[data-tone='success']")!;
      const badge = element.querySelector<HTMLElement>(".nyx-badge[data-tone='success']")!;
      const probe = document.createElement("span");
      probe.style.color = "var(--nyx-signal)";
      element.append(probe);
      const success = getComputedStyle(probe).color;
      probe.style.color = "var(--nyx-accent)";
      const accent = getComputedStyle(probe).color;
      probe.remove();
      return { tag: getComputedStyle(tag).color, badge: getComputedStyle(badge).color, success, accent };
    });
    expect(colors.tag, `${theme} inline status`).toBe(colors.success);
    expect(colors.badge, `${theme} pipeline status`).toBe(colors.success);
    expect(colors.success, `${theme} semantic status differs from accent`).not.toBe(colors.accent);
  }
});

test("activity feed payloads align with the sentence above them", async ({ page }) => {
  for (const width of [1280, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1400 });
    await page.goto("/components/data-display/activity-feed");
    await page.evaluate(() => document.fonts.ready);
    const edges = await page.locator(".nyx-activity-feed").evaluate((feed) => {
      const left = (selector: string) => {
        const element = feed.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Activity feed payload did not render: ${selector}`);
        return Math.round(element.getBoundingClientRect().left);
      };
      const avatar = feed.querySelector<HTMLElement>(".nyx-avatar");
      if (!avatar) throw new Error("Activity feed avatar did not render");
      const avatarBox = avatar.getBoundingClientRect();
      return {
        heading: left(".nyx-activity-heading p"),
        fileCard: left(".nyx-activity-files > *"),
        mediaCard: left(".nyx-activity-media > *"),
        meta: left(".nyx-activity-meta"),
        connector: Math.round(avatarBox.left + avatarBox.width / 2),
      };
    });
    const values = [edges.heading, edges.fileCard, edges.mediaCard, edges.meta];
    expect(
      Math.max(...values) - Math.min(...values),
      `payloads share the sentence's left edge at ${width}px: ${JSON.stringify(edges)}`,
    ).toBeLessThanOrEqual(1);
    // The connector runs down the middle of the avatar column, so bordered payloads must clear
    // it rather than sitting against the line.
    expect(
      Math.min(...values) - edges.connector,
      `payloads clear the timeline connector at ${width}px: ${JSON.stringify(edges)}`,
    ).toBeGreaterThanOrEqual(44);
  }
});
