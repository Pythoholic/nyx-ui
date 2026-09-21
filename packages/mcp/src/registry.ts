import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";

import type { NyxComponentSource, NyxRegistry, NyxRegistryItem } from "./types.js";

const bundledRegistryRoot = fileURLToPath(new URL("./registry", import.meta.url));

function assertInsideRoot(root: string, candidate: string): void {
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
    throw new Error("Registry path escapes the configured root.");
  }
}

function searchableText(item: NyxRegistryItem): string {
  return [
    item.name,
    item.type,
    item.status,
    item.description,
    ...(item.useWhen ?? []),
    ...(item.avoidWhen ?? []),
    ...(item.related ?? []),
    ...item.requires,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export class NyxRegistryStore {
  readonly root: string;
  readonly manifest: NyxRegistry;
  readonly itemsByName: ReadonlyMap<string, NyxRegistryItem>;

  private constructor(root: string, manifest: NyxRegistry) {
    this.root = root;
    this.manifest = manifest;
    this.itemsByName = new Map(manifest.items.map((item) => [item.name, item]));
  }

  static async load(root = process.env.NYX_REGISTRY_ROOT ?? bundledRegistryRoot): Promise<NyxRegistryStore> {
    const resolvedRoot = resolve(root);
    const manifestPath = resolve(resolvedRoot, "registry.json");
    assertInsideRoot(resolvedRoot, manifestPath);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as NyxRegistry;
    return new NyxRegistryStore(resolvedRoot, manifest);
  }

  list(filters: { type?: string | undefined; status?: string | undefined; limit?: number | undefined } = {}): NyxRegistryItem[] {
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
    return this.manifest.items
      .filter((item) => !filters.type || item.type === filters.type)
      .filter((item) => !filters.status || item.status === filters.status)
      .slice(0, limit);
  }

  search(query: string, limit = 10): NyxRegistryItem[] {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    return this.manifest.items
      .map((item) => {
        const text = searchableText(item);
        const matchedTerms = terms.filter((term) => text.includes(term));
        const exactName = item.name.toLowerCase() === query.toLowerCase().trim() ? 100 : 0;
        const nameMatches = terms.filter((term) => item.name.toLowerCase().includes(term)).length * 5;
        const metadataMatches = matchedTerms.length;
        return { item, score: exactName + nameMatches + metadataMatches };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || left.item.name.localeCompare(right.item.name))
      .slice(0, Math.min(Math.max(limit, 1), 50))
      .map(({ item }) => item);
  }

  get(name: string): NyxRegistryItem {
    const item = this.itemsByName.get(name);
    if (!item) throw new Error(`Unknown Nyx registry item: ${name}`);
    return item;
  }

  async source(name: string): Promise<NyxComponentSource[]> {
    const item = this.get(name);
    return Promise.all(
      item.files.map(async (relativePath) => {
        const path = resolve(this.root, relativePath);
        assertInsideRoot(this.root, path);
        return { path: relativePath, content: await readFile(path, "utf8") };
      }),
    );
  }
}
