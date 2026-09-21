import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { NyxRegistryStore } from "../src/registry.js";

const registryRoot = resolve(import.meta.dirname, "..", "..", "..", "registry");

describe("NyxRegistryStore", () => {
  it("uses AI-readable guidance when searching", async () => {
    const store = await NyxRegistryStore.load(registryRoot);

    const results = store.search("brief non-interactive help");

    expect(results[0]?.name).toBe("tooltip");
  });

  it("returns canonical files only for known manifest items", async () => {
    const store = await NyxRegistryStore.load(registryRoot);

    const files = await store.source("tooltip");

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe("components/tooltip.html");
    expect(files[0]?.content).toContain("data-nyx-tooltip");
    await expect(store.source("../package.json")).rejects.toThrow("Unknown Nyx registry item");
  });
});
