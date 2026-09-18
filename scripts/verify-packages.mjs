import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = resolve(import.meta.dirname, "..");
const packDirectory = mkdtempSync(join(tmpdir(), "nyx-package-check-"));
const packageDirectories = ["packages/core", "packages/plugins"];

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

function packPackage(packageDirectory) {
  const result = spawnSync(
    "pnpm",
    ["pack", "--json", "--pack-destination", packDirectory],
    {
      cwd: resolve(repositoryRoot, packageDirectory),
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
      maxBuffer: 10 * 1024 * 1024,
      shell: process.platform === "win32",
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `Packing ${packageDirectory} failed.\n${result.error ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );
  }

  const jsonStart = result.stdout.indexOf("{");
  if (jsonStart === -1) {
    throw new Error(`Packing ${packageDirectory} did not return package metadata.`);
  }

  return JSON.parse(result.stdout.slice(jsonStart));
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
    const packedFiles = new Set(packed.files.map((file) => file.path));
    const requiredFiles = [
      "package.json",
      "README.md",
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
} finally {
  rmSync(packDirectory, { recursive: true, force: true });
}
