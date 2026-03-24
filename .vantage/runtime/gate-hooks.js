import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

import { getDirname } from './utils.js';
const __dirname = getDirname(import.meta.url);
const VANTAGE_ROOT = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(VANTAGE_ROOT, 'config.yml');
const HOOKS_DIR = path.join(VANTAGE_ROOT, 'hooks');
const GATE_LOGS_DIR = path.join(VANTAGE_ROOT, 'memory', 'gate-logs');

const VALID_GATES = ['G-1', 'G0', 'G1', 'G2', 'G3', 'G4', 'G5'];

const DEFAULT_HOOKS = {
  'G0': {
    pre: ['validate-spec-completeness'],
    post: ['log-gate-result']
  },
  'G1': {
    pre: ['validate-arch-specs-consistency'],
    post: ['log-gate-result']
  },
  'G2': {
    pre: ['validate-stride-checklist', 'validate-controls-matrix'],
    post: ['log-gate-result']
  },
  'G3': {
    pre: ['validate-spec-contracts'],
    post: ['log-gate-result', 'update-sprint-status']
  },
  'G4': {
    pre: ['validate-coverage', 'validate-sast'],
    post: ['generate-qa-report', 'log-gate-result']
  },
  'G5': {
    pre: ['validate-docs-complete', 'validate-pipeline'],
    post: ['log-gate-result']
  }
};

/**
 * Return default hook definitions for all gates.
 * @returns {Record<string, {pre: string[], post: string[]}>}
 */
export function getDefaultHooks() {
  return JSON.parse(JSON.stringify(DEFAULT_HOOKS));
}

// ---------------------------------------------------------------------------
// Built-in hook implementations
// ---------------------------------------------------------------------------

const SPEC_TYPES = [
  'openapi.yaml',
  'openapi.yml',
  'db-schema.sql',
  'domain-model.md',
  'wireframes.md',
  'nfr.md',
  'security-controls.md',
  'test-strategy.md',
  'adr-001',
  'data-flow.md'
];

function resolveProjectRoot(config) {
  if (config?.project?.root) return path.resolve(config.project.root);
  return process.cwd();
}

