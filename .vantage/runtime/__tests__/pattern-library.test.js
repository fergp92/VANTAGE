import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  store,
  search,
  getForAgent,
  captureFromGate,
  list
} from '../pattern-library.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use a temp directory for all tests — never the real patterns dir
let tmpDir;

function makeTmpDir() {
  const dir = path.join(__dirname, '_tmp_pattern_test_' + Date.now());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

beforeEach(() => {
  tmpDir = makeTmpDir();
});

afterEach(() => {
  rmrf(tmpDir);
});

describe('pattern-library', () => {

  describe('store()', () => {

    it('creates a new pattern file with correct frontmatter', () => {
      const result = store({
        tags: ['auth', 'jwt', 'security'],
        context: 'REST API with JWT authentication',
        type: 'architecture',
        outcome: 'success',
        solution: 'Use @fastify/jwt with RS256',
        antiPattern: 'DO NOT store tokens in localStorage',
        project: 'plot-twist',
      }, { dir: tmpDir });

      assert.equal(result.id, 'pat-001');
      assert.equal(result.isNew, true);
      assert.equal(result.merged, false);

      // Verify file was written
      const files = fs.readdirSync(tmpDir);
      assert.equal(files.length, 1);
      assert.ok(files[0].startsWith('pat-001'));

      // Verify content
      const content = fs.readFileSync(path.join(tmpDir, files[0]), 'utf-8');
      assert.ok(content.includes('id: pat-001'));
      assert.ok(content.includes('auth'));
      assert.ok(content.includes('jwt'));
      assert.ok(content.includes('architecture'));
      assert.ok(content.includes('Use @fastify/jwt with RS256'));
      assert.ok(content.includes('DO NOT store tokens in localStorage'));
    });

    it('auto-generates sequential IDs', () => {
      const r1 = store({ tags: ['a'], context: 'first', solution: 's1' }, { dir: tmpDir });
      const r2 = store({ tags: ['b'], context: 'second', solution: 's2' }, { dir: tmpDir });
      const r3 = store({ tags: ['c'], context: 'third', solution: 's3' }, { dir: tmpDir });

      assert.equal(r1.id, 'pat-001');
      assert.equal(r2.id, 'pat-002');
      assert.equal(r3.id, 'pat-003');
    });

    it('deduplicates when same tags+context are stored again', () => {
      const r1 = store({
        tags: ['auth', 'jwt'],
        context: 'REST API auth',
        type: 'architecture',
        solution: 'Use RS256',
        project: 'proj-a',
      }, { dir: tmpDir });

      assert.equal(r1.isNew, true);
      assert.equal(r1.merged, false);

      // Store very similar pattern — should merge
      const r2 = store({
        tags: ['auth', 'jwt'],
        context: 'REST API auth',
        type: 'architecture',
        solution: 'Use RS256 with rotation',
        project: 'proj-b',
      }, { dir: tmpDir });

      assert.equal(r2.isNew, false);
      assert.equal(r2.merged, true);
      assert.equal(r2.id, r1.id);

      // Verify only 1 file exists
      const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.md'));
      assert.equal(files.length, 1);

      // Verify frequency was incremented
      const content = fs.readFileSync(path.join(tmpDir, files[0]), 'utf-8');
      assert.ok(content.includes('frequency: 2'));

      // Verify projects were merged
      assert.ok(content.includes('proj-a'));
      assert.ok(content.includes('proj-b'));
    });

    it('creates new pattern when tags differ significantly', () => {
      store({
        tags: ['auth', 'jwt'],
        context: 'REST API auth',
        solution: 's1',
      }, { dir: tmpDir });

      const r2 = store({
        tags: ['database', 'postgres'],
        context: 'Database connection pooling',
        solution: 's2',
      }, { dir: tmpDir });

      assert.equal(r2.isNew, true);
      assert.equal(r2.id, 'pat-002');
    });

    it('defaults type to implementation and outcome to success', () => {
      const result = store({
        tags: ['test'],
        context: 'test context',
        solution: 'test solution',
      }, { dir: tmpDir });

      const content = fs.readFileSync(path.join(tmpDir, `${result.id}.md`), 'utf-8');
      assert.ok(content.includes('type: implementation'));
      assert.ok(content.includes('outcome: success'));
    });
  });

  describe('search()', () => {

    it('returns scored results sorted by relevance', () => {
      store({
        tags: ['auth', 'jwt', 'security'],
        context: 'REST API with JWT authentication',
        type: 'security',
        solution: 'Use RS256',
      }, { dir: tmpDir });

      store({
        tags: ['auth', 'oauth', 'security'],
        context: 'OAuth2 integration for SSO',
        type: 'security',
        solution: 'Use PKCE flow',
      }, { dir: tmpDir });

      store({
        tags: ['database', 'postgres'],
        context: 'Database connection pooling',
        type: 'implementation',
        solution: 'Use pg-pool',
      }, { dir: tmpDir });

      // Search for auth-related patterns
      const results = search({ tags: ['auth', 'security'] }, { dir: tmpDir });

      assert.ok(results.length >= 2, `Expected at least 2 results, got ${results.length}`);
      // Both auth patterns should score higher than database
      for (const r of results) {
        assert.ok(r.score > 0, 'Score should be positive');
        assert.ok(r.id, 'Should have ID');
        assert.ok(r.tags, 'Should have tags');
      }
      // Results should be sorted descending by score
      for (let i = 1; i < results.length; i++) {
        assert.ok(results[i - 1].score >= results[i].score,
          `Results should be sorted: ${results[i - 1].score} >= ${results[i].score}`);
      }
    });

    it('filters by type', () => {
      store({ tags: ['auth'], context: 'Auth', type: 'security', solution: 's' }, { dir: tmpDir });
      store({ tags: ['auth'], context: 'Auth impl', type: 'implementation', solution: 's' }, { dir: tmpDir });

      const results = search({ tags: ['auth'], type: 'security' }, { dir: tmpDir });
      assert.equal(results.length, 1);
      assert.equal(results[0].id, 'pat-001');
    });

    it('filters by outcome', () => {
      store({ tags: ['deploy', 'docker'], context: 'Docker deploy success', outcome: 'success', solution: 's' }, { dir: tmpDir });
      store({ tags: ['deploy', 'kubernetes'], context: 'Kubernetes deploy failure', outcome: 'failure', solution: 's' }, { dir: tmpDir });

      const results = search({ tags: ['deploy'], outcome: 'failure' }, { dir: tmpDir });
      assert.equal(results.length, 1);
    });

    it('returns empty array for no matches', () => {
      store({ tags: ['auth'], context: 'Auth', solution: 's' }, { dir: tmpDir });
      const results = search({ tags: ['database', 'redis'] }, { dir: tmpDir });
      assert.equal(results.length, 0);
    });

    it('returns empty array for empty library', () => {
      const results = search({ tags: ['anything'] }, { dir: tmpDir });
      assert.equal(results.length, 0);
    });

    it('returns empty array for nonexistent directory', () => {
      const results = search({ tags: ['anything'] }, { dir: path.join(tmpDir, 'nonexistent') });
      assert.equal(results.length, 0);
    });
  });

  describe('tag intersection scoring', () => {

    it('gives score 1.0 for identical tag sets', () => {
      store({
        tags: ['auth', 'jwt'],
        context: 'Auth context',
        solution: 's',
      }, { dir: tmpDir });

      const results = search({ tags: ['auth', 'jwt'] }, { dir: tmpDir });
      assert.equal(results.length, 1);
      // tagScore = 2/2 = 1.0, contextScore depends on keyword match
      // With no context query, score = 1.0 * 0.6 + 0 * 0.4 = 0.6
      assert.ok(results[0].score >= 0.6, `Score should be >= 0.6, got ${results[0].score}`);
    });

    it('gives partial score for overlapping tags', () => {
      store({
        tags: ['auth', 'jwt', 'security', 'fastify'],
        context: 'JWT Auth',
        solution: 's',
      }, { dir: tmpDir });

      // Query with 1 matching tag out of union of 5
      const results = search({ tags: ['auth', 'react'] }, { dir: tmpDir });
      assert.equal(results.length, 1);
      // intersection = {auth} = 1, union = {auth, jwt, security, fastify, react} = 5
      // tagScore = 1/5 = 0.2, score = 0.2 * 0.6 = 0.12
      assert.ok(results[0].score > 0);
      assert.ok(results[0].score < 0.6);
    });

    it('gives zero score for disjoint tags with no context', () => {
      store({
        tags: ['database', 'postgres'],
        context: 'DB pooling',
        solution: 's',
      }, { dir: tmpDir });

      const results = search({ tags: ['frontend', 'react'] }, { dir: tmpDir });
      assert.equal(results.length, 0);
    });

    it('context keywords boost the score', () => {
      store({
        tags: ['api'],
        context: 'REST API with authentication and rate limiting',
        solution: 's',
      }, { dir: tmpDir });

      // Search with context that has matching keywords
      const withCtx = search({
        tags: ['api'],
        context: 'REST API authentication',
      }, { dir: tmpDir });

      const withoutCtx = search({
        tags: ['api'],
      }, { dir: tmpDir });

      assert.equal(withCtx.length, 1);
      assert.equal(withoutCtx.length, 1);
      assert.ok(withCtx[0].score > withoutCtx[0].score,
        `Context match should boost score: ${withCtx[0].score} > ${withoutCtx[0].score}`);
    });
  });

  describe('getForAgent()', () => {

    it('returns relevant patterns for security agent (08)', () => {
      store({
        tags: ['auth', 'jwt', 'security'],
        context: 'JWT authentication for API',
        type: 'security',
        solution: 'Use RS256 with rotation',
      }, { dir: tmpDir });

      store({
        tags: ['database', 'orm'],
        context: 'Database ORM setup',
        type: 'implementation',
        solution: 'Use Prisma',
      }, { dir: tmpDir });

      const result = getForAgent('08', 'JWT auth security review', { dir: tmpDir });
      assert.ok(result.includes('Relevant Patterns'), 'Should contain header');
      assert.ok(result.includes('RS256'), 'Should contain security pattern');
      assert.ok(!result.includes('Prisma'), 'Should not contain implementation pattern');
    });

    it('returns empty string when no patterns match', () => {
      const result = getForAgent('12', 'completely unrelated task', { dir: tmpDir });
      assert.equal(result, '');
    });

    it('respects token budget', () => {
      // Store many patterns
      for (let i = 0; i < 20; i++) {
        store({
          tags: ['impl', `tag${i}`],
          context: `Implementation pattern number ${i} with details`,
          type: 'implementation',
          solution: 'A '.repeat(200), // ~200 chars each
        }, { dir: tmpDir });
      }

      const config = { patterns: { max_injection_tokens: 100 } }; // 400 chars max
      const result = getForAgent('12', 'impl pattern', { dir: tmpDir, config });
      // Should be truncated to fit within budget
      assert.ok(result.length <= 400 + 100, // some header overhead
        `Output should be within budget: ${result.length} chars`);
    });

    it('defaults to implementation type for unknown agent', () => {
      store({
        tags: ['test'],
        context: 'test pattern',
        type: 'implementation',
        solution: 'test solution',
      }, { dir: tmpDir });

      const result = getForAgent('99', 'test pattern', { dir: tmpDir });
      assert.ok(result.includes('test solution'));
    });
  });

  describe('captureFromGate()', () => {

    it('captures decisions from gate artifacts', () => {
      const result = captureFromGate('G1', {
        project: 'test-proj',
        decisions: [
          {
            tags: ['arch', 'microservices'],
            context: 'Service boundary decision',
            content: 'Split by bounded context',
            reusable: true,
          },
        ],
      }, { dir: tmpDir });

      assert.equal(result.captured, 1);

      const listed = list({}, { dir: tmpDir });
      assert.equal(listed.total, 1);
      assert.ok(listed.patterns[0].tags.includes('arch'));
    });

    it('captures patterns array from artifacts', () => {
      const result = captureFromGate('G2', {
        project: 'test-proj',
        patterns: [
          {
            tags: ['security', 'csp'],
            context: 'Content Security Policy',
            solution: 'Use strict CSP headers',
          },
        ],
      }, { dir: tmpDir });

      assert.equal(result.captured, 1);
    });

    it('skips capture when auto_capture is false', () => {
      const config = { patterns: { auto_capture: false } };
      const result = captureFromGate('G1', {
        decisions: [{ tags: ['x'], context: 'y', content: 'z' }],
      }, { dir: tmpDir, config });

      assert.equal(result.captured, 0);
    });

    it('maps gate to correct type', () => {
      captureFromGate('G2', {
        decisions: [{ tags: ['sec'], context: 'Security check', content: 'sol' }],
      }, { dir: tmpDir });

      const listed = list({}, { dir: tmpDir });
      assert.equal(listed.patterns[0].type, 'security');
    });
  });

  describe('list()', () => {

    it('lists all patterns', () => {
      store({ tags: ['a'], context: 'ctx-a', type: 'architecture', solution: 's' }, { dir: tmpDir });
      store({ tags: ['b'], context: 'ctx-b', type: 'security', solution: 's' }, { dir: tmpDir });
      store({ tags: ['c'], context: 'ctx-c', type: 'implementation', solution: 's' }, { dir: tmpDir });

      const result = list({}, { dir: tmpDir });
      assert.equal(result.total, 3);
      assert.equal(result.patterns.length, 3);
    });

    it('filters by type', () => {
      store({ tags: ['a'], context: 'ctx-a', type: 'architecture', solution: 's' }, { dir: tmpDir });
      store({ tags: ['b'], context: 'ctx-b', type: 'security', solution: 's' }, { dir: tmpDir });

      const result = list({ type: 'security' }, { dir: tmpDir });
      assert.equal(result.total, 1);
      assert.equal(result.patterns[0].type, 'security');
    });

    it('filters by outcome', () => {
      store({ tags: ['a'], context: 'ctx-a', outcome: 'success', solution: 's' }, { dir: tmpDir });
      store({ tags: ['b'], context: 'ctx-b', outcome: 'failure', solution: 's' }, { dir: tmpDir });

      const result = list({ outcome: 'failure' }, { dir: tmpDir });
      assert.equal(result.total, 1);
    });

    it('filters by tag', () => {
      store({ tags: ['auth', 'jwt'], context: 'ctx-a', solution: 's' }, { dir: tmpDir });
      store({ tags: ['database'], context: 'ctx-b', solution: 's' }, { dir: tmpDir });

      const result = list({ tag: 'auth' }, { dir: tmpDir });
      assert.equal(result.total, 1);
      assert.ok(result.patterns[0].tags.includes('auth'));
    });

    it('returns empty results for empty library', () => {
      const result = list({}, { dir: tmpDir });
      assert.equal(result.total, 0);
      assert.deepEqual(result.patterns, []);
    });

    it('returns empty results for nonexistent directory', () => {
      const result = list({}, { dir: path.join(tmpDir, 'nonexistent') });
      assert.equal(result.total, 0);
      assert.deepEqual(result.patterns, []);
    });

    it('includes frequency in results', () => {
      store({ tags: ['auth', 'jwt'], context: 'REST API auth', solution: 's' }, { dir: tmpDir });
      // Store again to bump frequency
      store({ tags: ['auth', 'jwt'], context: 'REST API auth', solution: 's2' }, { dir: tmpDir });

      const result = list({}, { dir: tmpDir });
      assert.equal(result.total, 1);
      assert.equal(result.patterns[0].frequency, 2);
    });
  });
});
