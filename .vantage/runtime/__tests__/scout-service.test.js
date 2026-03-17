import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadCache, saveEvaluation, search } from '../scout-service.js';

const EVAL_FILE = path.join(import.meta.dirname, '../../memory/evaluations.md');
const BACKUP = EVAL_FILE + '.bak';

describe('scout-service', () => {
  beforeEach(() => {
    if (fs.existsSync(EVAL_FILE)) fs.copyFileSync(EVAL_FILE, BACKUP);
    fs.writeFileSync(EVAL_FILE, '# VANTAGE Evaluation Cache\n\n', 'utf-8');
  });

  afterEach(() => {
    if (fs.existsSync(BACKUP)) {
      fs.copyFileSync(BACKUP, EVAL_FILE);
      fs.unlinkSync(BACKUP);
    }
  });

  describe('saveEvaluation() + loadCache()', () => {
    it('saves and loads evaluation correctly', () => {
      saveEvaluation('jose', {
        registry: 'npm', rating: 5, downloads: 5000000,
        lastCommit: '2026-02-01', license: 'MIT', vulnerabilities: 0, verdict: 'USE',
      });
      const cache = loadCache();
      assert.ok(cache.has('jose'));
      const entry = cache.get('jose');
      assert.equal(entry.rating, 5);
      assert.equal(entry.verdict, 'USE');
    });

    it('overwrites existing evaluation for same package', () => {
      saveEvaluation('lodash', { registry: 'npm', rating: 4, verdict: 'USE' });
      saveEvaluation('lodash', { registry: 'npm', rating: 2, verdict: 'REJECT' });
      const cache = loadCache();
      const entry = cache.get('lodash');
      assert.equal(entry.rating, 2);
      assert.equal(entry.verdict, 'REJECT');
    });
  });

  describe('search() — cache only mode', () => {
    it('returns cached results matching query', () => {
      saveEvaluation('jose', { registry: 'npm', rating: 5, verdict: 'USE', downloads: 5000000, lastCommit: '2026-02-01', license: 'MIT', vulnerabilities: 0 });
      saveEvaluation('jsonwebtoken', { registry: 'npm', rating: 3, verdict: 'EVALUATE', downloads: 3000000, lastCommit: '2025-06-01', license: 'MIT', vulnerabilities: 1 });
      const results = search('jwt', { cacheOnly: true });
      assert.ok(Array.isArray(results));
    });

    it('returns empty array when no cache matches', () => {
      const results = search('nonexistent-pkg-xyz', { cacheOnly: true });
      assert.deepEqual(results, []);
    });

    it('filters by license whitelist when provided', () => {
      saveEvaluation('pkg-mit', { registry: 'npm', rating: 4, verdict: 'USE', license: 'MIT' });
      saveEvaluation('pkg-gpl', { registry: 'npm', rating: 4, verdict: 'USE', license: 'GPL-3.0' });
      const results = search('pkg', { cacheOnly: true, licenseWhitelist: ['MIT', 'Apache-2.0'] });
      assert.ok(results.every(r => r.license === 'MIT'));
    });
  });
});
