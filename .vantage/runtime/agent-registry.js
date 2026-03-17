import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadMemory } from './memory-manager.js';
import { loadIndex } from './toolkit-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(__dirname, '..', '..', 'agents');
const PRESETS_FILE = path.resolve(__dirname, '..', '..', 'Arch standard', 'team-presets.md');

const MAIN_AGENTS = ['00', '08', '24'];
const CORE_TEAM = ['00', '08', '24', '27', '28'];

/** Sanitize ID to prevent path traversal */
function sanitizeId(id) {
  return path.basename(id).replace(/[^a-zA-Z0-9._-]/g, '');
}

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
  const toolkitIndex = loadIndex(agentId);
  const numericId = agentId.split('-')[0];
  const isMainAgent = MAIN_AGENTS.includes(numericId);

  return { prompt, memory, toolkitIndex, config: { memoryBudget, isMainAgent } };
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
 * @param {string} agentId
 * @param {string} task
 * @param {object} context  Optional: { projectStack, specs }
 * @param {object} projectConfig  Optional: { memory: { injection_budget } }
 * @returns {string}
 */
export function buildPrompt(agentId, task, context = {}, projectConfig = {}) {
  const agent = loadAgent(agentId, projectConfig);

  const sections = [
    `## Task\n\n${task}`,
    agent.prompt ? `## Agent Definition\n\n${agent.prompt}` : '',
    agent.memory ? `\n${agent.memory}` : '',
    agent.toolkitIndex
      ? `## Available Tools\n\n\`\`\`yaml\n${agent.toolkitIndex}\`\`\`\n\nTo use a tool, describe which tool you want and why. The orchestrator will load its full definition.`
      : '',
    context.projectStack
      ? `## Project Stack\n\n${Array.isArray(context.projectStack) ? context.projectStack.join(', ') : context.projectStack}`
      : '',
    context.specs ? `## Relevant Specs\n\n${context.specs}` : '',
    `## Output Format\n\nReturn concrete artifacts (files, JSON, structured data) — not prose. Mark any learnings for graduation with [DECISION], [ERROR], or [DISCOVERY] tags.`,
  ].filter(Boolean);

  return sections.join('\n\n');
}

// CLI interface — guarded so it only runs when invoked directly
const _argv1 = process.argv[1] || '';
const _metaUrl = fileURLToPath(import.meta.url);
const isMain = _argv1.replace(/\\/g, '/') === _metaUrl.replace(/\\/g, '/');

if (isMain) {
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
    const prompt = buildPrompt(args[0], args[1] || 'No task specified', {}, {});
    process.stdout.write(prompt);
  }
}
