import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { getModelForAgent } from './agent-tiers.js';

import { getDirname } from './utils.js';
const __dirname = getDirname(import.meta.url);
const CONFIG_FILE = path.resolve(__dirname, '..', 'config.yml');

// ---------------------------------------------------------------------------
// Provider definitions
// ---------------------------------------------------------------------------

export const PROVIDERS = {
  anthropic: {
    models: {
      opus: 'claude-opus-4-6',
      sonnet: 'claude-sonnet-4-6',
      haiku: 'claude-haiku-4-5-20251001',
    },
    cost_per_1k_tokens: { opus: 0.075, sonnet: 0.015, haiku: 0.005 },
  },
  openai: {
    models: {
      opus: 'gpt-4o',
      sonnet: 'gpt-4o',
      haiku: 'gpt-4o-mini',
    },
    cost_per_1k_tokens: { opus: 0.025, sonnet: 0.025, haiku: 0.00015 },
  },
  google: {
    models: {
      opus: 'gemini-2.5-pro',
      sonnet: 'gemini-2.5-pro',
      haiku: 'gemini-2.0-flash',
    },
    cost_per_1k_tokens: { opus: 0.020, sonnet: 0.020, haiku: 0.0001 },
  },
  ollama: {
    models: {
      opus: 'llama3:70b',
      sonnet: 'llama3:8b',
      haiku: 'llama3:8b',
    },
    cost_per_1k_tokens: { opus: 0, sonnet: 0, haiku: 0 },
  },
};

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** @type {{ [provider: string]: { [tier: string]: number } }} */
let _usage = {};

/** @type {{ [provider: string]: { errors: number, lastError: Date|null } }} */
let _health = {};

/** Auto-recovery interval in ms */
const HEALTH_RECOVERY_MS = 5 * 60 * 1000; // 5 minutes
const ERROR_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Config loading
// ---------------------------------------------------------------------------

/**
 * Load provider routing config, merging config.yml with optional overrides.
 * @param {object} [overrides]
 */
function loadProviderConfig(overrides = {}) {
  const defaults = {
    providers: {
      primary: 'anthropic',
      fallback: ['openai', 'google'],
      local_dev: 'ollama',
      routing: {
        strategy: 'cost',
        max_retries: 2,
        timeout_ms: 30000,
        health_check_interval_ms: 300000,
      },
    },
  };

  if (overrides?.providers) {
    return {
      providers: { ...defaults.providers, ...overrides.providers },
    };
  }

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = yaml.load(raw);
      if (parsed?.providers) {
        return {
          providers: { ...defaults.providers, ...parsed.providers },
        };
      }
    }
  } catch {
    // Fall through to defaults
  }

  return defaults;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Resolve the full model ID for an agent.
 *
 * @param {string} agentId  e.g. '08', '08-security-architect'
 * @param {object} [projectConfig]  Optional project config overrides
 * @returns {{ provider: string, model: string, tier: string, costPer1k: number }}
 */
export function resolveModel(agentId, projectConfig = {}) {
  const tier = getModelForAgent(agentId, projectConfig); // 'opus' | 'sonnet' | 'haiku'
  const config = loadProviderConfig(projectConfig);
  const providerName = config.providers.primary;
  const providerDef = PROVIDERS[providerName];

  if (!providerDef) {
    throw new Error(`Unknown provider: ${providerName}`);
  }

  return {
    provider: providerName,
    model: providerDef.models[tier],
    tier,
    costPer1k: providerDef.cost_per_1k_tokens[tier],
  };
}

/**
 * Get the next fallback provider after the current one.
 *
 * @param {string} currentProvider
 * @param {object} [config]  Optional config overrides
 * @returns {string|null}  Next provider name or null if exhausted
 */
export function getNextProvider(currentProvider, config = {}) {
  const provConfig = loadProviderConfig(config);
  const { primary, fallback = [] } = provConfig.providers;

  // Build the full chain: primary, then fallbacks in order
  const chain = [primary, ...fallback];
  const currentIdx = chain.indexOf(currentProvider);

  if (currentIdx === -1 || currentIdx >= chain.length - 1) {
    return null;
  }

  return chain[currentIdx + 1];
}

