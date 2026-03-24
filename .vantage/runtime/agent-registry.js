import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadMemory } from './memory-manager.js';
import { loadIndex, loadMergedIndex } from './toolkit-loader.js';
import { sanitizeId } from './utils.js';
import { getModelForAgent } from './agent-tiers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(__dirname, '..', '..', 'agents');
const PRESETS_FILE = path.resolve(__dirname, '..', '..', 'Arch standard', 'team-presets.md');

const SCHEMAS_DIR = path.resolve(__dirname, '..', 'toolkits', 'schemas');
const MAIN_AGENTS = ['00', '08', '24'];
const CORE_TEAM = ['00', '08', '24', '27', '28'];

/**
 * Load a single agent: prompt file, memory, and toolkit index.
 * @param {string} agentId  e.g. '08-security-architect' or '08'
 * @param {object} projectConfig
 * @returns {{ prompt: string, memory: string, toolkitIndex: string, config: object }}
 */
export function loadAgent(agentId, projectConfig = {}) {
  const agentFile = findAgentFile(agentId);
  const prompt = agentFile ? fs.readFileSync(agentFile, 'utf-8') : '';
  const memoryBudget = projectConfig?.memory?.injection_budget || 500;
  const memory = loadMemory(agentId, memoryBudget);
  const toolkitIndex = loadMergedIndex(agentId);
  const numericId = agentId.split('-')[0];
  const isMainAgent = MAIN_AGENTS.includes(numericId);

  const model = getModelForAgent(agentId, projectConfig);
  return { prompt, memory, toolkitIndex, model, config: { memoryBudget, isMainAgent } };
}

/**
 * Find the .md file for an agent, supporting both exact IDs and numeric prefix.
 */
function findAgentFile(agentId) {
  const direct = path.join(AGENTS_DIR, `${sanitizeId(agentId)}.md`);
  if (fs.existsSync(direct)) return direct;

  const prefix = agentId.split('-')[0];
  if (!fs.existsSync(AGENTS_DIR)) return null;
  const files = fs.readdirSync(AGENTS_DIR);
  const match = files.find(f => f.startsWith(`${prefix}-`) && f.endsWith('.md'));
  return match ? path.join(AGENTS_DIR, match) : null;
}

/**
 * Parse team-presets.md which embeds YAML blocks like:
 *
 *   ```yaml
 *   preset: minimum-viable
 *   mandatory:
 *     - 00-orchestrator
 *     ...
 *   ```
 *
 * Returns agent numeric IDs (zero-padded, e.g. '00', '08') for the
 * mandatory list of the requested preset. Always merges CORE_TEAM.
 *
 * @param {string} preset  e.g. 'minimum-viable'
 * @returns {string[]}
 */
export function getTeamAgents(preset) {
  if (!fs.existsSync(PRESETS_FILE)) return [...CORE_TEAM];
  const content = fs.readFileSync(PRESETS_FILE, 'utf-8');

  // Extract all ```yaml ... ``` fenced blocks
  const fenceRegex = /```yaml\s*([\s\S]*?)```/g;
  let match;
  while ((match = fenceRegex.exec(content)) !== null) {
    const block = match[1];

    // Check if this block declares the requested preset
    const presetLineRegex = /^preset:\s*["']?([^"'\s]+)["']?/m;
    const presetMatch = block.match(presetLineRegex);
    if (!presetMatch) continue;

    const blockPreset = presetMatch[1].trim();
    if (blockPreset !== preset) continue;

    // Found the right block — extract mandatory list
    const ids = extractMandatoryIds(block);
    return [...new Set([...CORE_TEAM, ...ids])];
  }

  // Preset not found — return core team
  return [...CORE_TEAM];
}

/**
 * Extract numeric IDs from the mandatory: section of a YAML block string.
 */
function extractMandatoryIds(yamlBlock) {
  const mandatoryIdx = yamlBlock.search(/^mandatory:/m);
  if (mandatoryIdx === -1) return [];

  const afterMandatory = yamlBlock.slice(mandatoryIdx);
  // Stop at next top-level key (recommended:, optional:, etc.)
  const endIdx = afterMandatory.slice(1).search(/^[a-z_]+:/m);
  const block = endIdx === -1 ? afterMandatory : afterMandatory.slice(0, endIdx + 1);

  const ids = [];
  for (const line of block.split('\n')) {
    const m = line.match(/^\s+-\s+(\d{2})/);
    if (m) ids.push(m[1]);
  }
  return ids;
}

/**
 * Assemble a complete prompt for dispatch.
 *
 * Returns either a plain string (format='string') or an array of
 * cache-annotated content blocks (format='messages') for use with
 * prompt caching APIs (Anthropic cache_control, OpenAI cached prompts).
 *
 * @param {string} agentId
 * @param {string} task
 * @param {object} context  Optional: { projectStack, specs, outputSchema }
 * @param {object} projectConfig  Optional: { memory: { injection_budget } }
 * @param {object} options  Optional: { format: 'string'|'messages' }
 * @returns {string|Array<{text: string, cache_control?: object}>}
 */
