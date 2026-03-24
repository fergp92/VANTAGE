import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getDefaultHooks,
  validateGateConfig,
  runPreHooks,
  runPostHooks
} from '../gate-hooks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VANTAGE_ROOT = path.resolve(__dirname, '..', '..');
const GATE_LOGS_DIR = path.join(VANTAGE_ROOT, 'memory', 'gate-logs');
const GATE_LOG_FILE = path.join(GATE_LOGS_DIR, 'gates.md');

// Helper: create a temp project dir with specs
function makeTempProject(files = {}) {
  const tmpDir = path.join(__dirname, '_tmp_gate_test_' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const [relPath, content] of Object.entries(files)) {
    const full = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  return tmpDir;
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

// Store original log content to restore after tests
let originalLogContent = null;

beforeEach(() => {
  if (fs.existsSync(GATE_LOG_FILE)) {
    originalLogContent = fs.readFileSync(GATE_LOG_FILE, 'utf-8');
  } else {
    originalLogContent = null;
  }
});

afterEach(() => {
  // Restore gate log to pre-test state
  if (originalLogContent !== null) {
    fs.writeFileSync(GATE_LOG_FILE, originalLogContent, 'utf-8');
  } else if (fs.existsSync(GATE_LOG_FILE)) {
    fs.unlinkSync(GATE_LOG_FILE);
  }
});

describe('gate-hooks', () => {

  describe('getDefaultHooks()', () => {
    it('returns hooks for all implementation gates G0-G5', () => {
      const hooks = getDefaultHooks();
      assert.ok(hooks['G0'], 'G0 hooks missing');
      assert.ok(hooks['G1'], 'G1 hooks missing');
      assert.ok(hooks['G2'], 'G2 hooks missing');
      assert.ok(hooks['G3'], 'G3 hooks missing');
      assert.ok(hooks['G4'], 'G4 hooks missing');
      assert.ok(hooks['G5'], 'G5 hooks missing');
    });

    it('each gate has pre and post arrays', () => {
      const hooks = getDefaultHooks();
      for (const [gate, def] of Object.entries(hooks)) {
        assert.ok(Array.isArray(def.pre), `${gate}.pre should be an array`);
        assert.ok(Array.isArray(def.post), `${gate}.post should be an array`);
      }
    });

    it('returns a deep copy (mutations do not affect defaults)', () => {
      const a = getDefaultHooks();
      a['G0'].pre.push('injected');
      const b = getDefaultHooks();
      assert.ok(!b['G0'].pre.includes('injected'));
    });
  });

  describe('validateGateConfig()', () => {
    it('accepts a valid config', () => {
      const result = validateGateConfig({
        gates: {
          timeout_ms: 30000,
          hooks: {
            G0: { pre: ['validate-spec-completeness'], post: ['log-gate-result'] }
          }
        }
      });
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it('rejects unknown gate identifiers', () => {
      const result = validateGateConfig({
        gates: { hooks: { G99: { pre: ['something'] } } }
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('G99')));
    });

    it('rejects non-array pre hooks', () => {
      const result = validateGateConfig({
        gates: { hooks: { G0: { pre: 'not-an-array' } } }
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('array')));
    });

    it('rejects empty string hooks', () => {
      const result = validateGateConfig({
        gates: { hooks: { G0: { pre: ['valid', ''] } } }
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('non-empty')));
    });

    it('rejects non-numeric timeout', () => {
      const result = validateGateConfig({
        gates: { timeout_ms: 'fast' }
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('timeout_ms')));
    });

    it('rejects negative timeout', () => {
      const result = validateGateConfig({
        gates: { timeout_ms: -1 }
      });
      assert.equal(result.valid, false);
    });

    it('accepts config with no gates section (empty)', () => {
      const result = validateGateConfig({});
      assert.equal(result.valid, true);
    });
  });

  describe('runPreHooks()', () => {
    it('returns passed=false for invalid gate', async () => {
      const result = await runPreHooks('G99', {});
      assert.equal(result.passed, false);
      assert.ok(result.failedHooks.length > 0);
    });

    it('built-in validator fails when specs/ does not exist', async () => {
      const tmpDir = makeTempProject({});
      try {
        const config = { project: { root: tmpDir }, gates: { hooks: { G0: { pre: ['validate-spec-completeness'] } } } };
        const result = await runPreHooks('G0', config);
        assert.equal(result.passed, false);
        assert.ok(result.failedHooks.includes('validate-spec-completeness'));
        assert.ok(result.results[0].output.includes('specs/'));
      } finally {
        rmrf(tmpDir);
      }
    });

    it('pre-hook failure blocks gate (passed=false)', async () => {
      const tmpDir = makeTempProject({});
      try {
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G3: { pre: ['validate-spec-contracts'] } } }
        };
        const result = await runPreHooks('G3', config);
        assert.equal(result.passed, false);
        assert.equal(result.failedHooks.length, 1);
      } finally {
        rmrf(tmpDir);
      }
    });

    it('all pre-hooks pass when specs exist', async () => {
      const tmpDir = makeTempProject({
        'specs/openapi.yaml': 'openapi: 3.0.0',
      });
      try {
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G3: { pre: ['validate-spec-contracts'] } } }
        };
        const result = await runPreHooks('G3', config);
        assert.equal(result.passed, true);
        assert.equal(result.failedHooks.length, 0);
      } finally {
        rmrf(tmpDir);
      }
    });

    it('results include hook name, status, output, duration_ms', async () => {
      const tmpDir = makeTempProject({});
      try {
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G0: { pre: ['validate-spec-completeness'] } } }
        };
        const result = await runPreHooks('G0', config);
        const r = result.results[0];
        assert.equal(r.hook, 'validate-spec-completeness');
        assert.ok(['passed', 'failed', 'error'].includes(r.status));
        assert.equal(typeof r.output, 'string');
        assert.equal(typeof r.duration_ms, 'number');
      } finally {
        rmrf(tmpDir);
      }
    });
  });

  describe('runPostHooks()', () => {
    it('post-hook failures do not block (no passed field)', async () => {
      const tmpDir = makeTempProject({});
      try {
        // log-gate-result is a built-in that always passes
        // but even if we had a failing one, post hooks don't block
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G3: { post: ['log-gate-result'] } } }
        };
        const result = await runPostHooks('G3', config);
        // runPostHooks returns {results}, no 'passed' field
        assert.ok(Array.isArray(result.results));
        assert.ok(!('passed' in result), 'post hooks should not have a passed field');
      } finally {
        rmrf(tmpDir);
      }
    });

    it('returns error for invalid gate', async () => {
      const result = await runPostHooks('G99', {});
      assert.ok(result.results.length > 0);
      assert.equal(result.results[0].status, 'error');
    });
  });

  describe('built-in validators', () => {
    it('validate-docs-complete fails without README', async () => {
      const tmpDir = makeTempProject({});
      try {
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G5: { pre: ['validate-docs-complete'] } } }
        };
        const result = await runPreHooks('G5', config);
        assert.equal(result.passed, false);
        assert.ok(result.results[0].output.includes('README.md'));
      } finally {
        rmrf(tmpDir);
      }
    });

    it('validate-docs-complete passes with README and docs/', async () => {
      const tmpDir = makeTempProject({
        'README.md': '# Project',
        'docs/index.md': 'API documentation'
      });
      try {
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G5: { pre: ['validate-docs-complete'] } } }
        };
        const result = await runPreHooks('G5', config);
        assert.equal(result.passed, true);
      } finally {
        rmrf(tmpDir);
      }
    });

    it('validate-pipeline fails without CI config', async () => {
      const tmpDir = makeTempProject({});
      try {
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G5: { pre: ['validate-pipeline'] } } }
        };
        const result = await runPreHooks('G5', config);
        assert.equal(result.passed, false);
        assert.ok(result.results[0].output.includes('CI/CD'));
      } finally {
        rmrf(tmpDir);
      }
    });

    it('validate-pipeline passes with .github/workflows/', async () => {
      const tmpDir = makeTempProject({
        '.github/workflows/ci.yml': 'name: CI'
      });
      try {
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G5: { pre: ['validate-pipeline'] } } }
        };
        const result = await runPreHooks('G5', config);
        assert.equal(result.passed, true);
      } finally {
        rmrf(tmpDir);
      }
    });

    it('validate-stride-checklist fails without STRIDE mention', async () => {
      const tmpDir = makeTempProject({
        'specs/security-controls.md': '# Security Controls\nNo threat model here.'
      });
      try {
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G2: { pre: ['validate-stride-checklist'] } } }
        };
        const result = await runPreHooks('G2', config);
        assert.equal(result.passed, false);
      } finally {
        rmrf(tmpDir);
      }
    });

    it('validate-stride-checklist passes with STRIDE content', async () => {
      const tmpDir = makeTempProject({
        'specs/security-controls.md': '# Security Controls\n## STRIDE Analysis\nSpoofing: ...'
      });
      try {
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G2: { pre: ['validate-stride-checklist'] } } }
        };
        const result = await runPreHooks('G2', config);
        assert.equal(result.passed, true);
      } finally {
        rmrf(tmpDir);
      }
    });
  });

  describe('gate log', () => {
    it('appends log entry after pre-hook run', async () => {
      const tmpDir = makeTempProject({});
      try {
        const config = {
          project: { root: tmpDir },
          gates: { hooks: { G0: { pre: ['validate-spec-completeness'] } } }
        };
        await runPreHooks('G0', config);
        assert.ok(fs.existsSync(GATE_LOG_FILE), 'Gate log file should exist');
        const content = fs.readFileSync(GATE_LOG_FILE, 'utf-8');
        assert.ok(content.includes('Gate G0'), 'Log should reference gate G0');
        assert.ok(content.includes('pre'), 'Log should mention pre phase');
        assert.ok(content.includes('validate-spec-completeness'), 'Log should include hook name');
      } finally {
        rmrf(tmpDir);
      }
    });

    it('appends log entry after post-hook run', async () => {
      const config = {
        gates: { hooks: { G3: { post: ['log-gate-result'] } } }
      };
      await runPostHooks('G3', config);
      assert.ok(fs.existsSync(GATE_LOG_FILE), 'Gate log file should exist');
      const content = fs.readFileSync(GATE_LOG_FILE, 'utf-8');
      assert.ok(content.includes('Gate G3'), 'Log should reference gate G3');
      assert.ok(content.includes('post'), 'Log should mention post phase');
    });
  });
});
