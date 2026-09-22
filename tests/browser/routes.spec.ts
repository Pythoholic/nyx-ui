import { expect, test, type Page } from "@playwright/test";
import { consolidatedRoutes, routePaths } from "../../apps/docs/src/routes.js";

// The route audit keeps one browser context so console failures can be attributed to the active
// path. Each route gets a fresh page, then is reflowed at both review widths.
test.describe.configure({ timeout: 180_000 });

interface ConsoleFailure {
  path: string;
  text: string;
}

function collectConsoleFailures(page: Page, path: string, failures: ConsoleFailure[]) {
  page.on("console", (message) => {
    if (message.type() === "error") failures.push({ path, text: message.text() });
  });
}

async function sidebarRoutes(page: Page): Promise<string[]> {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Documentation" });
  const routes = await navigation.locator("a[data-docs-path]").evaluateAll((links) =>
    Array.from(new Set(links.map((link) => (link as HTMLAnchorElement).dataset.docsPath).filter(Boolean))) as string[],
  );
  const expectedRoutes = Array.from(new Set(routePaths.map((path) => consolidatedRoutes[path] ?? path)));
  expect([...routes].sort(), "the sidebar contains every canonical route exactly once").toEqual([...expectedRoutes].sort());
  return routes;
}

const viewports = [
  { name: "2560x1440", width: 2560, height: 1440 },
  { name: "mobile", width: 390, height: 844 },
] as const;

test("every sidebar route renders cleanly and fits both review widths", async ({ context, page: sidebarPage }) => {
  await sidebarPage.setViewportSize(viewports[0]);
  const failures: ConsoleFailure[] = [];
  collectConsoleFailures(sidebarPage, "/", failures);
  const routes = await sidebarRoutes(sidebarPage);
  await sidebarPage.close();
  const routeDefects: string[] = [];
  const routeDefectDetails: string[] = [];

  for (const path of routes) {
    const page = await context.newPage();
    collectConsoleFailures(page, path, failures);
    try {
      await page.setViewportSize(viewports[0]);
      await page.goto(path);
      await expect(page.locator("[data-docs-page]"), `${path} renders its docs page`).toHaveAttribute("data-docs-page", path);
      const h1Count = await page.getByRole("heading", { level: 1 }).count();
      if (h1Count !== 1) {
        routeDefects.push(`${path}:h1-count`);
        routeDefectDetails.push(`${path} rendered ${h1Count} h1 elements`);
      }
      if (path.startsWith("/components/") && await page.locator(".docs-prose-section").count() === 0) {
        routeDefects.push(`${path}:missing-adoption-guidance`);
        routeDefectDetails.push(`${path} has no adoption, accessibility, state, or boundary guidance`);
      }

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
        const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (pageOverflow > 1) {
          routeDefects.push(`${path}:${viewport.name}:horizontal-overflow`);
          routeDefectDetails.push(`${path} overflowed by ${pageOverflow}px at ${viewport.name}`);
        }
      }
    } finally {
      await page.close();
    }
  }

  expect(failures, `console errors: ${JSON.stringify(failures, null, 2)}`).toEqual([]);
  expect(routeDefects, `route defects: ${JSON.stringify(routeDefectDetails)}`).toEqual([]);
});
