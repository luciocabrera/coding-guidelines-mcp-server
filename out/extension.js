"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const mcp_client_1 = require("./mcp-client");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const util_1 = require("util");
const child_process_1 = require("child_process");
let mcpClient;
const exec = (0, util_1.promisify)(child_process_1.exec);
/** Render a caught value for display; `catch` bindings are `unknown`. */
const describeError = (error) => error instanceof Error ? error.message : String(error);
async function activate(context) {
    mcpClient = new mcp_client_1.MCPClient(context.extensionPath);
    try {
        await mcpClient.connect();
        vscode.window.showInformationMessage('Coding Guidelines Agent connected!');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to connect to MCP server: ${describeError(error)}`);
    }
    const agent = vscode.chat.createChatParticipant('coding-guidelines.agent', handleChatRequest);
    agent.iconPath = new vscode.ThemeIcon('gear');
    context.subscriptions.push(agent);
    context.subscriptions.push({
        dispose: () => mcpClient.disconnect(),
    });
}
async function handleChatRequest(request, _context, stream, _token) {
    const command = request.command;
    const query = request.prompt;
    try {
        if (!command && needsClarification(query)) {
            stream.markdown(buildClarificationPrompt());
            return { metadata: { command: 'clarify' } };
        }
        if (command === 'generate' || shouldGenerate(query)) {
            if (!hasArtifactTarget(query) || isRestyleRequest(query)) {
                stream.markdown(buildRestylePrompt());
                return { metadata: { command: 'clarify' } };
            }
            const { task, name } = inferGenerationIntent(query);
            if (!query || !query.trim() || name === 'Component') {
                stream.markdown('🔎 I can generate code, but I need a bit more detail. Please share the target artifact (component/feature/page/app), required states, data shape, interactions, visual direction (palette/spacing/typography), a11y needs (aria labels, focus behavior), and any performance constraints.');
                return { metadata: { command: command || 'default' } };
            }
            stream.markdown(`🛠️ Generating ${task} "${name}"...\n\n`);
            const result = await mcpClient.generateCode({
                task,
                name,
                requirements: query,
                includeTests: true,
                includeRef: /\bref\b/i.test(query || ''),
            });
            stream.markdown(result.text + '\n\n');
            const workspace = vscode.workspace.workspaceFolders?.[0];
            if (!workspace) {
                stream.markdown('⚠️ No workspace folder open. Cannot write files or run commands.\n');
                return { metadata: { command: command || 'default' } };
            }
            await ensureReactProject(workspace.uri.fsPath, stream);
            if (result.files?.length) {
                await writeGeneratedFiles(workspace.uri.fsPath, result.files, stream);
            }
            if (result.commands?.length) {
                await ensureScriptsForCommands(workspace.uri.fsPath, result.commands, stream);
                await runPostCommands(workspace.uri.fsPath, result.commands, stream);
            }
        }
        else if (command === 'search' || (!command && query)) {
            const scripts = detectScriptRequests(query);
            if (scripts.length) {
                const workspace = vscode.workspace.workspaceFolders?.[0];
                if (!workspace) {
                    stream.markdown('⚠️ No workspace folder open. Cannot update package.json.\n');
                    return { metadata: { command: command || 'default' } };
                }
                await ensureScriptsForCommands(workspace.uri.fsPath, scripts.map((s) => `npm run ${s}`), stream);
                stream.markdown(`✅ Ensured scripts: ${scripts.join(', ')}\n`);
                return { metadata: { command: command || 'default' } };
            }
            stream.markdown('🔍 Searching guidelines...\n\n');
            const result = await mcpClient.searchGuidelines(query);
            stream.markdown(result);
        }
        else if (command === 'validate') {
            stream.markdown('✅ Validating code...\n\n');
            const result = await mcpClient.validateCode(query, 'component');
            stream.markdown(result);
        }
        else if (command === 'summary') {
            stream.markdown('📖 Getting guideline summary...\n\n');
            const result = await mcpClient.getGuidelineSummary(query);
            stream.markdown(result);
        }
        else {
            if (query) {
                const result = await mcpClient.searchGuidelines(query);
                stream.markdown(result);
                if (/no results/i.test(result)) {
                    stream.markdown(buildFallbackMessage());
                }
            }
            else {
                stream.markdown(getHelpMessage());
            }
        }
    }
    catch (error) {
        stream.markdown(`❌ Error: ${describeError(error)}`);
    }
    return { metadata: { command: command || 'default' } };
}
function detectScriptRequests(query) {
    if (!query)
        return [];
    const targets = ['format', 'lint', 'test', 'typecheck', 'type-check', 'type:check'];
    const matches = [];
    for (const name of targets) {
        const re = new RegExp(`(add|create|ensure).{0,40}${name}\\s+script`, 'i');
        if (re.test(query)) {
            matches.push(name);
        }
    }
    return Array.from(new Set(matches));
}
function buildFallbackMessage() {
    return [
        '🤔 I don’t have a built-in action for that.',
        'Try @copilot for a free-form answer, or give me a clearer target (component/page/feature) and what you want changed so I can help directly.',
    ].join('\n');
}
function shouldGenerate(query) {
    if (!query)
        return false;
    return /\b(generate|create|build|bootstrap|scaffold|component|feature|project|make|improve|enhance|redesign|restyle|style|design|attractive|prettier|beautify)\b/i.test(query);
}
function inferGenerationIntent(query) {
    const normalized = query || '';
    const stripped = normalized.replace(/@guidelines/gi, '').trim();
    const hasFeature = /\bfeature\b/i.test(stripped);
    const hasBootstrap = /\bbootstrap|project|app|application\b/i.test(stripped);
    const hasHook = /\bhook\b/i.test(stripped);
    let task = 'component';
    if (hasFeature)
        task = 'feature';
    if (hasBootstrap)
        task = 'bootstrap';
    if (hasHook)
        task = 'hook';
    const nameMatch = stripped.match(/(?:create|build|generate|for|named|called)\s+([A-Za-z0-9 -]+)/i);
    const rawName = nameMatch?.[1]?.trim() || stripped.trim() || 'Component';
    const name = normalizeArtifactName(rawName, stripped);
    return { task, name };
}
function normalizeArtifactName(raw, query) {
    const cleaned = raw
        .replace(/^['"`]/, '')
        .replace(/['"`]$/, '')
        .replace(/\s+/g, ' ')
        .trim();
    const noArticle = cleaned.replace(/^(?:a|an|the)\s+/i, '').trim();
    const canonical = canonicalArtifactName(query, noArticle);
    if (canonical)
        return canonical;
    if (!noArticle)
        return 'Component';
    const parts = noArticle
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .slice(0, 3);
    if (!parts.length)
        return 'Component';
    return parts.map(toPascal).join('');
}
function canonicalArtifactName(query, fallback) {
    const whitelist = [
        { match: /\bnav\s*bar\b|\bnavbar\b/i, name: 'Navbar' },
        { match: /\bheader\b/i, name: 'Header' },
        { match: /\bfooter\b/i, name: 'Footer' },
        { match: /\bhero\b/i, name: 'Hero' },
        { match: /\bsidebar\b/i, name: 'Sidebar' },
        { match: /\bmenu\b/i, name: 'Menu' },
        { match: /\bbutton\b/i, name: 'Button' },
        { match: /\bcard\b/i, name: 'Card' },
        { match: /\bmodal\b|\bdialog\b/i, name: 'Modal' },
        { match: /\bbanner\b/i, name: 'Banner' },
        { match: /\bdrawer\b/i, name: 'Drawer' },
        { match: /\blist\b/i, name: 'List' },
        { match: /\btable\b/i, name: 'Table' },
        { match: /\bgrid\b/i, name: 'Grid' },
        { match: /\bchart\b/i, name: 'Chart' },
        { match: /\bdashboard\b/i, name: 'Dashboard' },
        { match: /\blayout\b/i, name: 'Layout' },
        { match: /\bsection\b/i, name: 'Section' },
        { match: /\bpage\b|\bscreen\b|\bview\b/i, name: 'Page' },
        { match: /\bform\b/i, name: 'Form' },
        { match: /\binput\b/i, name: 'Input' },
        { match: /\bselect\b/i, name: 'Select' },
        { match: /\btextarea\b/i, name: 'Textarea' },
        { match: /\bcheckbox\b/i, name: 'Checkbox' },
        { match: /\bradio\b/i, name: 'Radio' },
        { match: /\btoggle\b|\bswitch\b/i, name: 'Toggle' },
        { match: /\bavatar\b/i, name: 'Avatar' },
        { match: /\bbadge\b/i, name: 'Badge' },
        { match: /\bbreadcrumb\b/i, name: 'Breadcrumb' },
        { match: /\btab\b/i, name: 'Tabs' },
        { match: /\bpagination\b/i, name: 'Pagination' },
        { match: /\btooltip\b/i, name: 'Tooltip' },
        { match: /\bpopover\b/i, name: 'Popover' },
        { match: /\btoast\b|\balert\b|\bnotification\b/i, name: 'Toast' },
        { match: /\bprogress\b/i, name: 'Progress' },
        { match: /\bspinner\b|\bloader\b/i, name: 'Spinner' },
        { match: /\bchip\b|\bpill\b/i, name: 'Chip' },
        { match: /\bcallout\b|\bnote\b/i, name: 'Callout' },
    ];
    for (const item of whitelist) {
        if (item.match.test(query) || item.match.test(fallback)) {
            return item.name;
        }
    }
    return undefined;
}
function toPascal(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
function hasArtifactTarget(query) {
    if (!query)
        return false;
    const artifacts = /\b(component|feature|page|screen|view|section|layout|card|panel|form|button|link|navbar|footer|header|hero|modal|dialog|banner|drawer|list|table|grid|chart|dashboard)\b/i;
    const fileRef = /\.(tsx?|jsx?)\b/i;
    return artifacts.test(query) || fileRef.test(query);
}
function isRestyleRequest(query) {
    if (!query)
        return false;
    return /\b(restyle|re-style|make\s+it\s+more\s+attractive|too\s+simple|prettier|beautify|modernize|more\s+modern|better\s+looking|more\s+stylish|more\s+beautiful)\b/i.test(query);
}
function needsClarification(query) {
    if (!query)
        return true;
    const text = query.trim();
    if (!text)
        return true;
    const wordCount = text.split(/\s+/).length;
    const hasVerb = /\b(add|create|generate|make|improve|enhance|fix|debug|review|summarize|validate|search|bootstrap|style|design|restyle|refactor|optimize|test)\b/i.test(text);
    return wordCount < 5 || !hasVerb;
}
function buildClarificationPrompt() {
    return [
        '🤝 I can help, but I need a bit more detail.',
        'Please specify: what you want (component/feature/page/app), key states and interactions, data shape, visual direction (palette/spacing/typography), accessibility needs (aria/focus/labels), and any performance constraints or deadlines.',
        "You can reply in bullets, e.g.: 'Generate a dashboard hero with CTA, secondary link, loading/success/error states, prefers high-contrast, 2-column on desktop, single column on mobile.'",
        'For restyles, include the target file or pasted code and the vibe: bold/minimal/playful, brand colors, gradients or not, spacing/rounding, motion, and contrast preferences.',
    ].join('\n\n');
}
function buildRestylePrompt() {
    return [
        '✨ Happy to make it more attractive, but I need the target.',
        'Please share: component/page/feature name, file path (or paste the code), current pain points, and the visual direction (e.g., bold, minimal, high-contrast, playful, brand colors, gradients, rounding, motion).',
        "Example: 'Restyle HeroSection in src/components/HeroSection.tsx: feels flat. Want high-contrast hero with a soft gradient, larger headline, 16px->24px spacing, 12px rounding, pronounced focus rings, and a gentle fade-in on load.'",
    ].join('\n');
}
function getHelpMessage() {
    return [
        '# Coding Guidelines Agent',
        'I can help with guidelines, validation, summaries, or generating code.',
        'Commands:',
        '- @guidelines [query] — Search for guidelines',
        '- @guidelines /search [query] — Search for specific patterns',
        '- @guidelines /validate [code] — Validate code against guidelines',
        '- @guidelines /summary [name] — Get summary of a guideline document',
        '- @guidelines /generate [ask] — Generate components, features, or bootstrap plans',
        'Examples:',
        '- @guidelines StyleX',
        '- @guidelines /search component patterns',
        '- @guidelines /validate const MyComponent = () => {}',
        '- @guidelines /summary Coding Guidelines',
        '- @guidelines /generate create a Button component with loading state',
    ].join('\n');
}
async function writeGeneratedFiles(workspaceRoot, files, stream) {
    for (const file of files) {
        const absPath = (0, path_1.join)(workspaceRoot, file.path);
        await (0, promises_1.mkdir)((0, path_1.dirname)(absPath), { recursive: true });
        await (0, promises_1.writeFile)(absPath, file.content, 'utf8');
        stream.markdown(`✅ Wrote ${file.path}\n`);
    }
}
async function ensureScriptsForCommands(cwd, commands, stream) {
    const scriptNames = new Set();
    for (const cmd of commands) {
        const runMatch = cmd.match(/^npm\s+run\s+([a-zA-Z0-9:_-]+)/);
        const testMatch = cmd.match(/^npm\s+test/);
        if (runMatch?.[1]) {
            scriptNames.add(runMatch[1]);
        }
        else if (testMatch) {
            scriptNames.add('test');
        }
    }
    if (!scriptNames.size)
        return;
    const pkgPath = (0, path_1.join)(cwd, 'package.json');
    try {
        const pkgRaw = await (0, promises_1.readFile)(pkgPath, 'utf8');
        const pkg = JSON.parse(pkgRaw);
        const scripts = pkg.scripts ?? {};
        let modified = false;
        for (const name of scriptNames) {
            if (scripts[name])
                continue;
            if (name === 'format') {
                scripts[name] = "echo 'Format script not configured; skipping.'";
            }
            else if (name === 'lint') {
                scripts[name] = "echo 'Lint script not configured; skipping.'";
            }
            else if (name === 'typecheck' || name === 'type-check' || name === 'type:check') {
                scripts[name] = "echo 'Typecheck script not configured; skipping.'";
            }
            else if (name === 'test') {
                scripts[name] = "echo 'Test script not configured; skipping.'";
            }
            else {
                scripts[name] =
                    `echo "Script '${name}' is not configured yet. Please update package.json with your desired command."`;
            }
            stream.markdown(`ℹ️ Added placeholder script '${name}' to package.json\n`);
            modified = true;
        }
        if (modified) {
            pkg.scripts = scripts;
            await (0, promises_1.writeFile)(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
        }
    }
    catch (error) {
        stream.markdown(`⚠️ Unable to ensure scripts: ${describeError(error)}\n`);
    }
}
async function runPostCommands(cwd, commands, stream) {
    for (const cmd of commands) {
        try {
            stream.markdown(`▶️ ${cmd}\n`);
            const { stdout, stderr } = await exec(cmd, { cwd });
            if (stdout) {
                stream.markdown('```\n' + stdout.trim() + '\n```\n');
            }
            if (stderr) {
                stream.markdown('```\n' + stderr.trim() + '\n```\n');
            }
        }
        catch (error) {
            const message = String(error);
            const isMissingScript = /Missing script/i.test(message);
            if (isMissingScript) {
                await ensureScriptsForCommands(cwd, [cmd], stream);
                stream.markdown(`↻ Retrying ${cmd} after adding missing script...\n`);
                try {
                    const { stdout, stderr } = await exec(cmd, { cwd });
                    if (stdout) {
                        stream.markdown('```\n' + stdout.trim() + '\n```\n');
                    }
                    if (stderr) {
                        stream.markdown('```\n' + stderr.trim() + '\n```\n');
                    }
                    continue;
                }
                catch (retryError) {
                    stream.markdown(`⚠️ Command failed again: ${cmd} - ${describeError(retryError)}\n`);
                    break;
                }
            }
            stream.markdown(`⚠️ Command failed: ${cmd} - ${describeError(error)}\n`);
            break;
        }
    }
}
async function ensureReactProject(cwd, stream) {
    const pkgPath = (0, path_1.join)(cwd, 'package.json');
    let hasReact = false;
    try {
        const pkgRaw = await (0, promises_1.readFile)(pkgPath, 'utf8');
        const pkg = JSON.parse(pkgRaw);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        hasReact = Boolean(deps.react ?? deps['react-dom']);
    }
    catch {
        // no package or unreadable
    }
    if (hasReact)
        return;
    stream.markdown('🚀 No React project detected. Bootstrapping Vite + React 19 + TS + ESLint/Prettier/StyleX...\n');
    const bootstrapCommands = [
        'npm create vite@latest . -- --template react-ts',
        'npm install @stylexjs/stylex @stylexjs/babel-plugin @stylexjs/eslint-plugin zod react-router-dom @types/react-router-dom --legacy-peer-deps',
        'npm install -D eslint prettier typescript @types/node @types/react @types/react-dom @types/jsdom jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest @vitest/coverage-v8 eslint-plugin-react eslint-plugin-react-hooks typescript-eslint --legacy-peer-deps',
    ];
    await runPostCommands(cwd, bootstrapCommands, stream);
    await ensureSingleEslintConfig(cwd, stream);
}
async function ensureSingleEslintConfig(cwd, stream) {
    const jsConfigPath = (0, path_1.join)(cwd, 'eslint.config.js');
    await (0, promises_1.rm)(jsConfigPath, { force: true }).catch(() => { });
    const mjsConfigPath = (0, path_1.join)(cwd, 'eslint.config.mjs');
    const content = `import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import stylex from "@stylexjs/eslint-plugin";
import prettier from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  react.configs.recommended,
  react.configs["jsx-runtime"],
  reactHooks.configs.recommended,
  prettier,
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["dist", "build", "node_modules"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      stylex,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "prettier/prettier": "error",
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "stylex/no-inline-styles": "error",
      "stylex/sort-shorthand-properties": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "react/no-unstable-nested-components": "warn",
      "react/jsx-no-useless-fragment": "warn",
      "no-console": ["warn", { allow: ["error"] }],
    },
  }
);
`;
    await (0, promises_1.writeFile)(mjsConfigPath, content, 'utf8');
    stream.markdown('✅ Ensured single eslint.config.mjs with React/TS/StyleX/Prettier rules\n');
}
function deactivate() {
    if (mcpClient) {
        mcpClient.disconnect();
    }
}
//# sourceMappingURL=extension.js.map