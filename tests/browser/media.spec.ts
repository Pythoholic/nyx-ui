import { expect, test, type Locator, type Page } from "@playwright/test";

function example(page: Page, name: string): Locator {
  return page.locator("[data-docs-example]", {
    has: page.getByRole("heading", { name, exact: true }),
  }).getByRole("tabpanel", { name: "Preview", exact: true });
}

test("image lightbox remains centered at desktop widths", async ({ page }) => {
  for (const width of [1280, 1920, 2560]) {
    const height = width === 2560 ? 1440 : 1080;
    await page.setViewportSize({ width, height });
    await page.goto("/components/media/image-lightbox");
    await example(page, "Mission gallery").getByRole("button", { name: "Open orbital relay image" }).click();

    const dialog = page.locator("[data-nyx-image-lightbox-dialog]");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    const viewport = await page.evaluate(() => ({ width: document.documentElement.clientWidth, height: window.innerHeight }));
    expect(box).not.toBeNull();
    if (!box) continue;
    expect(Math.abs(box.x + box.width / 2 - viewport.width / 2), `${width}px horizontal center`).toBeLessThanOrEqual(8);
    expect(Math.abs(box.y + box.height / 2 - viewport.height / 2), `${width}px vertical center`).toBeLessThanOrEqual(1);
    await page.keyboard.press("Escape");
  }
});

test("upload queue progress uses the active accent treatment", async ({ page }) => {
  await page.goto("/components/media/upload-dropzone");
  await example(page, "Production asset queue").locator("input[type=file]").setInputFiles({
    name: "mission.png",
    mimeType: "image/png",
    buffer: Buffer.from("not-a-real-image"),
  });

  const progress = page.locator(".nyx-file-progress");
  await expect(progress).toBeVisible();
  const styles = await progress.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      appearance: style.appearance,
      height: element.getBoundingClientRect().height,
      radius: style.borderRadius,
      accent: style.accentColor,
      expectedAccent: (() => {
        const probe = document.createElement("span");
        probe.style.color = "var(--nyx-accent)";
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      })(),
    };
  });
  expect(styles.appearance).toBe("none");
  expect(styles.height).toBe(8);
  expect(styles.radius).not.toBe("0px");
  expect(styles.accent).toBe(styles.expectedAccent);
});

test("protected media reveals and conceals its authored preview", async ({ page }) => {
  await page.goto("/components/media/protected-media");
  const demo = example(page, "Protected media");
  const sensitive = demo.locator("[data-nyx-sensitive]");
  const reveal = demo.getByRole("button", { name: "Reveal preview" });
  const content = demo.locator("[data-nyx-sensitive-content]");

  await expect(content).toBeHidden();
  await reveal.click();
  await expect(content).toBeVisible();
  await expect(sensitive).toHaveAttribute("data-state", "revealed");
  await expect(content.getByRole("img", { name: "Survey vessel approaching a protected lunar facility" })).toBeVisible();

  await demo.getByRole("button", { name: "Conceal preview" }).click();
  await expect(content).toBeHidden();
  await expect(reveal).toBeFocused();
});

test("batch plan selection updates the production summary and queues the chosen plan", async ({ page }) => {
  await page.goto("/components/media/batch-plan");
  const demo = example(page, "Batch plan");
  const rapid = demo.getByRole("radio", { name: /Rapid plan/ });

  await demo.locator("label.nyx-batch-tile", { hasText: "Rapid plan" }).click();
  await expect(rapid).toBeChecked();
  await expect(demo.locator("[data-nyx-batch-plan-name]")).toHaveText("Rapid plan");
  await expect(demo.locator("[data-nyx-batch-plan-summary]")).toHaveText("6 outputs · approximately 6 minutes");

  const start = demo.locator("button[type='submit']");
  await expect(start).toHaveText("Start rapid batch");
  await start.click();
  await expect(start).toHaveText("Rapid batch queued");
  await expect(start).toBeDisabled();
});
