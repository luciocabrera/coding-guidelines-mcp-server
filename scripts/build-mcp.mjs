#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { chmod } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

async function build() {
  await esbuild.build({
    entryPoints: [join(rootDir, 'src/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: join(rootDir, 'build/index.js'),
  });

  // Make executable
  await chmod(join(rootDir, 'build/index.js'), 0o755);

  console.log('✅ MCP server built successfully');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
