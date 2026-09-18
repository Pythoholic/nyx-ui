import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initBatchProgressMonitors, type NyxBatchProgressMonitor } from "../src/batch-progress-monitor.js";
import { initMediaCarousels, type NyxMediaCarousel } from "../src/media-carousel.js";
import { initUploadDropzones, type NyxUploadDropzone } from "../src/upload-dropzone.js";

describe("media composition entry points", () => {
  const destroyables: Array<{ destroy(): void }> = [];

  beforeEach(() => { document.body.innerHTML = ""; });
  afterEach(() => { destroyables.splice(0).forEach((item) => item.destroy()); });

  it("runs media carousel changes through the shared carousel contract", () => {
    document.body.innerHTML = `<section data-nyx-carousel><figure data-nyx-carousel-slide>One</figure><figure data-nyx-carousel-slide>Two</figure><button data-nyx-carousel-next>Next</button><span data-nyx-carousel-status></span></section>`;
    const carousel: NyxMediaCarousel = initMediaCarousels()[0]!;
    destroyables.push(carousel);
    const changed = vi.fn();
    carousel.element.addEventListener("nyx:carousel:change", changed);
    carousel.element.querySelector<HTMLButtonElement>("[data-nyx-carousel-next]")?.click();
    expect(carousel.value).toBe(1);
    expect(changed).toHaveBeenCalledOnce();
    expect(carousel.slides[0]?.hidden).toBe(true);
  });

  it("runs dropped media through the shared validated upload queue", () => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:asset") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    document.body.innerHTML = `<section data-nyx-file-upload><label><input type="file" accept="image/*" multiple></label><p data-nyx-file-upload-errors hidden></p><ul data-nyx-file-upload-queue></ul><button data-nyx-file-upload-start>Start</button></section>`;
    const dropzone: NyxUploadDropzone = initUploadDropzones()[0]!;
    destroyables.push(dropzone);
    const added = vi.fn();
    dropzone.element.addEventListener("nyx:file-upload:add", added);
    dropzone.add([new File(["image"], "asset.png", { type: "image/png" })]);
    expect(dropzone.value).toHaveLength(1);
    expect(dropzone.element.dataset.state).toBe("ready");
    expect(dropzone.queueElement.querySelector("progress")).not.toBeNull();
    expect(added).toHaveBeenCalledOnce();
  });

  it("runs batch jobs through the shared queue state and cancellation boundary", () => {
    document.body.innerHTML = `<section data-nyx-generation-queue><output data-nyx-generation-count></output><ol><li data-nyx-generation-item data-nyx-generation-id="job" data-state="running" data-progress="20"><progress data-nyx-generation-progress></progress><output data-nyx-generation-status></output><button data-nyx-generation-action="cancel">Cancel</button><button data-nyx-generation-action="remove">Remove</button></li></ol><p data-nyx-generation-empty hidden></p></section>`;
    const monitor: NyxBatchProgressMonitor = initBatchProgressMonitors()[0]!;
    destroyables.push(monitor);
    const changed = vi.fn();
    monitor.element.addEventListener("nyx:generation-queue:change", changed);
    monitor.items[0]?.querySelector<HTMLButtonElement>("[data-nyx-generation-action='cancel']")?.click();
    expect(monitor.value[0]?.state).toBe("canceled");
    expect(monitor.element.getAttribute("aria-busy")).toBe("false");
    expect(changed).toHaveBeenCalledOnce();
  });
});