const BUILTIN_HOOKS = {
  'validate-spec-completeness': (config) => {
    const root = resolveProjectRoot(config);
    const specsDir = path.join(root, 'specs');
    if (!fs.existsSync(specsDir)) return { ok: false, msg: `specs/ directory not found at ${specsDir}` };
    const files = fs.readdirSync(specsDir);
    const found = SPEC_TYPES.filter(t => files.some(f => f.includes(t.replace('.', ''))));
    if (found.length < 8) {
      const present = files.join(', ');
      return { ok: false, msg: `Only ${found.length}/8 spec types found in specs/. Files: ${present}` };
    }
    return { ok: true, msg: `${found.length} spec types present` };
  },

  'validate-arch-specs-consistency': (config) => {
    const root = resolveProjectRoot(config);
    const adrDir = path.join(root, 'specs');
    if (!fs.existsSync(adrDir)) return { ok: false, msg: 'specs/ directory not found' };
    const files = fs.readdirSync(adrDir);
    const hasArch = files.some(f => f.includes('domain-model') || f.includes('adr'));
    if (!hasArch) return { ok: false, msg: 'No architecture documents (domain-model or ADR) found in specs/' };
    return { ok: true, msg: 'Architecture specs present' };
  },

  'validate-stride-checklist': (config) => {
    const root = resolveProjectRoot(config);
    const secFile = path.join(root, 'specs', 'security-controls.md');
    if (!fs.existsSync(secFile)) return { ok: false, msg: 'security-controls.md not found in specs/' };
    const content = fs.readFileSync(secFile, 'utf-8');
    const hasStride = /stride/i.test(content);
    if (!hasStride) return { ok: false, msg: 'STRIDE analysis not found in security-controls.md' };
    return { ok: true, msg: 'STRIDE checklist present' };
  },

  'validate-controls-matrix': (config) => {
    const root = resolveProjectRoot(config);
    const secFile = path.join(root, 'specs', 'security-controls.md');
    if (!fs.existsSync(secFile)) return { ok: false, msg: 'security-controls.md not found in specs/' };
    return { ok: true, msg: 'Controls matrix file present' };
  },

  'validate-spec-contracts': (config) => {
    const root = resolveProjectRoot(config);
    const specsDir = path.join(root, 'specs');
    if (!fs.existsSync(specsDir)) return { ok: false, msg: 'specs/ directory not found' };
    const files = fs.readdirSync(specsDir);
    const hasApi = files.some(f => f.includes('openapi'));
    if (!hasApi) return { ok: false, msg: 'OpenAPI spec not found in specs/' };
    return { ok: true, msg: 'API contracts present' };
  },

  'validate-coverage': (config) => {
    const root = resolveProjectRoot(config);
    const coveragePath = config?.gates?.coverage_report
      || path.join(root, 'coverage', 'coverage-summary.json');
    if (!fs.existsSync(coveragePath)) return { ok: false, msg: `Coverage report not found at ${coveragePath}` };
    return { ok: true, msg: 'Coverage report present' };
  },

  'validate-sast': (config) => {
    const root = resolveProjectRoot(config);
    const candidates = [
      path.join(root, '.sast-report.json'),
      path.join(root, 'sast-report.json'),
      path.join(root, 'reports', 'sast.json')
    ];
    const found = candidates.find(c => fs.existsSync(c));
    if (!found) return { ok: false, msg: 'SAST report not found (checked .sast-report.json, sast-report.json, reports/sast.json)' };
    return { ok: true, msg: `SAST report found: ${path.basename(found)}` };
  },

  'validate-docs-complete': (config) => {
    const root = resolveProjectRoot(config);
    const missing = [];
    if (!fs.existsSync(path.join(root, 'README.md'))) missing.push('README.md');
    const hasApiDocs = fs.existsSync(path.join(root, 'docs'))
      || fs.existsSync(path.join(root, 'specs', 'openapi.yaml'))
      || fs.existsSync(path.join(root, 'specs', 'openapi.yml'));
    if (!hasApiDocs) missing.push('API docs (docs/ or openapi spec)');
    if (missing.length > 0) return { ok: false, msg: `Missing: ${missing.join(', ')}` };
    return { ok: true, msg: 'Documentation complete' };
  },

  'validate-pipeline': (config) => {
    const root = resolveProjectRoot(config);
    const candidates = [
      path.join(root, '.github', 'workflows'),
      path.join(root, '.gitlab-ci.yml'),
      path.join(root, 'Jenkinsfile'),
      path.join(root, '.circleci'),
      path.join(root, 'azure-pipelines.yml')
    ];
    const found = candidates.find(c => fs.existsSync(c));
    if (!found) return { ok: false, msg: 'No CI/CD pipeline config found' };
    return { ok: true, msg: `Pipeline config found: ${path.basename(found)}` };
  },

  'log-gate-result': (_config, _context) => {
    // Logging is handled by the runner; this is a no-op placeholder
    return { ok: true, msg: 'Gate result logged' };
  },

  'update-sprint-status': (_config) => {
    return { ok: true, msg: 'Sprint status update noted' };
  },

  'generate-qa-report': (_config) => {
    return { ok: true, msg: 'QA report generation noted' };
  }
};

// ---------------------------------------------------------------------------
// Config loading & validation
// ---------------------------------------------------------------------------

function loadGateConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
  const cfg = yaml.load(raw) || {};
  return cfg;
}

