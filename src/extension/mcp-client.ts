import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

/** The subset of a JSON-RPC response this client acts on. */
type JsonRpcResponse = {
  id?: number | string;
  result?: unknown;
  error?: unknown;
};

const isJsonRpcResponse = (value: unknown): value is JsonRpcResponse =>
  typeof value === 'object' && value !== null;

export class MCPClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests: Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
  > = new Map();
  private buffer = '';
  private extensionPath: string;

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  async connect(): Promise<void> {
    const stderrLogs: string[] = [];

    return new Promise((resolve, reject) => {
      // Path to the MCP server (in the same package, build folder)
      const serverPath = join(this.extensionPath, 'build', 'index.js');

      this.process = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.buffer += data.toString();
        this.processBuffer();
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const message = data.toString();
        stderrLogs.push(message.trim());
        console.error('[MCP stderr]', message.trim());
        if (message.includes('running on stdio')) {
          resolve();
        }
      });

      this.process.on('error', (error) => {
        reject(error);
      });

      this.process.on('close', (code) => {
        if (code !== 0) {
          const details = stderrLogs.length ? `: ${stderrLogs.join(' | ')}` : '';
          reject(new Error(`MCP server exited with code ${code}${details}`));
        }
      });

      // Timeout for connection
      setTimeout(() => resolve(), 1000);
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      let response: unknown;
      try {
        response = JSON.parse(line);
      } catch {
        // Not a complete JSON-RPC frame; ignore it.
        continue;
      }
      if (!isJsonRpcResponse(response) || response.id === undefined) {
        continue;
      }
      const id = Number(response.id);
      const pending = this.pendingRequests.get(id);
      if (!pending) {
        continue;
      }
      this.pendingRequests.delete(id);
      if (response.error === undefined) {
        pending.resolve(response.result);
      } else {
        pending.reject(response.error);
      }
    }
  }

  private async sendRequest(method: string, params?: unknown): Promise<unknown> {
    if (!this.process?.stdin) {
      throw new Error('MCP server not connected');
    }

    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process!.stdin!.write(JSON.stringify(request) + '\n');

      // Timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  async searchGuidelines(query: string): Promise<string> {
    const result = (await this.sendRequest('tools/call', {
      name: 'search_guidelines',
      arguments: { query },
    })) as { content: Array<{ text: string }> };

    return result.content?.[0]?.text || 'No results found';
  }

  async validateCode(code: string, category: string): Promise<string> {
    const result = (await this.sendRequest('tools/call', {
      name: 'validate_code_pattern',
      arguments: { code, category },
    })) as { content: Array<{ text: string }> };

    return result.content?.[0]?.text || 'Validation failed';
  }

  async getGuidelineSummary(guideline: string): Promise<string> {
    const result = (await this.sendRequest('tools/call', {
      name: 'get_guideline_summary',
      arguments: { guideline },
    })) as { content: Array<{ text: string }> };

    return result.content?.[0]?.text || 'Guideline not found';
  }

  async readResource(uri: string): Promise<string> {
    const result = (await this.sendRequest('resources/read', {
      uri,
    })) as { contents: Array<{ text: string }> };

    return result.contents?.[0]?.text || 'Resource not found';
  }

  async generateCode(payload: {
    task: string;
    name: string;
    requirements?: string;
    includeTests?: boolean;
    includeRef?: boolean;
  }): Promise<{
    text: string;
    files?: Array<{ path: string; content: string }>;
    commands?: string[];
  }> {
    const result = (await this.sendRequest('tools/call', {
      name: 'generate_code',
      arguments: payload,
    })) as {
      content: Array<{ text: string }>;
      files?: Array<{ path: string; content: string }>;
      commands?: string[];
    };

    return {
      text: result.content?.[0]?.text || 'Could not generate code',
      files: result.files,
      commands: result.commands,
    };
  }

  disconnect(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
