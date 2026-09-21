import { expect, test, type Locator, type Page } from "@playwright/test";

function example(page: Page, name: string): Locator {
  const card = page.locator("[data-docs-example]", {
    has: page.getByRole("heading", { name, exact: true }),
  });
  return card.getByRole("tabpanel", { name: "Preview", exact: true });
}

async function expectSingleTabStop(root: Locator, selector: string): Promise<void> {
  await expect(root.locator(`${selector}[tabindex="0"]`)).toHaveCount(1);
}

test("tabs use roving focus with arrows and Home/End", async ({ page }) => {
  await page.goto("/components/navigation/tabs");
  const demo = example(page, "Tabs");
  const tablist = demo.getByRole("tablist", { name: "Record views" });
  const summary = tablist.getByRole("tab", { name: "Summary" });
  const events = tablist.getByRole("tab", { name: "Events" });
  await expectSingleTabStop(tablist, "[role='tab']");

  await summary.focus();
  await page.keyboard.press("ArrowRight");
  await expect(events).toBeFocused();
  await expect(events).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(summary).toBeFocused();
  await page.keyboard.press("End");
  await expect(events).toBeFocused();
  await expectSingleTabStop(tablist, "[role='tab']");
});

test("menubar uses one root tab stop and supports arrows and Home/End", async ({ page }) => {
  await page.goto("/components/navigation/menubar");
  const demo = example(page, "Application menubar");
  const menubar = demo.getByRole("menubar", { name: "Workspace commands" });
  const file = menubar.getByRole("menuitem", { name: "File" });
  const edit = menubar.getByRole("menuitem", { name: "Edit" });
  const view = menubar.getByRole("menuitem", { name: "View" });
  await expectSingleTabStop(menubar, ":scope > [role='menuitem']");

  await file.focus();
  await page.keyboard.press("ArrowRight");
  await expect(edit).toBeFocused();
  await page.keyboard.press("End");
  await expect(view).toBeFocused();
  await page.keyboard.press("Home");
  await expect(file).toBeFocused();
  await expectSingleTabStop(menubar, ":scope > [role='menuitem']");
});

test("tree navigation excludes collapsed descendants from its visible focus order", async ({ page }) => {
  await page.goto("/components/data-display/tree-view");
  const demo = example(page, "Workspace files");
  const tree = demo.getByRole("tree", { name: "Workspace files" });
  const item = (name: string) => tree.getByText(name, { exact: true }).locator("..").locator("..");
  const src = item("src");
  const components = item("components");
  const index = item("index.ts");
  const packageJson = item("package.json");
  await expectSingleTabStop(tree, "[role='treeitem']");

  await src.focus();
  await page.keyboard.press("ArrowDown");
  await expect(components).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(index).toBeFocused();
  await page.keyboard.press("Home");
  await expect(src).toBeFocused();
  await page.keyboard.press("End");
  await expect(packageJson).toBeFocused();
  await expect(item("button.ts")).toHaveAttribute("tabindex", "-1");
  await expect(item("components.test.ts")).toHaveAttribute("tabindex", "-1");
  await expectSingleTabStop(tree, "[role='treeitem']");
});

test("calendar grid uses one date tab stop and moves by day, week, Home, and End", async ({ page }) => {
  await page.goto("/components/forms/calendar");
  const demo = example(page, "Single date and range");
  const calendar = demo.locator("input[name='scheduled-date']").locator("..");
  const activeDate = () => calendar.locator("[data-nyx-calendar-date][tabindex='0']");
  await expectSingleTabStop(calendar, "[data-nyx-calendar-date]");

  await activeDate().focus();
  await page.keyboard.press("ArrowRight");
  await expect(activeDate()).toHaveAttribute("data-nyx-calendar-date", "2026-09-19");
  await page.keyboard.press("ArrowDown");
  await expect(activeDate()).toHaveAttribute("data-nyx-calendar-date", "2026-09-26");
  await page.keyboard.press("Home");
  await expect(activeDate()).toHaveAttribute("data-nyx-calendar-date", "2026-09-20");
  await page.keyboard.press("End");
  await expect(activeDate()).toHaveAttribute("data-nyx-calendar-date", "2026-09-26");
});

test("combobox keeps DOM focus on its input while arrows and Home/End move the active option", async ({ page }) => {
  await page.goto("/components/forms/combobox");
  const demo = example(page, "Deployment location");
  const input = demo.getByRole("combobox", { name: "Deployment location" });

  await input.focus();
  await page.keyboard.press("ArrowDown");
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-activedescendant", /option-1$/);
  await page.keyboard.press("ArrowDown");
  await expect(input).toHaveAttribute("aria-activedescendant", /option-2$/);
  await page.keyboard.press("End");
  await expect(input).toHaveAttribute("aria-activedescendant", /option-6$/);
  await page.keyboard.press("Home");
  await expect(input).toHaveAttribute("aria-activedescendant", /option-1$/);
});

test("carousel exposes only its active slide to keyboard users and activates controls from the keyboard", async ({ page }) => {
  await page.goto("/components/navigation/carousel");
  const demo = example(page, "Release highlights");
  const carousel = demo.getByRole("region", { name: "Release highlights" });
  const previous = carousel.getByRole("button", { name: "Previous" });
  const next = carousel.getByRole("button", { name: "Next" });
  const first = carousel.getByRole("group", { name: "1 of 3" });
  const second = carousel.getByRole("group", { name: "2 of 3" });

  await expect(first).toBeVisible();
  await expect(second).not.toBeVisible();
  await expect(previous).toBeDisabled();
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(first).not.toBeVisible();
  await expect(second).toBeVisible();
  await expect(previous).toBeEnabled();
  await expect(next).toBeFocused();
});

test("stepper maintains one tab stop while arrows and Home/End move among available steps", async ({ page }) => {
  await page.goto("/components/feedback/stepper");
  const demo = example(page, "Deployment setup");
  const stepper = demo.getByRole("region", { name: "Deployment setup" });
  const configure = stepper.getByRole("button", { name: "Configure" });
  const validate = stepper.getByRole("button", { name: "Validate" });
  const deploy = stepper.getByRole("button", { name: "Deploy" });
  await expectSingleTabStop(stepper, "[data-nyx-stepper-trigger]");
  await expect(deploy).toBeDisabled();

  await configure.focus();
  await page.keyboard.press("ArrowRight");
  await expect(validate).toBeFocused();
  await page.keyboard.press("Home");
  await expect(configure).toBeFocused();
  await page.keyboard.press("End");
  await expect(validate).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(validate).toHaveAttribute("aria-expanded", "true");
  await expect(deploy).toBeEnabled();
  await page.keyboard.press("End");
  await expect(deploy).toBeFocused();
  await expectSingleTabStop(stepper, "[data-nyx-stepper-trigger]");
});
