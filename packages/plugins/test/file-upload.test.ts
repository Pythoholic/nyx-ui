import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initFileUploads, type NyxFileUpload } from "../src/file-upload.js";

function renderUpload(): void {
  document.body.innerHTML = `<section data-nyx-file-upload data-nyx-file-upload-max-files="2" data-nyx-file-upload-max-size="10">
    <label class="nyx-file"><span id="child">Drop</span><input accept="image/png" type="file" multiple></label>
    <p data-nyx-file-upload-errors hidden></p>
    <ul data-nyx-file-upload-queue></ul>
    <button data-nyx-file-upload-start type="button">Upload</button>
  </section>`;
}

describe("NyxFileUpload", () => {
  let initialized: NyxFileUpload[] = [];
  const createObjectURL = vi.fn(() => "blob:preview");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    renderUpload();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });
  afterEach(() => { initialized.forEach((upload) => upload.destroy()); initialized = []; });

  it("initializes idempotently, includes its root, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-file-upload]");
    if (!root) throw new Error("Upload fixture missing.");
    const first = initFileUploads(root)[0];
    expect(initFileUploads(root)[0]).toBe(first);
    first?.destroy();
    const next = initFileUploads(root)[0];
    initialized = next ? [next] : [];
    expect(next).not.toBe(first);
  });

  it("validates type, size, and count with an accessible error region", () => {
    initialized = initFileUploads();
    const [upload] = initialized;
    if (!upload) throw new Error("Upload did not initialize.");
    const accepted = new File(["ok"], "ok.png", { type: "image/png" });
    const wrongType = new File(["bad"], "bad.txt", { type: "text/plain" });
    const tooLarge = new File(["01234567890"], "large.png", { type: "image/png" });
    upload.add([accepted, wrongType, tooLarge]);
    expect(upload.value).toHaveLength(1);
    const errors = upload.element.querySelector<HTMLElement>("[data-nyx-file-upload-errors]");
    expect(errors?.hidden).toBe(false);
    expect(errors?.textContent).toContain("not accepted");
    expect(errors?.textContent).toContain("exceeds");
    expect(upload.input.getAttribute("aria-invalid")).toBe("true");
  });

  it("uses drag depth so leaving a child does not clear the active drop state", () => {
    initialized = initFileUploads();
    const [upload] = initialized;
    if (!upload) throw new Error("Upload did not initialize.");
    upload.element.dispatchEvent(new Event("dragenter", { bubbles: true, cancelable: true }));
    document.querySelector("#child")?.dispatchEvent(new Event("dragenter", { bubbles: true, cancelable: true }));
    document.querySelector("#child")?.dispatchEvent(new Event("dragleave", { bubbles: true, cancelable: true }));
    expect(upload.element.dataset.dragging).toBe("true");
    upload.element.dispatchEvent(new Event("dragleave", { bubbles: true, cancelable: true }));
    expect(upload.element.dataset.dragging).toBeUndefined();
  });

  it("revokes image object URLs on removal and destroy", () => {
    initialized = initFileUploads();
    const [upload] = initialized;
    if (!upload) throw new Error("Upload did not initialize.");
    const [first] = upload.add([new File(["a"], "a.png", { type: "image/png" })]);
    if (!first) throw new Error("Image was not accepted.");
    expect(createObjectURL).toHaveBeenCalledOnce();
    upload.remove(first.id);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    upload.add([new File(["b"], "b.png", { type: "image/png" })]);
    upload.destroy();
    initialized = [];
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("runs a consumer transport and reflects reported progress and result", async () => {
    const transport = vi.fn(async (_file: File, context: { reportProgress(value: number): void }) => {
      context.reportProgress(42);
      return { id: "asset-1" };
    });
    initialized = initFileUploads(document, { transport });
    const [upload] = initialized;
    if (!upload) throw new Error("Upload did not initialize.");
    const [item] = upload.add([new File(["a"], "a.png", { type: "image/png" })]);
    if (!item) throw new Error("Image was not accepted.");
    const progress = vi.fn();
    upload.element.addEventListener("nyx:file-upload:progress", progress);
    await upload.upload(item.id);
    expect(transport).toHaveBeenCalledOnce();
    expect(progress).toHaveBeenCalledOnce();
    expect(item.state).toBe("complete");
    expect(item.progress).toBe(100);
    expect(item.result).toEqual({ id: "asset-1" });
  });
});
