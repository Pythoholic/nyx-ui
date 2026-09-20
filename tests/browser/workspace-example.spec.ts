import { expect, test } from "@playwright/test";

for (const url of ['/guides/render-workspace', 'http://127.0.0.1:5175']) {
  test(`workspace happy path, failure, retry, cancellation and empty state: ${url}`, async ({page}) => {
    await page.goto(url);
    const root = page.locator('[data-render-workspace]');
    const scenes = root.getByRole('spinbutton',{name:'Scenes',exact:true});
    const variations = root.getByRole('spinbutton',{name:'Variations per scene'});
    await root.getByRole('button',{name:'Increase scenes',exact:true}).click();
    await expect(scenes).toHaveValue('3');
    await expect(variations).toHaveValue('1');
    await root.getByRole('button',{name:'Increase variations',exact:true}).click();
    await expect(root.locator('[data-workspace-plan]')).toHaveText('6 jobs planned');
    await root.getByLabel('Workspace accent').selectOption('plasma');
    await expect(root).toHaveAttribute('data-nyx-theme','plasma');
    await scenes.fill('1');
    await variations.fill('1');
    await root.getByLabel('Rehearse a recoverable failure').check();
    await root.getByRole('button',{name:'Queue batch',exact:true}).click();
    const job = root.locator('[data-nyx-generation-item]').first();
    await expect(job).toHaveAttribute('data-state','failed', {timeout:6000});
    await job.getByRole('button',{name:'Retry',exact:true}).focus();
    await page.keyboard.press('Enter');
    await expect(job.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();
    await expect(job).toHaveAttribute('data-state','complete', {timeout:8000});
    await job.getByRole('button',{name:'Remove',exact:true}).click();
    await expect(root.locator('[data-nyx-generation-empty]')).toBeVisible();
    await root.getByRole('button',{name:'Queue batch',exact:true}).click();
    const next = root.locator('[data-nyx-generation-item]:not([data-nyx-motion="removing"])').first();
    await next.getByRole('button',{name:'Cancel',exact:true}).click();
    await expect(next).toHaveAttribute('data-state','canceled');
    await expect(root.locator('[data-workspace-log]')).toContainText('canceled');
  });
}

test('route cleanup stops detached work and reentry initializes each control once', async ({page}) => {
  await page.goto('/guides/render-workspace');
  await page.getByRole('button',{name:'Queue batch',exact:true}).click();
  await page.evaluate(() => {
    const root = document.querySelector('[data-render-workspace]')!;
    (window as unknown as {oldWorkspace: Element}).oldWorkspace = root;
  });
  await page.getByRole('link',{name:'Installation',exact:true}).click();
  const read = () => page.evaluate(() => {
    const root = (window as unknown as {oldWorkspace: Element}).oldWorkspace;
    return Array.from(root.querySelectorAll('[data-nyx-generation-item]'), item=>item.getAttribute('data-progress'));
  });
  const previous = await read();
  await page.waitForTimeout(1400);
  expect(await read()).toEqual(previous);
  await page.getByRole('link',{name:'Executable example',exact:true}).click();
  await page.getByRole('button',{name:'Increase scenes',exact:true}).click();
  await expect(page.getByRole('spinbutton',{name:'Scenes',exact:true})).toHaveValue('3');
});
