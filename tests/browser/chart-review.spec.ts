import { expect, test } from "@playwright/test";

const themes = ["solar", "signal", "flux", "plasma"];
const viewports = [{ width: 2560, height: 1440 }, { width: 1920, height: 1080 }, { width: 1280, height: 720 }];

for (const theme of themes) {
  test(`accent differs from semantic colours: ${theme}`, async ({ page }) => {
    await page.goto("/components/visualization/bar-chart");
    const colors = await page.evaluate(theme => {
      document.documentElement.dataset.nyxTheme = theme;
      const probe = document.createElement("span");
      document.body.append(probe);
      const colors = ["accent", "signal", "info", "warning", "danger"].map(token => {
        probe.style.color = `var(--nyx-${token})`;
        return getComputedStyle(probe).color;
      });
      probe.remove();
      return colors;
    }, theme);
    expect(new Set(colors).size).toBe(colors.length);
  });

  test(`chart series have different colours at review widths: ${theme}`, async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/components/visualization/bar-chart");
      await page.evaluate(theme => { document.documentElement.dataset.nyxTheme = theme; }, theme);
      const colors = await page.locator("[data-example-preview] .nyx-chart > .nyx-chart-bar").evaluateAll(bars => bars.map(bar => getComputedStyle(bar).fill));
      expect(colors).toHaveLength(6);
      expect(colors[0]).not.toBe(colors[1]);
      expect(colors).toEqual([colors[0], colors[1], colors[0], colors[1], colors[0], colors[1]]);
      // A consumer may deliberately share its action/status colours. Categorical
      // data must retain its own palette even in that scope.
      await page.locator("[data-example-preview]").evaluate(element => {
        for (const token of ["accent", "signal", "info"]) (element as HTMLElement).style.setProperty(`--nyx-${token}`, "#ffffff");
      });
      const independentColors = await page.locator("[data-example-preview] .nyx-chart > .nyx-chart-bar").evaluateAll(bars => bars.map(bar => getComputedStyle(bar).fill));
      expect(independentColors).toEqual(colors);
    }
  });

  test(`chart series have different outlines: ${theme}`, async ({ page }) => {
    await page.goto("/components/visualization/bar-chart");
    await page.evaluate(theme => { document.documentElement.dataset.nyxTheme = theme; }, theme);
    const styles = await page.locator("[data-example-preview] .nyx-chart > .nyx-chart-bar").evaluateAll(bars => bars.slice(0, 2).map(bar => {
      const style = getComputedStyle(bar);
      return { stroke: style.stroke, width: parseFloat(style.strokeWidth), dash: style.strokeDasharray };
    }));
    expect(styles[0].dash).not.toBe(styles[1].dash);
    for (const style of styles) {
      expect(style.stroke).not.toBe("none");
      expect(style.width).toBeGreaterThanOrEqual(2);
    }
  });

  test(`legend matches both bar encodings: ${theme}`, async ({ page }) => {
    await page.goto("/components/visualization/bar-chart");
    await page.evaluate(theme => { document.documentElement.dataset.nyxTheme = theme; }, theme);
    const demo = page.locator("[data-example-preview]");
    const bars = await demo.locator(".nyx-chart > .nyx-chart-bar").evaluateAll(bars => bars.slice(0, 2).map(bar => {
      const style = getComputedStyle(bar);
      return [style.fill, style.stroke, style.strokeWidth, style.strokeDasharray];
    }));
    const keys = await demo.locator(".nyx-chart-key rect").evaluateAll(keys => keys.map(key => {
      const style = getComputedStyle(key);
      return [style.fill, style.stroke, style.strokeWidth, style.strokeDasharray];
    }));
    expect(keys).toEqual(bars);
  });
}

test("populated and empty chart examples occupy separately labelled cards", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/components/visualization/line-chart");
    const populated = page.locator('[data-example-preview] [data-nyx-example="chart-populated"]');
    const empty = page.locator('[data-example-preview] [data-nyx-example="chart-empty"]');
    await expect(populated.getByRole("heading", { name: "Populated-state example" })).toBeVisible();
    await expect(populated).toContainText("232 jobs");
    await expect(populated).not.toContainText("No render jobs");
    await expect(empty.getByRole("heading", { name: "Empty-state example" })).toBeVisible();
    await expect(empty).toContainText("No render jobs in this period");
    await expect(empty).not.toContainText("232 jobs");
    expect(await populated.evaluate((element) => element.contains(document.querySelector('[data-nyx-example="chart-empty"]')))).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  }
});
