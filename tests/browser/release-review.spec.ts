import { expect, test } from "@playwright/test";

test("last toast dismissal returns to its initiating control", async ({page}) => {
  await page.goto('/components/feedback/toast');
  const trigger = page.getByRole('button',{name:'Show default toast'});
  await trigger.click();
  await page.getByRole('button',{name:'Dismiss notification'}).focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toBeFocused();
});

test("toast frames follow the active accent theme", async ({ page }) => {
  await page.goto("/components/feedback/toast");
  const send = page.getByRole("button", { name: "Show default toast" });

  for (const theme of ["Solar", "Signal", "Flux", "Plasma"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    await send.click();
    const toast = page.locator(".nyx-toast").last();
    const colors = await toast.evaluate(element => {
      const probe = document.createElement("span");
      probe.style.border = "1px solid var(--nyx-accent-line)";
      element.append(probe);
      const accentLine = getComputedStyle(probe).borderColor;
      probe.remove();
      return { accentLine, border: getComputedStyle(element).borderColor };
    });
    expect(colors.border, `${theme} toast border`).toBe(colors.accentLine);
    await toast.getByRole("button", { name: /Dismiss/ }).click();
    await expect(toast).toHaveCount(0);
  }
});

test("toast patterns expose semantic progress and optional actions", async ({ page }) => {
  await page.goto("/components/feedback/toast");

  await page.getByRole("button", { name: "Show loading" }).click();
  const loading = page.getByRole("progressbar", { name: "Preparing deployment progress" });
  await expect(loading).not.toHaveAttribute("aria-valuenow");
  await loading.locator("xpath=ancestor::*[contains(@class, 'nyx-toast')]").getByRole("button", { name: "Dismiss notification" }).click();

  await page.getByRole("button", { name: "Show upload progress" }).click();
  await expect(page.getByRole("progressbar", { name: "Uploading release bundle progress" })).toHaveAttribute("aria-valuenow", "68");

  const trigger = page.getByRole("button", { name: "Show actionable toast" });
  await trigger.click();
  await page.getByRole("button", { name: "View upload" }).click();
  await expect(trigger.locator("xpath=ancestor::*[contains(@class, 'nyx-toast-showcase')]").locator("[data-toast-demo-status]")).toContainText("Action selected: View upload");
  await expect(trigger).toBeFocused();
});

test("semantic toast triggers look and behave like tone buttons", async ({ page }) => {
  await page.goto("/components/feedback/toast");

  for (const [name, token] of [["Show success", "--nyx-signal"], ["Show warning", "--nyx-warning"], ["Show danger", "--nyx-danger"]]) {
    const button = page.getByRole("button", { name, exact: true });
    const appearance = await button.evaluate((element, semanticToken) => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = `var(${semanticToken})`;
      element.append(probe);
      const tokenColor = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const styles = getComputedStyle(element);
      return { background: styles.backgroundColor, blockSize: element.getBoundingClientRect().height, tokenColor };
    }, token);
    expect(appearance.background).toBe(appearance.tokenColor);
    expect(appearance.blockSize).toBeGreaterThanOrEqual(40);
    await button.click();
    await expect(button.locator("xpath=ancestor::*[contains(@class, 'nyx-toast-showcase')]").locator(".nyx-toast").last()).toBeVisible();
  }
});

