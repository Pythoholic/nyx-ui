import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";

const packageRoot = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(packageRoot, "..", "..", "registry");
const outputRoot = resolve(packageRoot, "dist", "registry");
const manifest = JSON.parse(readFileSync(resolve(sourceRoot, "registry.json"), "utf8"));

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });
writeFileSync(resolve(outputRoot, "registry.json"), `${JSON.stringify(manifest, null, 2)}\n`);

for (const item of manifest.items) {
  for (const relativePath of item.files) {
    const source = resolve(sourceRoot, relativePath);
    const output = resolve(outputRoot, relativePath);
    if (!source.startsWith(`${sourceRoot}${sep}`) || !output.startsWith(`${outputRoot}${sep}`)) {
      throw new Error(`Registry file escapes its root: ${relativePath}`);
    }
    mkdirSync(dirname(output), { recursive: true });
    cpSync(source, output);
  }
}