/**
 * Record token usage for cost tracking.
 *
 * @param {string} provider  Provider name
 * @param {string} tier      'opus' | 'sonnet' | 'haiku'
 * @param {number} tokens    Number of tokens consumed
 */
export function trackUsage(provider, tier, tokens) {
  if (!_usage[provider]) {
    _usage[provider] = {};
  }
  if (!_usage[provider][tier]) {
    _usage[provider][tier] = 0;
  }
  _usage[provider][tier] += tokens;
}

/**
 * Get cost breakdown by provider and tier.
 *
 * @returns {{ totalCost: number, byProvider: object, byTier: object }}
 */
export function getCostReport() {
  let totalCost = 0;
  const byProvider = {};
  const byTier = {};

  for (const [providerName, tiers] of Object.entries(_usage)) {
    const providerDef = PROVIDERS[providerName];
    if (!providerDef) continue;

    let providerTokens = 0;
    let providerCost = 0;

    for (const [tier, tokens] of Object.entries(tiers)) {
      const rate = providerDef.cost_per_1k_tokens[tier] || 0;
      const cost = (tokens / 1000) * rate;

      providerTokens += tokens;
      providerCost += cost;

      if (!byTier[tier]) {
        byTier[tier] = { tokens: 0, cost: 0 };
      }
      byTier[tier].tokens += tokens;
      byTier[tier].cost += cost;
    }

    byProvider[providerName] = { tokens: providerTokens, cost: providerCost };
    totalCost += providerCost;
  }

  return { totalCost, byProvider, byTier };
}

/**
 * Reset all usage tracking (for testing).
 */
export function resetUsage() {
  _usage = {};
  _health = {};
}

/**
 * Get health status for all known providers.
 *
 * @param {function} [_now]  Optional clock function for testing (returns Date)
 * @returns {{ [provider: string]: { errors: number, lastError: Date|null, healthy: boolean } }}
 */
export function getHealthStatus(_now) {
  const now = (_now ? _now() : new Date());
  const result = {};

  for (const providerName of Object.keys(PROVIDERS)) {
    const state = _health[providerName] || { errors: 0, lastError: null };
    let healthy = state.errors < ERROR_THRESHOLD;

    // Auto-recover if enough time has passed since last error
    if (!healthy && state.lastError) {
      const elapsed = now.getTime() - state.lastError.getTime();
      if (elapsed >= HEALTH_RECOVERY_MS) {
        healthy = true;
        // Reset state on recovery
        state.errors = 0;
        state.lastError = null;
        _health[providerName] = state;
      }
    }

    result[providerName] = {
      errors: state.errors,
      lastError: state.lastError,
      healthy,
    };
  }

  return result;
}

/**
 * Report an error for a provider.
 * After ERROR_THRESHOLD consecutive errors the provider is marked unhealthy.
 *
 * @param {string} provider
 * @param {function} [_now]  Optional clock for testing
 */
export function reportError(provider, _now) {
  if (!_health[provider]) {
    _health[provider] = { errors: 0, lastError: null };
  }
  _health[provider].errors += 1;
  _health[provider].lastError = _now ? _now() : new Date();
}

// ---------------------------------------------------------------------------
// CLI interface
// ---------------------------------------------------------------------------

const _argv1 = process.argv[1] || '';
const _metaUrl = fileURLToPath(import.meta.url);
const isMain = _argv1.replace(/\\/g, '/') === _metaUrl.replace(/\\/g, '/');

if (isMain) {
  const [, , command, ...args] = process.argv;

  switch (command) {
    case 'resolve': {
      const agentId = args[0];
      if (!agentId) {
        console.error('Usage: node provider-router.js resolve <agentId>');
        process.exit(1);
      }
      const result = resolveModel(agentId);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'providers': {
      for (const [name, def] of Object.entries(PROVIDERS)) {
        console.log(`\n${name}:`);
        for (const [tier, model] of Object.entries(def.models)) {
          const cost = def.cost_per_1k_tokens[tier];
          console.log(`  ${tier}: ${model} ($${cost}/1k tokens)`);
        }
      }
      break;
    }

    case 'cost-report': {
      const report = getCostReport();
      console.log(JSON.stringify(report, null, 2));
      break;
    }

    case 'health': {
      const status = getHealthStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
    }

    default:
      console.error('Commands: resolve <agentId>, providers, cost-report, health');
      break;
  }
}