/**
 * Validate that a hooks configuration is well-formed.
 * @param {object} config - full config object (or just the gates section)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateGateConfig(config) {
  const errors = [];
  const gates = config?.gates?.hooks || config?.hooks || {};

  for (const [gate, hooks] of Object.entries(gates)) {
    if (!VALID_GATES.includes(gate)) {
      errors.push(`Unknown gate "${gate}". Valid gates: ${VALID_GATES.join(', ')}`);
    }
    if (typeof hooks !== 'object' || hooks === null) {
      errors.push(`Gate "${gate}" hooks must be an object with pre/post arrays`);
      continue;
    }
    for (const phase of ['pre', 'post']) {
      if (hooks[phase] !== undefined) {
        if (!Array.isArray(hooks[phase])) {
          errors.push(`Gate "${gate}" ${phase} hooks must be an array`);
        } else {
          for (const h of hooks[phase]) {
            if (typeof h !== 'string' || h.trim() === '') {
              errors.push(`Gate "${gate}" ${phase} contains invalid hook (must be non-empty string)`);
            }
          }
        }
      }
    }
  }

  if (config?.gates?.timeout_ms !== undefined) {
    const t = config.gates.timeout_ms;
    if (typeof t !== 'number' || t <= 0) {
      errors.push('gates.timeout_ms must be a positive number');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Hook execution
// ---------------------------------------------------------------------------

function mergeHooks(gate, config) {
  const defaults = DEFAULT_HOOKS[gate] || { pre: [], post: [] };
  const overrides = config?.gates?.hooks?.[gate];
  if (!overrides) return defaults;
  return {
    pre: overrides.pre || defaults.pre,
    post: overrides.post || defaults.post
  };
}

async function executeHook(hookName, config, context = {}) {
  const timeout = config?.gates?.timeout_ms || 30000;
  const start = Date.now();

  // 1. Check built-in hooks first
  if (BUILTIN_HOOKS[hookName]) {
    try {
      const result = BUILTIN_HOOKS[hookName](config, context);
      const duration = Date.now() - start;
      return {
        hook: hookName,
        status: result.ok ? 'passed' : 'failed',
        output: result.msg,
        duration_ms: duration
      };
    } catch (err) {
      return {
        hook: hookName,
        status: 'error',
        output: err.message,
        duration_ms: Date.now() - start
      };
    }
  }

  // 2. Check for JS hook file in .vantage/hooks/
  const jsHookFile = path.join(HOOKS_DIR, `${hookName}.js`);
  if (fs.existsSync(jsHookFile)) {
    try {
      const hookUrl = 'file:///' + jsHookFile.replace(/\\/g, '/');
      const mod = await import(hookUrl);
      const fn = mod.default || mod;
      if (typeof fn !== 'function') {
        return {
          hook: hookName,
          status: 'error',
          output: `Hook file ${hookName}.js does not export a function`,
          duration_ms: Date.now() - start
        };
      }
      const result = await fn(config, context);
      const duration = Date.now() - start;
      const ok = result?.ok !== false && result?.status !== 'failed';
      return {
        hook: hookName,
        status: ok ? 'passed' : 'failed',
        output: result?.msg || result?.output || JSON.stringify(result),
        duration_ms: duration
      };
    } catch (err) {
      return {
        hook: hookName,
        status: 'error',
        output: err.message,
        duration_ms: Date.now() - start
      };
    }
  }

  // 3. Treat as shell command
  // NOTE: execSync is used intentionally because hooks are shell commands
  // (e.g. "npm test", "npm run lint") defined in the project's own config.yml,
  // not from untrusted user input.
  try {
    const output = execSync(hookName, {
      timeout,
      cwd: resolveProjectRoot(config),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return {
      hook: hookName,
      status: 'passed',
      output: output.trim().slice(0, 2000),
      duration_ms: Date.now() - start
    };
  } catch (err) {
    return {
      hook: hookName,
      status: 'failed',
      output: (err.stderr || err.message || '').trim().slice(0, 2000),
      duration_ms: Date.now() - start
    };
  }
}

// ---------------------------------------------------------------------------
// Gate log
// ---------------------------------------------------------------------------

function appendGateLog(gate, phase, results) {
  fs.mkdirSync(GATE_LOGS_DIR, { recursive: true });
  const logFile = path.join(GATE_LOGS_DIR, 'gates.md');
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toISOString().split('T')[1].split('.')[0];

  const passedCount = results.filter(r => r.status === 'passed').length;
  const total = results.length;
  const overallStatus = results.every(r => r.status === 'passed') ? 'PASSED' : 'FAILED';

  let entry = `\n### ${date} ${time} — Gate ${gate} (${phase})\n`;
  entry += `- Status: ${overallStatus}\n`;
  entry += `- ${phase === 'pre' ? 'Pre' : 'Post'}-hooks: ${passedCount}/${total} ${phase === 'pre' ? 'passed' : 'completed'}\n`;
  for (const r of results) {
    const icon = r.status === 'passed' ? 'OK' : 'FAIL';
    entry += `  - ${r.hook}: ${icon} (${r.duration_ms}ms)${r.status !== 'passed' ? ' — ' + r.output : ''}\n`;
  }

  fs.appendFileSync(logFile, entry, 'utf-8');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run all pre-hooks for a gate. ALL must pass for gate to proceed.
 * @param {string} gate - Gate identifier (G-1, G0..G5)
 * @param {object} [config] - Config object (loaded from config.yml if omitted)
 * @returns {Promise<{passed: boolean, results: Array, failedHooks: string[]}>}
 */
