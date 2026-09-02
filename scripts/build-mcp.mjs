#!/usr/bin/env node
import * as esbuild from "esbuild";
import { chmod, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

async function build() {
  await esbuild.build({
    entryPoints: [join(rootDir, "src/index.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    outfile: join(rootDir, "build/index.js"),
  });

  // Make executable
  await chmod(join(rootDir, "build/index.js"), 0o755);

  // The bundle is ESM, but the root package.json has no "type" field (and must
  // not gain one — the VS Code extension in out/ is CommonJS). Marking only the
  // build directory as ESM stops Node emitting MODULE_TYPELESS_PACKAGE_JSON on
  // every start, which otherwise lands on the stderr channel MCP clients read.
  await writeFile(join(rootDir, "build/package.json"), JSON.stringify({ type: "module" }) + "\n");

  console.log("✅ MCP server built successfully");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
