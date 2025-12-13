import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';
import { join } from 'path';

export class MCPClient {
  private buffer = '';
  private extensionPath: string;
  private pendingRequests: Map<
    number,
    { reject: (reason: unknown) => void; resolve: (value: unknown) => void; }
  > = new Map();
  private process: ChildProcess | null = null;
  private requestId = 0;

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

  disconnect(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  async generateCode(payload: {
    includeRef?: boolean;
    includeTests?: boolean;
    name: string;
    requirements?: string;
    task: string;
  }): Promise<{
    commands?: string[];
    files?: Array<{ content: string; path: string; }>;
    text: string;
  }> {
    const result = (await this.sendRequest('tools/call', {
      arguments: payload,
      name: 'generate_code',
    })) as {
      commands?: string[];
      content: Array<{ text: string }>;
      files?: Array<{ content: string; path: string; }>;
    };

    return {
      commands: result.commands,
      files: result.files,
      text: result.content?.[0]?.text || 'Could not generate code',
    };
  }

  async getGuidelineSummary(guideline: string): Promise<string> {
    const result = (await this.sendRequest('tools/call', {
      arguments: { guideline },
      name: 'get_guideline_summary',
    })) as { content: Array<{ text: string }> };

    return result.content?.[0]?.text || 'Guideline not found';
  }

  async readResource(uri: string): Promise<string> {
    const result = (await this.sendRequest('resources/read', {
      uri,
    })) as { contents: Array<{ text: string }> };

    return result.contents?.[0]?.text || 'Resource not found';
  }

  async searchGuidelines(query: string): Promise<string> {
    const result = (await this.sendRequest('tools/call', {
      arguments: { query },
      name: 'search_guidelines',
    })) as { content: Array<{ text: string }> };

    return result.content?.[0]?.text || 'No results found';
  }

  async validateCode(code: string, category: string): Promise<string> {
    const result = (await this.sendRequest('tools/call', {
      arguments: { category, code },
      name: 'validate_code_pattern',
    })) as { content: Array<{ text: string }> };

    return result.content?.[0]?.text || 'Validation failed';
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line) as { error?: unknown; id?: number; result?: unknown };
          if (response.id !== undefined) {
            const pending = this.pendingRequests.get(response.id);
            if (pending) {
              this.pendingRequests.delete(response.id);
              if (response.error) {
                pending.reject(response.error);
              } else {
                pending.resolve(response.result);
              }
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  private async sendRequest(method: string, params?: unknown): Promise<unknown> {
    if (!this.process?.stdin) {
      throw new Error('MCP server not connected');
    }

    const id = ++this.requestId;
    const request = {
      id,
      jsonrpc: '2.0',
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { reject, resolve });
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
}