export async function runPreHooks(gate, config) {
  if (!VALID_GATES.includes(gate)) {
    return { passed: false, results: [], failedHooks: [`Invalid gate: ${gate}`] };
  }
  config = config || loadGateConfig();
  const hooks = mergeHooks(gate, config);
  const results = [];

  for (const hookName of hooks.pre) {
    const result = await executeHook(hookName, config, { gate, phase: 'pre' });
    results.push(result);
  }

  const failedHooks = results.filter(r => r.status !== 'passed').map(r => r.hook);
  const passed = failedHooks.length === 0;

  appendGateLog(gate, 'pre', results);

  return { passed, results, failedHooks };
}

/**
 * Run all post-hooks for a gate. Best effort — failures don't block.
 * @param {string} gate - Gate identifier
 * @param {object} [config] - Config object
 * @returns {Promise<{results: Array}>}
 */
export async function runPostHooks(gate, config) {
  if (!VALID_GATES.includes(gate)) {
    return { results: [{ hook: 'invalid-gate', status: 'error', output: `Invalid gate: ${gate}`, duration_ms: 0 }] };
  }
  config = config || loadGateConfig();
  const hooks = mergeHooks(gate, config);
  const results = [];

  for (const hookName of hooks.post) {
    const result = await executeHook(hookName, config, { gate, phase: 'post' });
    results.push(result);
  }

  appendGateLog(gate, 'post', results);

  return { results };
}

// ---------------------------------------------------------------------------
// CLI guard
// ---------------------------------------------------------------------------

const _argv1 = process.argv[1] || '';
const _metaUrl = fileURLToPath(import.meta.url);
if (_argv1.replace(/\\/g, '/') === _metaUrl.replace(/\\/g, '/')) {
  const cmd = process.argv[2];
  const gate = process.argv[3];

  if (cmd === 'defaults') {
    console.log(JSON.stringify(getDefaultHooks(), null, 2));
    process.exit(0);
  }

  if (cmd === 'validate') {
    const config = loadGateConfig();
    const result = validateGateConfig(config);
    if (result.valid) {
      console.log('Gate config is valid.');
    } else {
      console.error('Gate config errors:');
      result.errors.forEach(e => console.error(`  - ${e}`));
    }
    process.exit(result.valid ? 0 : 1);
  }

  if (cmd === 'run-pre') {
    if (!gate) { console.error('Usage: gate-hooks.js run-pre <gate>'); process.exit(1); }
    const config = loadGateConfig();
    runPreHooks(gate, config).then(result => {
      console.log(`Gate ${gate} pre-hooks: ${result.passed ? 'PASSED' : 'FAILED'}`);
      for (const r of result.results) {
        const icon = r.status === 'passed' ? '[OK]' : '[FAIL]';
        console.log(`  ${icon} ${r.hook} (${r.duration_ms}ms)${r.status !== 'passed' ? ' — ' + r.output : ''}`);
      }
      process.exit(result.passed ? 0 : 1);
    });
  } else if (cmd === 'run-post') {
    if (!gate) { console.error('Usage: gate-hooks.js run-post <gate>'); process.exit(1); }
    const config = loadGateConfig();
    runPostHooks(gate, config).then(result => {
      console.log(`Gate ${gate} post-hooks completed:`);
      for (const r of result.results) {
        const icon = r.status === 'passed' ? '[OK]' : '[FAIL]';
        console.log(`  ${icon} ${r.hook} (${r.duration_ms}ms)`);
      }
      process.exit(0);
    });
  } else {
    console.log('Usage:');
    console.log('  node gate-hooks.js run-pre <gate>    Run pre-hooks for a gate');
    console.log('  node gate-hooks.js run-post <gate>   Run post-hooks for a gate');
    console.log('  node gate-hooks.js validate           Validate gate config');
    console.log('  node gate-hooks.js defaults            Show default hook definitions');
    console.log(`\nValid gates: ${VALID_GATES.join(', ')}`);
    process.exit(0);
  }
}