test("pagination navigation preserves the selected documentation theme", async ({ page }) => {
  await page.goto("/components/navigation/pagination");
  await page.getByRole("button", { name: "Plasma", exact: true }).click();
  await page.locator("[data-example-preview]").getByRole("link", { name: "Next page" }).click();

  await expect(page).toHaveURL(/\/components\/navigation\/pagination\?page=3$/);
  await expect(page.locator("html")).toHaveAttribute("data-nyx-theme", "plasma");
  await expect(page.getByRole("button", { name: "Plasma", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("examples arrive before guidance and auth prioritizes its task column", async ({ page }) => {
  for (const width of [1280,1920,2560]) {
    await page.setViewportSize({width,height:720});
    await page.goto('/components/media/rating');
    const demo = page.locator('[data-example-preview]');
    expect((await demo.boundingBox())!.height).toBeLessThan(130);
    expect((await demo.boundingBox())!.y).toBeLessThan(500);
    await page.goto('/components/layouts/registration');
    const form = page.locator('.nyx-auth-form');
    const art = page.locator('.nyx-auth-art');
    expect((await form.locator('.nyx-auth-heading h2').boundingBox())!.height).toBeLessThan(80);
    if (width===1280) await expect(art).toBeHidden();
    else {
      await expect(art).toBeVisible();
      expect((await form.boundingBox())!.width).toBeGreaterThan((await art.boundingBox())!.width);
    }
  }
});

test("media contains real images and the sparkline stays inside a metric row", async ({ page }) => {
  await page.goto('/components/media/media-carousel');
  const carousel = page.locator('[data-example-preview] [data-nyx-carousel]');
  for (let i=0;i<3;i++) {
    const image = carousel.locator('[data-nyx-carousel-slide]:not([hidden]) img');
    expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await carousel.getByRole('button',{name:'Next',exact:true}).click();
  }
  await page.goto('/components/visualization/sparklines');
  await expect(page).toHaveURL(/\/components\/visualization\/line-chart$/);
  await expect(page.locator('[data-example-preview]')).toContainText('51 jobs / hour');
  expect((await page.locator('.nyx-metric-row svg').boundingBox())!.width).toBeLessThanOrEqual(160);
  await page.goto('/components/visualization/line-chart');
  await page.getByText('Exact hourly values',{exact:true}).click();
  await expect(page.locator('[data-example-preview] table tbody tr')).toHaveCount(7);
  await expect(page.locator('[data-example-preview]')).toContainText('232 jobs');
  await page.goto('/components/visualization/accessible-summary');
  await expect(page).toHaveURL(/\/components\/visualization\/line-chart$/);
  await expect(page.locator('[data-example-preview]')).toContainText('No render jobs in this period');
});

test("registration shares pristine edited submitted and reset validation timing", async ({ page }) => {
  await page.goto('/components/layouts/registration');
  const form = page.locator('[role="tabpanel"] .nyx-auth-form');
  const fields = form.locator('input');
  for (const field of await fields.all()) await expect(field).toHaveAttribute('aria-invalid','false');
  const password = form.locator('[data-nyx-password-control]');
  await password.fill('short');
  await expect(password).toHaveAttribute('aria-invalid','true');
  await expect(form.locator('input[type="email"]')).toHaveAttribute('aria-invalid','false');
  await form.getByRole('button',{name:'Create account',exact:true}).click();
  for (const field of await fields.all()) await expect(field).toHaveAttribute('aria-invalid','true');
  await form.evaluate(element => (element as HTMLFormElement).reset());
  for (const field of await fields.all()) await expect(field).toHaveAttribute('aria-invalid','false');
});

test("nested themes restore solar and scope component accents", async ({ page }) => {
  await page.goto('/guides/theming');
  const colors = await page.evaluate(() => {
    const outer = document.createElement('section');
    outer.dataset.nyxTheme = 'plasma';
    outer.innerHTML = '<button class="nyx-button" data-variant="primary">Outer</button><section data-nyx-theme="solar"><button class="nyx-button" data-variant="primary">Inner</button></section>';
    document.body.append(outer);
    return Array.from(outer.querySelectorAll('button'), element => getComputedStyle(element).backgroundColor);
  });
  expect(colors).toEqual(['rgb(139, 124, 246)', 'rgb(245, 217, 10)']);
});

test("accent utilities and components follow each theme together", async ({ page }) => {
  await page.goto('/guides/theming');
  for (const theme of ['solar','signal','flux','plasma']) {
    const colors = await page.evaluate(theme => {
      document.documentElement.dataset.nyxTheme = theme;
      const outer = document.createElement('section');
      outer.dataset.nyxTheme = theme;
      outer.innerHTML = '<span class="text-nyx-accent">Accent</span><button class="nyx-button" data-variant="primary">Action</button>';
      document.body.append(outer);
      const result = [getComputedStyle(outer.firstElementChild!).color, getComputedStyle(outer.lastElementChild!).backgroundColor];
      outer.remove();
      return result;
    }, theme);
    expect(colors[0]).toBe(colors[1]);
  }
});

test("initialization alternatives are separate copyable lifecycles", async ({ page }) => {
  await page.goto('/components/forms/number-input');
  const section = page.locator('.docs-reference-section', {has:page.getByRole('heading',{name:'JavaScript initialization'})});
  const sources = section.locator('[data-nyx-code-source]');
  await expect(sources).toHaveCount(2);
  const [batch, single] = await sources.allTextContents();
  expect(batch).toContain('initNumberInputs(root)');
  expect(batch).not.toContain('new NyxNumberInput');
  expect(single).toContain('new NyxNumberInput');
  expect(single).not.toContain('initNumberInputs');
  for (const source of [batch,single]) {
    expect(source).toContain('return () =>');
    expect(source).toContain('.destroy()');
  }
  const results = await page.evaluate(async sources => {
    const moduleUrl = performance.getEntriesByType('resource').map(entry => entry.name).find(name => /plugins_number-input|\/number-input\.js/.test(name));
    if (!moduleUrl) throw new Error('Number input module was not loaded');
    const api = await import(moduleUrl);
    return sources.map((source,index) => {
      const root = document.querySelector('[data-example-preview]')!.cloneNode(true) as HTMLElement;
      const mount = new Function('api', source.replace(/import \{([^}]+)\} from [^;]+;/, 'const {$1} = api;').replace('export function','function') + '\nreturn mount;')(api);
      const cleanup = mount(index === 0 ? root : root.querySelector('[data-nyx-number-input]'));
      const input = root.querySelector<HTMLInputElement>('[data-nyx-number-input-control]')!;
      const increment = root.querySelector<HTMLButtonElement>('[data-nyx-number-input-increment]')!;
      const before = input.valueAsNumber;
      increment.click();
      const after = input.valueAsNumber;
      cleanup();
      increment.click();
      return {delta:after-before, afterCleanup:input.valueAsNumber-after};
    });
  }, [batch,single]);
  expect(results).toEqual([{delta:0.5,afterCleanup:0},{delta:0.5,afterCleanup:0}]);
});

test("installation includes font loading weights and fallback behavior", async ({ page }) => {
  await page.goto('/guides/installation');
  const section = page.locator('.docs-prose-section', {has:page.getByRole('heading',{name:'Load the font'})});
  await expect(section).toContainText('400, 500, 600, and 700');
  await expect(section).toContainText('fallback');
  await expect(section.locator('[data-nyx-code-source]')).toContainText('family=JetBrains+Mono');
});

test("regenerated tags and filters return focus to their editable control", async ({ page }) => {
  for (const [path, remove, destination] of [
    ['/components/forms/multi-select', '[data-nyx-multi-select-remove]', '[data-nyx-multi-select] input:not([type="hidden"])'],
    ['/components/data-display/filter-bar', '[data-nyx-filter-remove]', '[data-nyx-filter-bar] input[type="search"]'],
  ]) {
    await page.goto(path);
    await page.locator(`[role="tabpanel"] ${remove}`).first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(`[role="tabpanel"] ${destination}`)).toBeFocused();
  }
});

test("attachment removal retains focus through the last item", async ({ page }) => {
  await page.goto('/components/ai/attachment-previews');
  const collection = page.locator('[role="tabpanel"] [data-nyx-attachment-previews]');
  while (await collection.getByRole('button', {name:/Remove/}).count()) {
    await collection.getByRole('button', {name:/Remove/}).first().focus();
    await page.keyboard.press('Enter');
    expect(await collection.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await expect(collection).toBeFocused();
});

test("notification dismissal event observes a disconnected node", async ({ page }) => {
  await page.goto('/components/feedback/notification-centre');
  const center = page.locator('[role="tabpanel"] [data-nyx-notification-center]');
  await center.evaluate(element => element.addEventListener('nyx:notification-center:dismiss', event => {
    element.setAttribute('data-event-connected', String((event as CustomEvent).detail.notification.isConnected));
  }));
  await center.locator('[data-nyx-notification-dismiss]').first().click();
  await expect(center).toHaveAttribute('data-event-connected','false');
});

test("queue actions preserve focus through cancel retry removal and empty state", async ({ page }) => {
  await page.goto("/components/ai/generation-queue");
  const queue = page.locator('[role="tabpanel"] [data-nyx-generation-queue]');
  const first = queue.locator('[data-nyx-generation-item]').first();
  await first.getByRole('button', {name:'Cancel', exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(first.getByRole('button', {name:'Remove', exact:true})).toBeFocused();
  const failed = queue.locator('[data-nyx-generation-id="concept-03"]');
  await failed.getByRole('button', {name:'Retry', exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(failed.getByRole('button', {name:'Cancel', exact:true})).toBeFocused();
  await first.getByRole('button', {name:'Remove', exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(queue.locator('[data-nyx-generation-id="concept-05"] [data-nyx-generation-action="cancel"]')).toBeFocused();
  while (await queue.locator('[data-nyx-generation-item]:not([data-nyx-motion="removing"])').count()) {
    const item = queue.locator('[data-nyx-generation-item]:not([data-nyx-motion="removing"])').first();
    const cancel = item.getByRole('button', {name:'Cancel', exact:true});
    if (await cancel.isVisible()) await cancel.click();
    await item.getByRole('button', {name:'Remove', exact:true}).focus();
    await page.keyboard.press('Enter');
  }
  await expect(queue).toBeFocused();
  await expect(queue.locator('[data-nyx-generation-empty]')).toBeVisible();
});

test("notification dismissal preserves position and emits after DOM removal", async ({ page }) => {
  await page.goto('/components/feedback/notification-centre');
  const center = page.locator('[role="tabpanel"] [data-nyx-notification-center]');
  await center.evaluate(element => element.addEventListener('nyx:notification-center:dismiss', event => {
    element.setAttribute('data-dismiss-connected', String((event as CustomEvent).detail.notification.isConnected));
  }));
  await center.locator('[data-nyx-notification-dismiss]').first().focus();
  await page.keyboard.press('Enter');
  await expect(center.locator('[data-nyx-notification-id="policy-update"] [data-nyx-notification-dismiss]')).toBeFocused();
  await expect(center).toHaveAttribute('data-dismiss-connected','false');
  for (let i = 0; i < 2; i++) {
    await center.locator('[data-nyx-notification]:not([data-nyx-motion="removing"]) [data-nyx-notification-dismiss]').first().focus();
    await page.keyboard.press('Enter');
  }
  await expect(center).toBeFocused();
  await expect(center.locator('[data-nyx-notification-empty]')).toBeVisible();
});

test("notification read actions name the next action without toggle semantics", async ({ page }) => {
  await page.goto('/components/feedback/notification-centre');
  const button = page.locator('[role="tabpanel"] [data-nyx-notification-read]').first();
  await expect(button).toHaveAccessibleName('Mark notification read');
  await expect(button).not.toHaveAttribute('aria-pressed');
  await button.click();
  await expect(button).toHaveAccessibleName('Mark notification unread');
});

test("progress catalog renders declared values, alternate geometry, and pending work", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1100 });
  await page.goto("/components/feedback/progress");
  const preview = page.locator("[data-docs-example]", { has: page.getByRole("heading", { name: "Progress patterns", exact: true }) }).getByRole("tabpanel", { name: "Preview", exact: true });
  const bar = preview.locator('.nyx-progress[aria-valuenow="68"]').first();
  const ratio = await bar.evaluate(element => element.firstElementChild!.getBoundingClientRect().width / element.getBoundingClientRect().width);
  expect(ratio).toBeCloseTo(0.68, 2);
  await expect(preview.getByText("Upload progress", { exact: true })).toBeVisible();
  await expect(preview.getByText("68%", { exact: true }).first()).toBeVisible();
  await expect(preview.locator(".nyx-progress-radial")).toHaveCount(2);
  await expect(preview.locator(".nyx-progress-gauge")).toHaveCount(1);
  await expect(preview.locator(".nyx-progress-vertical")).toHaveCount(4);

  const segmented = await preview.locator('.nyx-progress[data-layout="segmented"]').evaluate(element => {
    const track = element.getBoundingClientRect().width;
    const segments = Array.from(element.children, child => child.getBoundingClientRect().width);
    return segments.reduce((total, width) => total + width, 0) / track;
  });
  expect(segmented).toBeCloseTo(1, 2);

  const vertical = preview.locator('.nyx-progress-vertical[aria-valuenow="92"]');
  const verticalRatio = await vertical.evaluate(element => element.firstElementChild!.getBoundingClientRect().height / element.getBoundingClientRect().height);
  expect(verticalRatio).toBeCloseTo(0.92, 2);

  const motion = await preview.evaluate((element) => ({
    linear: getComputedStyle(element.querySelector<HTMLElement>('.nyx-progress[aria-valuenow="68"] .nyx-progress-bar')!).animationName,
    segmented: getComputedStyle(element.querySelector<HTMLElement>(".nyx-progress-segment")!).animationName,
    vertical: getComputedStyle(element.querySelector<HTMLElement>(".nyx-progress-vertical .nyx-progress-bar")!).animationName,
    radial: getComputedStyle(element.querySelector<SVGElement>(".nyx-progress-ring-value")!).animationName,
  }));
  expect(motion).toEqual({
    linear: "nyx-progress-fill",
    segmented: "nyx-progress-fill",
    vertical: "nyx-progress-fill-vertical",
    radial: "nyx-progress-ring-fill",
  });

  const ringRendering = await preview.locator(".nyx-progress-radial").first().evaluate((element) => {
    const svg = element.querySelector("svg")!;
    const value = element.querySelector<SVGCircleElement>(".nyx-progress-ring-value")!;
    return {
      svgTransform: getComputedStyle(svg).transform,
      shapeRendering: getComputedStyle(svg).shapeRendering,
      vectorEffect: getComputedStyle(value).vectorEffect,
      valueTransform: value.getAttribute("transform"),
    };
  });
  expect(ringRendering).toEqual({
    svgTransform: "none",
    shapeRendering: "geometricprecision",
    vectorEffect: "non-scaling-stroke",
    valueTransform: "rotate(-90 56 56)",
  });

  for (const radial of await preview.locator(".nyx-progress-radial").all()) {
    const separation = await radial.evaluate((element) => {
      const ring = element.querySelector("svg")!.getBoundingClientRect();
      const label = element.querySelector("small")!.getBoundingClientRect();
      return label.top - ring.bottom;
    });
    expect(separation, "radial label clears its ring").toBeGreaterThanOrEqual(2);
  }

  const pendingTrack = preview.locator('[data-indeterminate]');
  await expect(pendingTrack).not.toHaveAttribute("aria-valuenow");
  const pending = pendingTrack.locator(".nyx-progress-bar");
  expect((await pending.boundingBox())!.width).toBeGreaterThan(0);
  const first = await pending.evaluate(element => getComputedStyle(element).transform);
  await expect.poll(() => pending.evaluate(element => getComputedStyle(element).transform)).not.toBe(first);
});

test("generation progress spans the row, inherits the accent, and animates running work", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/components/ai/generation-queue");
  const item = page.locator("[data-example-preview] .nyx-generation-item[data-state='running']");
  const body = item.locator(".nyx-generation-body");
  const progress = item.locator(":scope > progress");
  const geometry = await item.evaluate(element => {
    const bodyBox = element.querySelector(".nyx-generation-body")!.getBoundingClientRect();
    const progressElement = element.querySelector("progress")!;
    const progressBox = progressElement.getBoundingClientRect();
    const itemBox = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    const accentProbe = document.createElement("span");
    accentProbe.style.backgroundColor = "var(--nyx-accent)";
    element.append(accentProbe);
    const accentColor = getComputedStyle(accentProbe).backgroundColor;
    accentProbe.remove();
    return {
      leftDelta: progressBox.left - bodyBox.left,
      rightInset: itemBox.right - progressBox.right,
      itemPadding: parseFloat(styles.paddingRight),
      itemBorder: parseFloat(styles.borderRightWidth),
      accentColor,
      progressAccent: getComputedStyle(progressElement).accentColor,
      animation: getComputedStyle(element, "::after").animationName,
      waveWidth: parseFloat(getComputedStyle(element, "::after").width),
      progressWidth: progressBox.width,
    };
  });

  expect(Math.abs(geometry.leftDelta)).toBeLessThan(0.1);
  expect(geometry.rightInset).toBeCloseTo(geometry.itemPadding + geometry.itemBorder, 1);
  expect(geometry.progressAccent).toBe(geometry.accentColor);
  expect(geometry.animation).toBe("nyx-progress-wave");
  expect(geometry.waveWidth / geometry.progressWidth).toBeCloseTo(0.68, 2);
  await expect(body).toContainText("Orbital station concept");
  await expect(progress).toHaveAttribute("value", "68");
});

test("rating offers an ordered native scale with a focused selected choice", async ({ page }) => {
  await page.goto("/components/media/rating");
  const radios = page.locator('[role="tabpanel"] .nyx-rating input');
  await expect(radios).toHaveCount(5);
  expect(await radios.evaluateAll(elements => elements.map(element => (element as HTMLInputElement).value))).toEqual(["1", "2", "3", "4", "5"]);
  await radios.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(radios.nth(1)).toBeChecked();
  await expect(radios.nth(1)).toBeFocused();
  const labels = page.locator('[role="tabpanel"] .nyx-rating label');
  const colors = await labels.evaluateAll(elements => elements.map(element => getComputedStyle(element).color));
  expect(colors[0]).toBe(colors[1]);
  expect(colors[1]).not.toBe(colors[2]);
  expect(await labels.nth(1).evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
});

test("table numeric pages follow filtered results including empty results", async ({ page }) => {
  await page.goto("/components/data-display/advanced-data-table");
  const demo = page.locator('[role="tabpanel"] [data-nyx-data-table]');
  const second = demo.locator('[data-nyx-data-table-page="2"]');
  await second.click();
  await expect(demo.locator('[data-nyx-data-table-page-status]')).toHaveText("Page 2 of 2");
  await demo.locator('[data-nyx-data-table-filter]').fill("render-025");
  await expect(second).toBeHidden();
  await expect(second).toBeDisabled();
  await expect(demo.locator('[data-nyx-data-table-page-status]')).toHaveText("Page 1 of 1");
  await demo.locator('[data-nyx-data-table-filter]').fill("no-such-job");
  await expect(demo.locator('[data-nyx-data-table-page="1"]')).toBeHidden();
  await expect(demo.locator('[data-nyx-data-table-page-status]')).toHaveText("No results");
  await demo.locator('[data-nyx-data-table-filter]').fill("");
  await expect(second).toBeVisible();
  await expect(second).toBeEnabled();
});
