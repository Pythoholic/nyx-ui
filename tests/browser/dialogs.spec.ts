import { expect, test, type Locator, type Page } from "@playwright/test";

function example(page: Page, name: string): Locator {
  const card = page.locator("[data-docs-example]", {
    has: page.getByRole("heading", { name, exact: true }),
  });
  return card.getByRole("tabpanel", { name: "Preview", exact: true });
}

async function expectLock(page: Page, locked: boolean): Promise<void> {
  if (locked) await expect(page.locator("body")).toHaveAttribute("data-nyx-scroll-locked", "true");
  else await expect(page.locator("body")).not.toHaveAttribute("data-nyx-scroll-locked", "true");
}

async function expectDismissibleDialog(options: {
  page: Page;
  path: string;
  exampleName: string;
  triggerName: string | RegExp;
  dialogName: string;
}): Promise<void> {
  const { page, path, exampleName, triggerName, dialogName } = options;
  await page.goto(path);
  const demo = example(page, exampleName);
  const trigger = demo.getByRole("button", { name: triggerName });
  const dialog = demo.getByRole("dialog", { name: dialogName });

  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await expectLock(page, true);

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expectLock(page, false);
  await expect(trigger).toBeFocused();
}

test("dialog moves focus, owns scroll lock, and restores its trigger", async ({ page }) => {
  await expectDismissibleDialog({
    page,
    path: "/components/overlays/dialog",
    exampleName: "Dialog",
    triggerName: "Open dialog",
    dialogName: "Apply configuration?",
  });
});

test("modal scroll locking preserves the page geometry", async ({ page }) => {
  for (const width of [1280, 1920, 2560]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/components/overlays/dialog");
    const content = page.locator(".docs-section");
    const before = await content.boundingBox();
    expect(before).not.toBeNull();

    await page.getByRole("button", { name: "Open dialog", exact: true }).click();
    const during = await content.boundingBox();
    expect(during).not.toBeNull();
    if (!before || !during) continue;
    expect(Math.abs(during.x - before.x), `content x-position while locked at ${width}px`).toBeLessThanOrEqual(0.1);
    expect(Math.abs(during.width - before.width), `content width while locked at ${width}px`).toBeLessThanOrEqual(0.1);

    await page.keyboard.press("Escape");
    const after = await content.boundingBox();
    expect(after).not.toBeNull();
    if (!after) continue;
    expect(Math.abs(after.x - before.x), `content x-position after unlock at ${width}px`).toBeLessThanOrEqual(0.1);
    expect(Math.abs(after.width - before.width), `content width after unlock at ${width}px`).toBeLessThanOrEqual(0.1);
  }
});

test("drawer moves focus, closes on real Escape, and restores its trigger", async ({ page }) => {
  await expectDismissibleDialog({
    page,
    path: "/components/overlays/drawer",
    exampleName: "Drawer",
    triggerName: "Open drawer",
    dialogName: "Record details",
  });
});

test("command palette moves focus, closes on real Escape, and restores its trigger", async ({ page }) => {
  await expectDismissibleDialog({
    page,
    path: "/components/overlays/command-palette",
    exampleName: "Command palette",
    triggerName: /Open command palette/,
    dialogName: "Command palette",
  });
});

test("alert dialog keeps destructive Escape opt-out and restores focus after its safe action", async ({ page }) => {
  await page.goto("/components/overlays/alert-dialog");
  const demo = example(page, "Alert dialog");
  const trigger = demo.getByRole("button", { name: "Delete environment" });
  const dialog = demo.getByRole("alertdialog", { name: "Delete environment?" });
  const cancel = dialog.getByRole("button", { name: "Cancel" });

  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(cancel).toBeFocused();
  await expectLock(page, true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expectLock(page, true);

  await cancel.click();
  await expect(dialog).not.toBeVisible();
  await expectLock(page, false);
  await expect(trigger).toBeFocused();
});

test("closing an inner dialog retains the outer dialog scroll lock", async ({ page }) => {
  await page.goto("/components/overlays/dialog");
  const demo = example(page, "Dialog");
  const trigger = demo.getByRole("button", { name: "Open dialog" });
  const outer = demo.getByRole("dialog", { name: "Apply configuration?" });
  const inner = page.getByRole("dialog", { name: "Search documentation" });

  await trigger.click();
  await expect(outer).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(inner).toBeVisible();
  await expectLock(page, true);

  await page.keyboard.press("Escape");
  await expect(inner).not.toBeVisible();
  await expect(outer).toBeVisible();
  await expectLock(page, true);

  await page.keyboard.press("Escape");
  await expect(outer).not.toBeVisible();
  await expectLock(page, false);
  await expect(trigger).toBeFocused();
});
