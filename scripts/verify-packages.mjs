import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = resolve(import.meta.dirname, "..");
const packDirectory = mkdtempSync(join(tmpdir(), "nyx-package-check-"));
const packageDirectories = ["packages/core", "packages/plugins", "packages/mcp"];
const packages = [];

if (!packDirectory.startsWith(`${resolve(tmpdir())}${sep}`)) {
  throw new Error("Package verification directory must stay inside the system temp directory.");
}

function collectExportTargets(value, targets = []) {
  if (typeof value === "string") {
    targets.push(value);
    return targets;
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      collectExportTargets(child, targets);
    }
  }

  return targets;
}

function run(command, args, cwd) {
  // Invoke the current package manager through Node when available, so paths
  // containing spaces do not pass through shell argument concatenation.
  const packageManager = command === "pnpm" ? process.env.npm_execpath : undefined;
  const executable = command === "node" || packageManager ? process.execPath : command;
  const result = spawnSync(executable, packageManager ? [packageManager, ...args] : args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 10 * 1024 * 1024,
    shell: process.platform === "win32" && executable === "pnpm",
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed.\n${result.error ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  return result.stdout;
}

function verifyInstalledConsumer() {
  const consumer = join(packDirectory, "consumer");
  // Use the adopter's copy path, but install only the tarballs under review.
  run("node", ["scripts/copy-workspace-example.mjs", consumer], repositoryRoot);
  const manifestPath = join(consumer, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const { name, tarball } of packages) {
    manifest.dependencies[name] = `file:${tarball.replaceAll("\\", "/")}`;
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  run("pnpm", ["install", "--ignore-workspace", "--no-frozen-lockfile"], consumer);

  const entries = packages.flatMap(({ name, exports }) =>
    Object.entries(exports).map(([subpath, target]) => ({
      name,
      specifier: name + (subpath === "." ? "" : subpath.slice(1)),
      runtime: typeof target === "string" ? target : target.default,
      types: typeof target === "string" ? target : target.types,
    })),
  );
  // Resolve from the consumer, using both runtime and declaration conditions.
  // realpath also rejects an accidental link back into the repository.
  writeFileSync(join(consumer, "verify-resolution.mjs"), `
import assert from "node:assert/strict";
import { realpathSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const entries = ${JSON.stringify(entries)};
const installedRoot = resolve("node_modules") + sep;
for (const entry of entries) {
  const target = process.argv[2] === "types" ? entry.types : entry.runtime;
  assert.ok(target, entry.specifier + " has no target");
  const actual = realpathSync(fileURLToPath(import.meta.resolve(entry.specifier)));
  const expected = realpathSync(resolve("node_modules", entry.name, target));
  assert.equal(actual, expected, entry.specifier);
  assert.ok(actual.startsWith(installedRoot), entry.specifier + " escapes consumer installation");
  assert.ok(statSync(actual).isFile(), entry.specifier);
  if (entry.name === "@nyx-raul/plugins") assert.ok(target.startsWith("./dist/"), entry.specifier);
}
console.log("Verified " + entries.length + " installed exports (" + process.argv[2] + ")");
`);
  console.log(run("node", ["verify-resolution.mjs", "runtime"], consumer).trim());
  console.log(run("node", ["--conditions=types", "verify-resolution.mjs", "types"], consumer).trim());
  // TypeScript must also be able to consume every plugin declaration subpath.
  writeFileSync(join(consumer, "verify-types.ts"), entries
    .filter(entry => entry.name === "@nyx-raul/plugins")
    .map((entry, index) => `import type * as Export${index} from ${JSON.stringify(entry.specifier)};`)
    .join("\n"));
  run("pnpm", ["build"], consumer);
  console.log("Installed consumer: declaration imports and canonical example build passed");
}

function packPackage(packageDirectory) {
  const output = run(
    "pnpm",
    ["pack", "--json", "--pack-destination", packDirectory],
    resolve(repositoryRoot, packageDirectory),
  );
  const jsonStart = output.indexOf("{");
  if (jsonStart === -1) {
    throw new Error(`Packing ${packageDirectory} did not return package metadata.`);
  }

  return JSON.parse(output.slice(jsonStart));
}

try {
  for (const packageDirectory of packageDirectories) {
    const manifestPath = resolve(repositoryRoot, packageDirectory, "package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    if (manifest.private === true) {
      throw new Error(`${manifest.name} is marked private.`);
    }
    if (manifest.publishConfig?.access !== "public") {
      throw new Error(`${manifest.name} is not configured for public publication.`);
    }
    if (!manifest.license || !manifest.repository) {
      throw new Error(`${manifest.name} is missing license or repository metadata.`);
    }

    const packed = packPackage(packageDirectory);
    packages.push({ ...manifest, tarball: resolve(packDirectory, packed.filename) });
    const packedFiles = new Set(packed.files.map((file) => file.path));
    const requiredFiles = [
      "package.json",
      "README.md",
      "LICENSE",
      ...collectExportTargets(manifest.exports).map((target) =>
        target.replace(/^\.\//, ""),
      ),
    ];

    for (const requiredFile of requiredFiles) {
      if (!packedFiles.has(requiredFile)) {
        throw new Error(`${manifest.name} is missing ${requiredFile} from its tarball.`);
      }
    }

    console.log(
      `${manifest.name}@${manifest.version}: verified ${packed.files.length} packed files`,
    );
  }
  verifyInstalledConsumer();
} finally {
  rmSync(packDirectory, { recursive: true, force: true });
}
