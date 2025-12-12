"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPClient = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
class MCPClient {
    process = null;
    requestId = 0;
    pendingRequests = new Map();
    buffer = "";
    extensionPath;
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
    }
    async connect() {
        const stderrLogs = [];
        return new Promise((resolve, reject) => {
            // Path to the MCP server (in the same package, build folder)
            const serverPath = (0, path_1.join)(this.extensionPath, "build", "index.js");
            this.process = (0, child_process_1.spawn)("node", [serverPath], {
                stdio: ["pipe", "pipe", "pipe"],
            });
            this.process.stdout?.on("data", (data) => {
                this.buffer += data.toString();
                this.processBuffer();
            });
            this.process.stderr?.on("data", (data) => {
                const message = data.toString();
                stderrLogs.push(message.trim());
                console.error("[MCP stderr]", message.trim());
                if (message.includes("running on stdio")) {
                    resolve();
                }
            });
            this.process.on("error", (error) => {
                reject(error);
            });
            this.process.on("close", (code) => {
                if (code !== 0) {
                    const details = stderrLogs.length ? `: ${stderrLogs.join(" | ")}` : "";
                    reject(new Error(`MCP server exited with code ${code}${details}`));
                }
            });
            // Timeout for connection
            setTimeout(() => resolve(), 1000);
        });
    }
    processBuffer() {
        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() || "";
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const response = JSON.parse(line);
                    if (response.id !== undefined) {
                        const pending = this.pendingRequests.get(response.id);
                        if (pending) {
                            this.pendingRequests.delete(response.id);
                            if (response.error) {
                                pending.reject(response.error);
                            }
                            else {
                                pending.resolve(response.result);
                            }
                        }
                    }
                }
                catch {
                    // Ignore parse errors
                }
            }
        }
    }
    async sendRequest(method, params) {
        if (!this.process?.stdin) {
            throw new Error("MCP server not connected");
        }
        const id = ++this.requestId;
        const request = {
            jsonrpc: "2.0",
            id,
            method,
            params,
        };
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.process.stdin.write(JSON.stringify(request) + "\n");
            // Timeout
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error("Request timeout"));
                }
            }, 10000);
        });
    }
    async searchGuidelines(query) {
        const result = (await this.sendRequest("tools/call", {
            name: "search_guidelines",
            arguments: { query },
        }));
        return result.content?.[0]?.text || "No results found";
    }
    async validateCode(code, category) {
        const result = (await this.sendRequest("tools/call", {
            name: "validate_code_pattern",
            arguments: { code, category },
        }));
        return result.content?.[0]?.text || "Validation failed";
    }
    async getGuidelineSummary(guideline) {
        const result = (await this.sendRequest("tools/call", {
            name: "get_guideline_summary",
            arguments: { guideline },
        }));
        return result.content?.[0]?.text || "Guideline not found";
    }
    async readResource(uri) {
        const result = (await this.sendRequest("resources/read", {
            uri,
        }));
        return result.contents?.[0]?.text || "Resource not found";
    }
    async generateCode(payload) {
        const result = (await this.sendRequest("tools/call", {
            name: "generate_code",
            arguments: payload,
        }));
        return {
            text: result.content?.[0]?.text || "Could not generate code",
            files: result.files,
            commands: result.commands,
        };
    }
    disconnect() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
}
exports.MCPClient = MCPClient;
//# sourceMappingURL=mcp-client.js.map