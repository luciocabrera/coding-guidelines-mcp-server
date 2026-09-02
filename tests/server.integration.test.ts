import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FIXTURE_GUIDELINES_PATH, REPO_ROOT } from './helpers.js';

const SERVER_PATH = join(REPO_ROOT, 'build', 'index.js');

type JsonRpcResponse = {
  jsonrpc: string;
  id: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
};

/**
 * Drives the built server over stdio exactly as an MCP client does — this is the
 * README's "Direct Testing" transcript, executed rather than described.
 */
class ServerHarness {
  private readonly child: ChildProcessWithoutNullStreams;
  private buffer = '';
  private readonly pending = new Map<number, (value: JsonRpcResponse) => void>();
  private nextId = 0;
  readonly unparsed: string[] = [];

  constructor() {
    this.child = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, GUIDELINES_PATH: FIXTURE_GUIDELINES_PATH },
    });

    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk: string) => {
      this.buffer += chunk;
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        let message: JsonRpcResponse;
        try {
          message = JSON.parse(line) as JsonRpcResponse;
        } catch {
          // A non-JSON line on stdout is a server bug, not a harness one. Record it
          // so a test can assert on it, rather than throwing inside a 'data' handler
          // where it would take down the whole run with an opaque stack.
          this.unparsed.push(line);
          continue;
        }
        this.pending.get(message.id)?.(message);
        this.pending.delete(message.id);
      }
    });
  }

  send(method: string, params?: Record<string, unknown>): Promise<JsonRpcResponse> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`timed out waiting for ${method}`));
      }, 10_000);
      this.pending.set(id, (message) => {
        clearTimeout(timer);
        resolve(message);
      });
      this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });
  }

  notify(method: string): void {
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method })}\n`);
  }

  stop(): void {
    this.child.kill();
  }
}

describe('MCP server over stdio', () => {
  let server: ServerHarness;

  beforeAll(async () => {
    expect(
      existsSync(SERVER_PATH),
      `${SERVER_PATH} is missing — run \`npm run build\` before the integration test`,
    ).toBe(true);

    server = new ServerHarness();

    const initialize = await server.send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'vitest', version: '1.0.0' },
    });

    expect(initialize.error).toBeUndefined();
    expect(initialize.result?.serverInfo).toMatchObject({ name: 'coding-guidelines-server' });
    server.notify('notifications/initialized');
  });

  afterAll(() => server?.stop());

  it('lists every guideline as a resource', async () => {
    const response = await server.send('resources/list');

    expect(response.jsonrpc).toBe('2.0');
    expect(response.error).toBeUndefined();

    const resources = response.result?.resources as Array<{ uri: string; mimeType: string }>;
    expect(resources).toHaveLength(5);
    expect(resources.map((r) => r.uri)).toEqual([
      'guidelines://coding-guidelines',
      'guidelines://enterprise-standards',
      'guidelines://testing-guide',
      'guidelines://e2e-testing',
      'guidelines://complete-setup',
    ]);
    for (const resource of resources) {
      expect(resource.mimeType).toBe('text/markdown');
    }
  });

  it('reads a resource back by URI', async () => {
    const response = await server.send('resources/read', {
      uri: 'guidelines://testing-guide',
    });

    expect(response.error).toBeUndefined();
    const contents = response.result?.contents as Array<{ uri: string; text: string }>;
    expect(contents[0]?.uri).toBe('guidelines://testing-guide');
    expect(contents[0]?.text).toContain('Sample Testing Guide');
  });

  it('returns an error for an unknown resource URI rather than failing silently', async () => {
    const response = await server.send('resources/read', { uri: 'guidelines://nope' });

    expect(response.error).toBeDefined();
    expect(response.error?.message).toContain('guidelines://nope');
  });

  it('lists every tool', async () => {
    const response = await server.send('tools/list');

    const tools = response.result?.tools as Array<{ name: string }>;
    expect(tools.map((t) => t.name).sort()).toEqual([
      'generate_code',
      'get_guideline_summary',
      'search_guidelines',
      'validate_code_pattern',
    ]);
  });

  it('calls search_guidelines and returns a text content envelope', async () => {
    const response = await server.send('tools/call', {
      name: 'search_guidelines',
      arguments: { query: 'StyleX' },
    });

    expect(response.error).toBeUndefined();
    const content = response.result?.content as Array<{ type: string; text: string }>;
    expect(content[0]?.type).toBe('text');
    expect(content[0]?.text).toContain('Found results in 2 documents');
  });

  it('calls validate_code_pattern', async () => {
    const response = await server.send('tools/call', {
      name: 'validate_code_pattern',
      arguments: { code: 'const Button = () => null;', category: 'component' },
    });

    const content = response.result?.content as Array<{ text: string }>;
    expect(content[0]?.text).toContain('Code follows guidelines!');
  });

  it('writes nothing but JSON-RPC frames to stdout', () => {
    // stdout is the protocol channel; anything else corrupts a real client's stream.
    expect(server.unparsed).toEqual([]);
  });

  it('returns an error for an unknown tool', async () => {
    const response = await server.send('tools/call', {
      name: 'no_such_tool',
      arguments: {},
    });

    expect(response.error).toBeDefined();
    expect(response.error?.message).toContain('no_such_tool');
  });

  it('rejects malformed tool input rather than crashing the server', async () => {
    const malformed = await server.send('tools/call', {
      name: 'validate_code_pattern',
      arguments: { code: 'const a = 1;', category: 'not-a-real-category' },
    });

    const content = malformed.result?.content as Array<{ text: string }> | undefined;
    expect(malformed.error ?? content?.[0]?.text).toBeDefined();

    // The server must still be alive and answering afterwards.
    const followUp = await server.send('resources/list');
    expect((followUp.result?.resources as unknown[]).length).toBe(5);
  });
});