export function buildPrompt(agentId, task, context = {}, projectConfig = {}, options = {}) {
  const agent = loadAgent(agentId, projectConfig);
  const format = options.format || 'string';

  // Content blocks ordered for cache efficiency:
  // 1. Static content FIRST (agent prompt, toolkit) — cached across dispatches
  // 2. Semi-static content (memory, specs) — cached within session
  // 3. Dynamic content LAST (task, output format) — never cached
  const blocks = [];

  // --- STATIC: Agent definition + toolkit (cacheable across all dispatches) ---
  if (agent.prompt) {
    blocks.push({
      text: `## Agent Definition\n\n${agent.prompt}`,
      cache_control: { type: 'ephemeral' },  // 5-min cache (reused across dispatches)
    });
  }

  if (agent.toolkitIndex) {
    blocks.push({
      text: `## Available Tools\n\nYour toolkit has two tiers: **general tools** (shared across all agents) and **specialized tools** (unique to your role). Specialized tools take precedence if IDs overlap.\n\n\`\`\`yaml\n${agent.toolkitIndex}\`\`\`\n\nTo use a tool, describe which tool you want and why. The orchestrator will load its full definition.`,
      cache_control: { type: 'ephemeral' },
    });
  }

  // --- SEMI-STATIC: Project context (cacheable within session) ---
  if (context.projectStack) {
    blocks.push({
      text: `## Project Stack\n\n${Array.isArray(context.projectStack) ? context.projectStack.join(', ') : context.projectStack}`,
      cache_control: { type: 'ephemeral' },
    });
  }

  if (context.specs) {
    blocks.push({
      text: `## Relevant Specs\n\n${context.specs}`,
      cache_control: { type: 'ephemeral' },
    });
  }

  if (agent.memory) {
    blocks.push({ text: `\n${agent.memory}` });
  }

  // --- DYNAMIC: Task-specific content (never cached) ---
  blocks.push({ text: `## Task\n\n${task}` });

  // Output schema for structured responses
  if (context.outputSchema) {
    blocks.push({
      text: `## Output Schema\n\nReturn your response as JSON conforming to this schema:\n\n\`\`\`json\n${
        typeof context.outputSchema === 'string'
          ? context.outputSchema
          : JSON.stringify(context.outputSchema, null, 2)
      }\`\`\``,
    });
  }

  blocks.push({
    text: `## Output Format\n\nReturn concrete artifacts (files, JSON, structured data) — not prose. Mark any learnings for graduation with [DECISION], [ERROR], or [DISCOVERY] tags.`,
  });

  if (format === 'messages') {
    return blocks;
  }

  // String format: join all blocks, ignore cache_control
  return blocks.map(b => b.text).filter(Boolean).join('\n\n');
}

/**
 * Load a JSON schema for structured output validation.
 * @param {string} schemaName  e.g. 'security-review', 'requirements'
 * @returns {object|null} Parsed JSON schema, or null if not found
 */
export function loadSchema(schemaName) {
  const schemaFile = path.join(SCHEMAS_DIR, `${sanitizeId(schemaName)}.schema.json`);
  if (!fs.existsSync(schemaFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(schemaFile, 'utf-8'));
  } catch {
    return null;
  }
}

// CLI interface — guarded so it only runs when invoked directly
const _cliArg = process.argv[1] || '';
const _moduleUrl = fileURLToPath(import.meta.url);
if (_cliArg.replace(/\\/g, '/') === _moduleUrl.replace(/\\/g, '/')) {
  const [, , command, ...args] = process.argv;
  if (command === 'load') {
    const agent = loadAgent(args[0], {});
    console.log(
      JSON.stringify({
        promptLength: agent.prompt.length,
        hasMemory: !!agent.memory,
        hasToolkit: !!agent.toolkitIndex,
        config: agent.config,
      })
    );
  } else if (command === 'team') {
    const agents = getTeamAgents(args[0]);
    console.log(JSON.stringify(agents));
  } else if (command === 'prompt') {
    const format = args.includes('--messages') ? 'messages' : 'string';
    const prompt = buildPrompt(args[0], args[1] || 'No task specified', {}, {}, { format });
    if (format === 'messages') {
      console.log(JSON.stringify(prompt, null, 2));
    } else {
      process.stdout.write(prompt);
    }
  } else if (command === 'schema') {
    const schema = loadSchema(args[0]);
    if (schema) {
      console.log(JSON.stringify(schema, null, 2));
    } else {
      console.error(`Schema not found: ${args[0]}`);
      process.exit(1);
    }
  }
}
