import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeId, getDirname } from './utils.js';
import yaml from 'js-yaml';

const __dirname = getDirname(import.meta.url);
const CONFIG_FILE = path.resolve(__dirname, '..', 'config.yml');


/**
 * Default tier assignments.
 *
 * - Tier 1 (heavy): Architecture Board, Enterprise Architect, Security Architect, Threat Intelligence
 * - Tier 2 (standard): most agents
 * - Tier 3 (light): Infrastructure, Adapters, UI Builder, Test Impl, Observability, Docs, etc.
 */
export const DEFAULT_TIERS = {
  heavy: ['01', '04', '08', '11'],
  standard: ['02', '03', '05', '06', '09', '10', '12', '13', '15', '17', '19', '20', '24', '25', '26', '27'],
  light: ['07', '14', '16', '18', '22', '23', '28', '29', '30', '31', '32', '33'],
  model_map: {
    heavy: 'opus',
    standard: 'sonnet',
    light: 'haiku',
  },
};

/**
 * Load tier config from project config, falling back to defaults.
 * @param {object} projectConfig
 * @returns {{ heavy: string[], standard: string[], light: string[], model_map: object }}
 */
function loadTierConfig(projectConfig) {
  // Check inline projectConfig.tiers first
  if (projectConfig?.tiers) {
    return {
      heavy: (projectConfig.tiers.heavy || DEFAULT_TIERS.heavy).map(String).map(id => id.padStart(2, '0')),
      standard: (projectConfig.tiers.standard || DEFAULT_TIERS.standard).map(String).map(id => id.padStart(2, '0')),
      light: (projectConfig.tiers.light || DEFAULT_TIERS.light).map(String).map(id => id.padStart(2, '0')),
      model_map: { ...DEFAULT_TIERS.model_map, ...(projectConfig.tiers.model_map || {}) },
    };
  }

  // Try reading from config.yml
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = yaml.load(raw);
      if (parsed?.tiers) {
        return {
          heavy: (parsed.tiers.heavy || DEFAULT_TIERS.heavy).map(String).map(id => id.padStart(2, '0')),
          standard: (parsed.tiers.standard || DEFAULT_TIERS.standard).map(String).map(id => id.padStart(2, '0')),
          light: (parsed.tiers.light || DEFAULT_TIERS.light).map(String).map(id => id.padStart(2, '0')),
          model_map: { ...DEFAULT_TIERS.model_map, ...(parsed.tiers.model_map || {}) },
        };
      }
    } catch {
      // Fall through to defaults
    }
  }

  return { ...DEFAULT_TIERS };
}

/**
 * Normalize an agent ID to its two-digit numeric prefix.
 * e.g. '08-security-architect' -> '08', '8' -> '08'
 */
function normalizeAgentId(agentId) {
  const cleaned = sanitizeId(agentId);
  const numeric = cleaned.split('-')[0];
  return numeric.padStart(2, '0');
}

/**
 * Get the tier number (1, 2, or 3) for an agent.
 *
 * @param {string} agentId  e.g. '08', '08-security-architect'
 * @param {object} projectConfig  Optional project config with tiers overrides
 * @returns {number} 1 (heavy), 2 (standard), or 3 (light)
 */
export function getTierForAgent(agentId, projectConfig = {}) {
  const id = normalizeAgentId(agentId);
  const config = loadTierConfig(projectConfig);

  if (config.heavy.includes(id)) return 1;
  if (config.light.includes(id)) return 3;
  // Default: standard (tier 2) — covers both explicit standard agents and unknown agents
  return 2;
}

/**
 * Get the model string for an agent based on its tier.
 *
 * @param {string} agentId  e.g. '08', '08-security-architect'
 * @param {object} projectConfig  Optional project config with tiers overrides
 * @returns {string} e.g. 'opus', 'sonnet', 'haiku'
 */
export function getModelForAgent(agentId, projectConfig = {}) {
  const tier = getTierForAgent(agentId, projectConfig);
  const config = loadTierConfig(projectConfig);
  const tierName = tier === 1 ? 'heavy' : tier === 3 ? 'light' : 'standard';
  return config.model_map[tierName] || DEFAULT_TIERS.model_map[tierName];
}

// CLI interface — guarded so it only runs when invoked directly
const _argv1 = process.argv[1] || '';
const _metaUrl = fileURLToPath(import.meta.url);
const isMain = _argv1.replace(/\\/g, '/') === _metaUrl.replace(/\\/g, '/');

if (isMain) {
  const [, , command, ...args] = process.argv;
  if (command === 'resolve') {
    const agentId = args[0];
    if (!agentId) {
      console.error('Usage: node agent-tiers.js resolve <agentId>');
      process.exit(1);
    }
    const tier = getTierForAgent(agentId);
    const model = getModelForAgent(agentId);
    console.log(JSON.stringify({ agentId, tier, model }));
  } else if (command === 'list') {
    const config = loadTierConfig({});
    console.log(JSON.stringify(config, null, 2));
  } else {
    console.error('Commands: resolve <agentId>, list');
  }
}
