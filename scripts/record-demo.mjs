#!/usr/bin/env node
/**
 * Regenerates docs/demo.svg from a real session against the built server.
 *
 * Every line in the output SVG is captured from an actual run — nothing here
 * writes prose about what the server "would" return. Run `npm run demo` after
 * changing anything that affects the protocol surface.
 */
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = join(rootDir, 'build', 'index.js');

const REQUESTS = [
  {
    caption: '$ npx @modelcontextprotocol/inspector node build/index.js',
    comment: '# ...or drive it directly over stdio:',
  },
  {
    label: 'resources/list',
    request: { jsonrpc: '2.0', id: 1, method: 'resources/list' },
    render: (result) => result.resources.map((r) => `${r.uri}  —  ${r.name}`),
  },
  {
    label: 'resources/read  guidelines://testing-guide',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/read',
      params: { uri: 'guidelines://testing-guide' },
    },
    render: (result) => result.contents[0].text.split('\n').slice(0, 3),
  },
  {
    label: "tools/call  validate_code_pattern  category='component'",
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'validate_code_pattern',
        arguments: { code: 'const Button: React.FC = () => null;', category: 'component' },
      },
    },
    render: (result) => result.content[0].text.split('\n').filter(Boolean),
  },
  {
    label: "tools/call  search_guidelines  query='StyleX'",
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'search_guidelines', arguments: { query: 'StyleX' } },
    },
    render: (result) => result.content[0].text.split('\n').filter(Boolean).slice(0, 4),
  },
];

async function run() {
  const child = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
  const results = new Map();
  let buffer = '';
  let banner = '';

  child.stderr.on('data', (d) => {
    banner += d.toString();
  });
  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        // Not a complete JSON-RPC frame; the next chunk may finish it.
        continue;
      }
      // Notifications carry no id, and an error response carries no result.
      if (message.id === undefined) continue;
      if (message.error) {
        throw new Error(`server returned an error for id ${message.id}: ${message.error.message}`);
      }
      results.set(message.id, message.result);
    }
  });

  const send = (payload) => child.stdin.write(`${JSON.stringify(payload)}\n`);

  send({
    jsonrpc: '2.0',
    id: 0,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'demo', version: '1.0.0' },
    },
  });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  for (const step of REQUESTS) {
    if (step.request) send(step.request);
  }

  // Wait for every response we asked for rather than guessing at a duration —
  // a fixed sleep turns a slow machine into a spurious "no response" failure.
  const expectedIds = REQUESTS.filter((step) => step.request).map((step) => step.request.id);
  const deadline = Date.now() + 20_000;
  while (expectedIds.some((id) => !results.has(id))) {
    if (Date.now() > deadline) {
      const missing = expectedIds.filter((id) => !results.has(id));
      child.kill();
      throw new Error(`timed out waiting for responses to ids: ${missing.join(', ')}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  child.kill();

  const lines = [];
  lines.push({ text: banner.trim().replace(rootDir, '.'), cls: 'dim' });
  lines.push({ text: '', cls: 'plain' });

  for (const step of REQUESTS) {
    if (step.caption || step.comment) {
      if (step.caption) lines.push({ text: step.caption, cls: 'prompt' });
      if (step.comment) lines.push({ text: step.comment, cls: 'dim' });
      lines.push({ text: '', cls: 'plain' });
      continue;
    }
    const result = results.get(step.request.id);
    if (!result) throw new Error(`no response for ${step.label}`);
    lines.push({ text: `> ${step.label}`, cls: 'prompt' });
    for (const out of step.render(result)) {
      lines.push({ text: `  ${out}`, cls: 'out' });
    }
    lines.push({ text: '', cls: 'plain' });
  }
  return lines;
}

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LINE_HEIGHT = 20;
const PAD = 22;
const CHROME = 34;

function toSvg(lines) {
  const width = 900;
  const height = CHROME + PAD * 2 + lines.length * LINE_HEIGHT;
  const body = lines
    .map((line, i) => {
      const y = CHROME + PAD + (i + 1) * LINE_HEIGHT - 6;
      if (!line.text) return '';
      return `<text x="${PAD}" y="${y}" class="${line.cls}">${escapeXml(line.text)}</text>`;
    })
    .filter(Boolean)
    .join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Terminal session showing the MCP server listing resources and answering tool calls">
  <style>
    .bg { fill: #11141a; }
    .chrome { fill: #1b1f27; }
    text { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 13px; white-space: pre; }
    .prompt { fill: #7ee787; }
    .out { fill: #c9d1d9; }
    .dim { fill: #6e7681; }
    .plain { fill: #c9d1d9; }
    .title { fill: #8b949e; font-size: 12px; }
  </style>
  <rect class="bg" width="${width}" height="${height}" rx="10"/>
  <rect class="chrome" width="${width}" height="${CHROME}" rx="10"/>
  <rect class="chrome" y="${CHROME - 10}" width="${width}" height="10"/>
  <circle cx="20" cy="17" r="6" fill="#ff5f57"/>
  <circle cx="40" cy="17" r="6" fill="#febc2e"/>
  <circle cx="60" cy="17" r="6" fill="#28c840"/>
  <text x="82" y="21" class="title">coding-guidelines-mcp-server — live session</text>
  <g>
    ${body}
  </g>
</svg>
`;
}

const lines = await run();
await writeFile(join(rootDir, 'docs', 'demo.svg'), toSvg(lines));
console.log(`✅ docs/demo.svg regenerated from a live run (${lines.length} lines captured)`);
