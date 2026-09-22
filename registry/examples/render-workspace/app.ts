import { initNumberInputs } from "@nyx-raul/plugins/number-input";
import { initGenerationQueues } from "@nyx-raul/plugins/generation-queue";

/** Mount once per rendered root; call the returned function before replacing it. */
export function mountWorkspace(root: HTMLElement): () => void {
  const abort = new AbortController();
  const numbers = initNumberInputs(root);
  const queue = initGenerationQueues(root)[0]!;
  const form = root.querySelector<HTMLFormElement>("[data-workspace-form]")!;
  const theme = root.querySelector<HTMLSelectElement>("[data-workspace-theme]")!;
  const planned = root.querySelector<HTMLOutputElement>("[data-workspace-plan]")!;
  const log = root.querySelector<HTMLOutputElement>("[data-workspace-log]")!;
  const list = root.querySelector<HTMLOListElement>("[data-workspace-jobs]")!;
  const template = root.querySelector<HTMLTemplateElement>("[data-workspace-job]")!;
  let sequence = Math.max(0, ...queue.value.map(item => Number(item.id.replace("render-", "")) || 0));
  const failOnce = new Set<string>();
  const total = () => numbers.reduce((value, number) => value * (number.value ?? 0), 1);
  const updatePlan = () => { planned.value = `${total()} jobs planned`; };
  root.addEventListener("nyx:number-input:change", updatePlan, { signal: abort.signal });
  theme.addEventListener("change", () => { root.dataset.nyxTheme = theme.value; }, { signal: abort.signal });
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const count = total();
    const fail = root.querySelector<HTMLInputElement>("[data-workspace-failure]")!.checked;
    for (let index = 0; index < count; index++) {
      const item = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
      const id = `render-${++sequence}`;
      item.dataset.nyxGenerationId = id;
      item.querySelector<HTMLElement>("[data-workspace-job-name]")!.textContent = `Mission study ${sequence}`;
      item.querySelector("progress")!.setAttribute("aria-label", `Mission study ${sequence} progress`);
      if (fail && index === 0) failOnce.add(id);
      list.append(item);
    }
    queue.refresh();
    log.value = `Queued ${count} jobs.`;
  }, { signal: abort.signal });
  root.addEventListener("nyx:generation-queue:change", event => {
    if (event.detail.reason === "control") log.value = `${event.detail.id}: ${event.detail.next?.state}.`;
  }, { signal: abort.signal });
  root.addEventListener("nyx:generation-queue:remove", event => {
    failOnce.delete(event.detail.id);
    log.value = `Removed ${event.detail.id}.`;
  }, { signal: abort.signal });

  // This transport simulation belongs to the application, not the queue controller.
  const timer = window.setInterval(() => {
    for (const item of queue.value) {
      if (item.state !== "queued" && item.state !== "running") continue;
      const progress = Math.min(100, item.progress + 20);
      if (progress >= 40 && failOnce.delete(item.id)) {
        queue.setStatus(item.id, "failed", progress);
        log.value = `${item.id} interrupted. Retry preserves the job settings.`;
      } else queue.setStatus(item.id, progress === 100 ? "complete" : "running", progress);
    }
  }, 1200);
  updatePlan();
  return () => {
    abort.abort();
    window.clearInterval(timer);
    numbers.forEach(number => number.destroy());
    queue.destroy();
  };
}
