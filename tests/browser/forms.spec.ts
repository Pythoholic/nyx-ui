import { expect, test, type Locator, type Page } from "@playwright/test";

function example(page: Page, name: string): Locator {
  const card = page.locator("[data-docs-example]", {
    has: page.getByRole("heading", { name, exact: true }),
  });
  return card.getByRole("tabpanel", { name: "Preview", exact: true });
}

test("OTP paste fills every cell and leaves focus on the final cell", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/forms/input-otp");
  const demo = example(page, "Input OTP / PIN");
  const cells = demo.getByRole("textbox", { name: /Digit \d of 6/ });
  await expect(cells).toHaveCount(6);

  await page.evaluate(() => navigator.clipboard.writeText("123456"));
  await cells.first().focus();
  await page.keyboard.press("Control+V");
  await expect.poll(() => cells.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)))
    .toEqual(["1", "2", "3", "4", "5", "6"]);
  await expect(cells.last()).toBeFocused();
  await expect(demo.locator("input[name='verificationCode']")).toHaveValue("123456");
});

test("number input buttons and coarse keyboard controls respect step and bounds", async ({ page }) => {
  await page.goto("/components/forms/number-input");
  const demo = example(page, "Advanced number input");
  const input = demo.getByRole("spinbutton", { name: "Replica count" });

  await demo.getByRole("button", { name: "Increase replica count" }).click();
  await expect(input).toHaveValue("4");
  await input.focus();
  await page.keyboard.press("PageUp");
  await expect(input).toHaveValue("9");
  await page.keyboard.press("Home");
  await expect(input).toHaveValue("0");
  await page.keyboard.press("End");
  await expect(input).toHaveValue("20");
  await expect(demo.getByText("20 replicas", { exact: true })).toBeVisible();
});

test("password visibility toggle synchronizes its accessible and native state", async ({ page }) => {
  await page.goto("/components/forms/password-input");
  const demo = example(page, "Password strength and visibility");
  const input = demo.locator("input[name='passphrase']");
  const toggle = demo.locator("[data-nyx-password-toggle]");
  await input.fill("correct horse battery staple");

  await toggle.click();
  await expect(input).toHaveAttribute("type", "text");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAccessibleName("Hide password");
  await toggle.click();
  await expect(input).toHaveAttribute("type", "password");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
});

test("multi-select adds and removes values while keeping tags and form values synchronized", async ({ page }) => {
  await page.goto("/components/forms/multi-select");
  const demo = example(page, "Multi-select and tag input");
  const input = demo.getByRole("combobox", { name: "Add owning team" });
  const selected = demo.getByLabel("Selected teams");

  await expect(selected.getByRole("button", { name: /Remove Atlas/ })).toBeVisible();
  await input.fill("hel");
  await page.keyboard.press("Enter");
  await expect(selected.getByRole("button", { name: /Remove Helix/ })).toBeVisible();
  const values = demo.locator("input[name='teams']");
  await expect.poll(() => values.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)))
    .toEqual(["atlas", "helix"]);

  await page.keyboard.press("Backspace");
  await expect(selected.getByRole("button", { name: /Remove Helix/ })).toHaveCount(0);
  await expect.poll(() => values.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)))
    .toEqual(["atlas"]);
});

test("file upload reports type and size validation through its accessible error state", async ({ page }) => {
  await page.goto("/components/forms/file-upload");
  const demo = example(page, "File upload");
  const input = demo.locator("input[type='file']");
  const error = demo.getByRole("alert");

  await input.setInputFiles([
    { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") },
    { name: "too-large.png", mimeType: "image/png", buffer: Buffer.alloc(20 * 1024 * 1024 + 1) },
  ]);
  await expect(error).toBeVisible();
  await expect(error).toContainText("not accepted");
  await expect(error).toContainText("exceeds");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(demo.getByRole("list", { name: "Selected files" }).getByRole("listitem")).toHaveCount(0);
});

test("date picker accepts valid typed dates and marks invalid text", async ({ page }) => {
  await page.goto("/components/forms/date-picker");
  const demo = example(page, "Date picker");
  const input = demo.getByRole("textbox", { name: "Deployment date" });

  await input.fill("2026-10-04");
  await input.press("Tab");
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(input).not.toHaveAttribute("data-invalid", "");

  await input.fill("04/10/2026");
  await input.press("Tab");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAttribute("data-invalid", "");
  await expect(demo.getByText("Enter a date as YYYY-MM-DD.", { exact: true })).toBeVisible();
});
