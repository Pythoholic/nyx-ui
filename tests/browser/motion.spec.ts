import { expect, test, type Locator, type Page } from "@playwright/test";

function example(page: Page, name: string): Locator {
  return page.locator("[data-docs-example]", {
    has: page.getByRole("heading", { name, exact: true }),
  }).getByRole("tabpanel", { name: "Preview", exact: true });
}

test("overlays and modal surfaces use tokenized enter and exit transitions", async ({ page }) => {
  await page.goto("/components/overlays/dropdown-menu");
  const dropdown = example(page, "Dropdown menu");
  const menu = dropdown.locator("#nyx-action-menu");
  await dropdown.getByRole("button", { name: /Open menu/ }).click();
  await expect(menu).toBeVisible();
  const overlayMotion = await menu.evaluate((element) => {
    const style = getComputedStyle(element);
    return { opacity: style.opacity, scale: style.scale, transitionDuration: style.transitionDuration, transitionProperty: style.transitionProperty };
  });
  expect(overlayMotion.transitionProperty).toContain("opacity");
  expect(overlayMotion.transitionProperty).toContain("scale");
  expect(overlayMotion.transitionDuration).toContain("0.12s");
  await expect(menu).toHaveCSS("opacity", "1");
  await expect(menu).toHaveCSS("scale", "1");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  await page.goto("/components/overlays/drawer");
  const drawerDemo = example(page, "Drawer");
  const drawer = drawerDemo.locator("#nyx-example-drawer");
  await drawerDemo.getByRole("button", { name: "Open drawer" }).click();
  await expect(drawer).toBeVisible();
  const drawerMotion = await drawer.evaluate((element) => {
    const style = getComputedStyle(element);
    return { opacity: style.opacity, transitionDuration: style.transitionDuration, translate: style.translate };
  });
  expect(drawerMotion.transitionDuration).toContain("0.28s");
  await expect(drawer).toHaveCSS("opacity", "1");
  await expect(drawer).toHaveCSS("translate", "0px");
});

test("dismissed collection items leave semantics before their exit motion completes", async ({ page }) => {
  await page.goto("/components/feedback/notification-centre");
  const demo = example(page, "Workspace notifications");
  const result = await demo.locator(".nyx-notification").first().evaluate((item) => {
    item.querySelector<HTMLButtonElement>("[data-nyx-notification-dismiss]")?.click();
    const style = getComputedStyle(item);
    return {
      animationName: style.animationName,
      ariaHidden: item.getAttribute("aria-hidden"),
      inert: item.inert,
      motion: item.getAttribute("data-nyx-motion"),
    };
  });
  expect(result).toEqual({ animationName: "nyx-slide-out", ariaHidden: "true", inert: true, motion: "removing" });
  await expect(demo.locator('[data-nyx-motion="removing"]')).toHaveCount(0);
});

test("interactive, added, reordered, and loading states use restrained existing motion", async ({ page }) => {
  await page.goto("/components/actions/toggles");
  const toggleDemo = example(page, "Toggle patterns");
  const toggle = toggleDemo.getByRole("button", { name: "Pin inspector" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await toggle.evaluate((element) => getComputedStyle(element).transitionDuration)).toContain("0.12s");

  await page.goto("/components/forms/multi-select");
  const multiSelect = example(page, "Multi-select and tag input");
  const addedMotion = await multiSelect.getByRole("combobox", { name: "Add owning team" }).evaluate((input) => {
    input.value = "hel";
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    const tag = input.closest("[data-nyx-multi-select]")?.querySelector<HTMLElement>('[data-value="helix"]');
    return tag ? getComputedStyle(tag).animationName : "";
  });
  expect(addedMotion).toBe("nyx-fade-in");

  await page.goto("/components/data-display/advanced-data-table");
  const table = example(page, "Sortable deployment jobs");
  const reorderMotion = await table.locator('[data-nyx-data-table-sort="name"]').evaluate((button) => {
    button.click();
    const row = button.closest("table")?.querySelector<HTMLElement>("tbody tr[data-row-key]");
    return row ? getComputedStyle(row).animationName : "";
  });
  expect(reorderMotion).toBe("nyx-fade-in");

  await page.goto("/components/ai/generation-queue");
  const queue = example(page, "Render queue");
  await expect(queue.locator('.nyx-generation-item[data-state="running"] .nyx-generation-thumb')).toHaveCSS("animation-name", "nyx-pulse");
});

test("the global reduced-motion rule covers component transitions and animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/components/overlays/dropdown-menu");
  const demo = example(page, "Dropdown menu");
  const menu = demo.locator("#nyx-action-menu");
  await demo.getByRole("button", { name: /Open menu/ }).click();
  await expect(menu).toBeVisible();
  const durations = await menu.evaluate((element) => {
    const style = getComputedStyle(element);
    return { animation: style.animationDuration, transition: style.transitionDuration };
  });
  expect(durations.transition.split(", ").every((duration) => Number.parseFloat(duration) <= 0.001)).toBe(true);
});
