import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { sanitizeId } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOOLKITS_DIR = path.join(__dirname, '..', 'toolkits');
export const TOOLS_DIR = path.join(TOOLKITS_DIR, 'tools');
const GENERAL_INDEX = path.join(TOOLKITS_DIR, 'general.index.yml');

export function loadIndex(agentId) {
  const filePath = path.join(TOOLKITS_DIR, `${sanitizeId(agentId)}.index.yml`);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

export function loadGeneralIndex() {
  if (!fs.existsSync(GENERAL_INDEX)) return '';
  return fs.readFileSync(GENERAL_INDEX, 'utf-8');
}

export function loadTool(toolId) {
  const filePath = path.join(TOOLS_DIR, `${sanitizeId(toolId)}.tool.yml`);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Parse tools array from a YAML index string.
 * @param {string} indexContent  Raw YAML content
 * @returns {Array<{id: string, description: string, source?: string}>}
 */
function parseTools(indexContent) {
  if (!indexContent) return [];
  const parsed = yaml.load(indexContent);
  if (!parsed || !parsed.tools) return [];
  return parsed.tools.map(t => ({
    id: t.id,
    description: t.description,
    ...(t.source ? { source: t.source } : {}),
  }));
}

/**
 * List tools for an agent (specialized only, no merge).
 * @param {string} agentId
 * @returns {Array<{id: string, description: string}>}
 */
export function listTools(agentId) {
  return parseTools(loadIndex(agentId));
}

/**
 * List tools from the general toolkit.
 * @returns {Array<{id: string, description: string}>}
 */
export function listGeneralTools() {
  return parseTools(loadGeneralIndex());
}

/**
 * List merged tools: general + specialized, with specialized taking precedence on ID collision.
 * Returns a structured object with both sections for clear prompt injection.
 * @param {string} agentId
 * @returns {{ general: Array, specialized: Array }}
 */
export function listMergedTools(agentId) {
  const general = listGeneralTools();
  const specialized = listTools(agentId);
  const specializedIds = new Set(specialized.map(t => t.id));
  const filteredGeneral = general.filter(t => !specializedIds.has(t.id));
  return { general: filteredGeneral, specialized };
}

/**
 * Build a merged YAML index string combining general and specialized toolkits.
 * Specialized tools override general tools with the same ID.
 * @param {string} agentId
 * @returns {string} Combined YAML index
 */
export function loadMergedIndex(agentId) {
  const { general, specialized } = listMergedTools(agentId);
  if (general.length === 0 && specialized.length === 0) return '';

  const lines = [];
  lines.push(`agent: "${sanitizeId(agentId)}"`);

  if (general.length > 0) {
    lines.push('general_tools:');
    for (const t of general) {
      lines.push(`  - id: ${t.id}`);
      lines.push(`    description: "${t.description}"`);
      if (t.source) lines.push(`    source: "${t.source}"`);
    }
  }

  if (specialized.length > 0) {
    lines.push('specialized_tools:');
    for (const t of specialized) {
      lines.push(`  - id: ${t.id}`);
      lines.push(`    description: "${t.description}"`);
      if (t.source) lines.push(`    source: "${t.source}"`);
    }
  }

  return lines.join('\n') + '\n';
}

// CLI interface — guarded
const _cliArg = process.argv[1] || '';
const _moduleUrl = fileURLToPath(import.meta.url);
if (_cliArg.replace(/\\/g, '/') === _moduleUrl.replace(/\\/g, '/')) {
  const [,, command, id] = process.argv;
  if (command === 'index') {
    process.stdout.write(loadIndex(id));
  } else if (command === 'merged') {
    process.stdout.write(loadMergedIndex(id));
  } else if (command === 'general') {
    console.log(JSON.stringify(listGeneralTools(), null, 2));
  } else if (command === 'load') {
    process.stdout.write(loadTool(id));
  } else if (command === 'list') {
    console.log(JSON.stringify(listTools(id), null, 2));
  } else if (command === 'list-merged') {
    console.log(JSON.stringify(listMergedTools(id), null, 2));
  }
}
