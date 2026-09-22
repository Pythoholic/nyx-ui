import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../", import.meta.url));
if (!process.argv[2]) throw new Error("Provide a new destination directory.");
const destination = resolve(process.argv[2]);
if (existsSync(destination)) throw new Error("Destination already exists; choose a new directory.");
cpSync(resolve(repository, "registry/examples/render-workspace"), destination, {
  recursive: true,
  filter: path => !/(?:^|[\\/])(?:node_modules|dist)(?:[\\/]|$)/.test(path),
});
const packagePath = resolve(destination, "package.json");
const manifest = JSON.parse(readFileSync(packagePath, "utf8"));
for (const name of ["core", "plugins"]) {
  const version = JSON.parse(readFileSync(resolve(repository, `packages/${name}/package.json`), "utf8")).version;
  manifest.dependencies[`@nyx-raul/${name}`] = `^${version}`;
}
manifest.name = "render-workspace";
manifest.scripts.dev = "vite --host 127.0.0.1 --port 5174 --strictPort";
writeFileSync(packagePath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Created ${destination}. Run pnpm install, then pnpm dev there.`);
