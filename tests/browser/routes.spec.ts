import { expect, test, type Page } from "@playwright/test";

interface ConsoleFailure {
  path: string;
  text: string;
}

const knownRouteDefects: Record<string, string[]> = {
  "2560x1440": ["/components/layouts/application-shell:h1-count"],
  mobile: [
    "/components/data-display/metrics-records-activity:horizontal-overflow",
    "/components/layouts/application-shell:h1-count",
  ],
};

async function sidebarRoutes(page: Page): Promise<string[]> {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Documentation" });
  const routes = await navigation.locator("a[data-docs-path]").evaluateAll((links) =>
    Array.from(new Set(links.map((link) => (link as HTMLAnchorElement).dataset.docsPath).filter(Boolean))) as string[],
  );
  expect(routes, "the sidebar continues to enumerate the audited route set").toHaveLength(95);
  return routes;
}

for (const viewport of [
  { name: "2560x1440", width: 2560, height: 1440 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`every sidebar route renders without console errors or horizontal page scroll at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const failures: ConsoleFailure[] = [];
    let activePath = "/";
    page.on("console", (message) => {
      if (message.type() === "error") failures.push({ path: activePath, text: message.text() });
    });
    const routes = await sidebarRoutes(page);
    const routeDefects: string[] = [];
    const routeDefectDetails: string[] = [];

    for (const path of routes) {
      activePath = path;
      await page.goto(path);
      await expect(page.locator("[data-docs-page]"), `${path} renders its docs page`).toHaveAttribute("data-docs-page", path);
      const h1Count = await page.getByRole("heading", { level: 1 }).count();
      if (h1Count !== 1) {
        routeDefects.push(`${path}:h1-count`);
        routeDefectDetails.push(`${path} rendered ${h1Count} h1 elements`);
      }
      const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (pageOverflow > 1) {
        routeDefects.push(`${path}:horizontal-overflow`);
        routeDefectDetails.push(`${path} overflowed by ${pageOverflow}px`);
      }
    }

    expect(failures, `console errors at ${viewport.name}: ${JSON.stringify(failures, null, 2)}`).toEqual([]);
    expect(
      routeDefects,
      `known route defects changed at ${viewport.name}: ${JSON.stringify(routeDefectDetails)}`,
    ).toEqual(knownRouteDefects[viewport.name]);
  });
}
