import { expect, test, type Locator, type Page } from "@playwright/test";

function tableExample(page: Page): Locator {
  const card = page.locator("[data-docs-example]", {
    has: page.getByRole("heading", { name: "Sortable deployment jobs", exact: true }),
  });
  return card.getByRole("tabpanel", { name: "Preview", exact: true });
}

function visibleRows(table: Locator): Locator {
  return table.locator("tbody tr[data-row-key]:visible");
}

test("sort direction alternates and aria-sort follows every click", async ({ page }) => {
  await page.goto("/components/data-display/advanced-data-table");
  const demo = tableExample(page);
  const table = demo.getByRole("table", { name: "Deployment jobs" });
  const sort = table.getByRole("button", { name: "Job" });
  const header = sort.locator("..");

  await sort.click();
  await expect(header).toHaveAttribute("aria-sort", "ascending");
  await expect(visibleRows(table).getByRole("rowheader")).toHaveText(["render-024", "render-025", "render-026"]);

  await sort.click();
  await expect(header).toHaveAttribute("aria-sort", "descending");
  await expect(visibleRows(table).getByRole("rowheader")).toHaveText(["render-029", "render-028", "render-027"]);
});

test("pagination hides rows beyond the page size", async ({ page }) => {
  await page.goto("/components/data-display/advanced-data-table");
  const demo = tableExample(page);
  const table = demo.getByRole("table", { name: "Deployment jobs" });
  const rows = table.locator("tbody tr[data-row-key]");

  await expect(rows).toHaveCount(6);
  await expect(visibleRows(table)).toHaveCount(3);
  await demo.getByRole("button", { name: "2", exact: true }).click();
  await expect(visibleRows(table)).toHaveCount(3);
  await expect(visibleRows(table).getByRole("rowheader")).toHaveText(["render-027", "render-028", "render-029"]);
  await expect(table.locator("tbody tr[data-row-key][hidden]")).toHaveCount(3);
});

test("row selection survives changing pages", async ({ page }) => {
  await page.goto("/components/data-display/advanced-data-table");
  const demo = tableExample(page);
  const table = demo.getByRole("table", { name: "Deployment jobs" });
  const selection = table.getByRole("checkbox", { name: "Select render-024" });

  await selection.check();
  await expect(selection).toBeChecked();
  await demo.getByRole("button", { name: "Next page" }).click();
  await expect(selection).not.toBeVisible();
  await demo.getByRole("button", { name: "Previous page" }).click();
  await expect(selection).toBeVisible();
  await expect(selection).toBeChecked();
});
