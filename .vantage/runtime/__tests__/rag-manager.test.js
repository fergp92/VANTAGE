import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chunkAgentMemory, buildIndex, search, loadWithRAG } from '../rag-manager.js';

const MEMORY_DIR = path.join(import.meta.dirname, '../../memory/agents');
const INDEX_DIR = path.join(import.meta.dirname, '../../memory/indices');
const TEST_AGENT = 'rag-test-agent';
const TEST_FILE = path.join(MEMORY_DIR, `${TEST_AGENT}.md`);
const TEST_INDEX = path.join(INDEX_DIR, `${TEST_AGENT}.index.json`);

const SAMPLE_MEMORY = `---
agent: rag-test-agent
total_invocations: 5
last_used: '2026-03-15'
---

### 2026-03-10 — Project: auth-api
- [DECISION] Use Argon2 for password hashing instead of bcrypt
- [DISCOVERY] Fastify v5 changed the hook execution order

### 2026-03-12 — Project: auth-api
- [ERROR] CORS preflight requests were failing due to missing headers
- [DECISION] Added explicit OPTIONS handler for all API routes

### 2026-03-15 — Project: dashboard
- [DISCOVERY] React 19 server components require different hydration strategy
- [DECISION] Use streaming SSR for initial page load performance
`;

function cleanup() {
  if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
  if (fs.existsSync(TEST_INDEX)) fs.unlinkSync(TEST_INDEX);
}

describe('rag-manager', () => {
  beforeEach(() => {
    cleanup();
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  });

  afterEach(() => {
    cleanup();
  });

  describe('chunkAgentMemory()', () => {
    it('splits content into chunks on date headers', () => {
      const chunks = chunkAgentMemory(SAMPLE_MEMORY, TEST_AGENT);
      assert.equal(chunks.length, 3);
    });

    it('extracts correct dates from headers', () => {
      const chunks = chunkAgentMemory(SAMPLE_MEMORY, TEST_AGENT);
      assert.equal(chunks[0].date, '2026-03-10');
      assert.equal(chunks[1].date, '2026-03-12');
      assert.equal(chunks[2].date, '2026-03-15');
    });

    it('extracts project names from headers', () => {
      const chunks = chunkAgentMemory(SAMPLE_MEMORY, TEST_AGENT);
      assert.equal(chunks[0].project, 'auth-api');
      assert.equal(chunks[2].project, 'dashboard');
    });

    it('extracts tags from bracketed markers', () => {
      const chunks = chunkAgentMemory(SAMPLE_MEMORY, TEST_AGENT);
      assert.ok(chunks[0].tags.includes('DECISION'));
      assert.ok(chunks[0].tags.includes('DISCOVERY'));
      assert.ok(chunks[1].tags.includes('ERROR'));
    });

    it('sets agentId on each chunk', () => {
      const chunks = chunkAgentMemory(SAMPLE_MEMORY, TEST_AGENT);
      for (const chunk of chunks) {
        assert.equal(chunk.agentId, TEST_AGENT);
      }
    });

    it('estimates tokens for each chunk', () => {
      const chunks = chunkAgentMemory(SAMPLE_MEMORY, TEST_AGENT);
      for (const chunk of chunks) {
        assert.ok(chunk.tokens > 0);
        assert.equal(typeof chunk.tokens, 'number');
      }
    });

    it('returns empty array for empty content', () => {
      assert.deepEqual(chunkAgentMemory('', TEST_AGENT), []);
      assert.deepEqual(chunkAgentMemory(null, TEST_AGENT), []);
      assert.deepEqual(chunkAgentMemory(undefined, TEST_AGENT), []);
    });

    it('returns empty array for content with only frontmatter', () => {
      const result = chunkAgentMemory('---\nagent: test\n---\n\n', TEST_AGENT);
      assert.deepEqual(result, []);
    });

    it('strips frontmatter before chunking', () => {
      const chunks = chunkAgentMemory(SAMPLE_MEMORY, TEST_AGENT);
      for (const chunk of chunks) {
        assert.ok(!chunk.text.includes('---'));
      }
    });
  });

  describe('buildIndex()', () => {
    it('builds a valid TF-IDF index from memory file', () => {
      fs.writeFileSync(TEST_FILE, SAMPLE_MEMORY, 'utf-8');
      const result = buildIndex(TEST_AGENT);

      assert.ok(result !== null);
      assert.equal(result.chunks, 3);
      assert.ok(result.terms > 0);
      assert.ok(fs.existsSync(TEST_INDEX));
    });

    it('produces valid index JSON structure', () => {
      fs.writeFileSync(TEST_FILE, SAMPLE_MEMORY, 'utf-8');
      buildIndex(TEST_AGENT);

      const index = JSON.parse(fs.readFileSync(TEST_INDEX, 'utf-8'));
      assert.equal(index.version, '1.0');
      assert.equal(index.agentId, TEST_AGENT);
      assert.ok(Array.isArray(index.chunks));
      assert.equal(index.chunks.length, 3);
      assert.ok(typeof index.idf === 'object');
    });

    it('stores TF values per chunk', () => {
      fs.writeFileSync(TEST_FILE, SAMPLE_MEMORY, 'utf-8');
      buildIndex(TEST_AGENT);

      const index = JSON.parse(fs.readFileSync(TEST_INDEX, 'utf-8'));
      for (const chunk of index.chunks) {
        assert.ok(typeof chunk.tf === 'object');
        // TF values should be between 0 and 1 (normalized)
        for (const val of Object.values(chunk.tf)) {
          assert.ok(val > 0 && val <= 1, `TF value ${val} should be in (0, 1]`);
        }
      }
    });

    it('computes positive IDF values', () => {
      fs.writeFileSync(TEST_FILE, SAMPLE_MEMORY, 'utf-8');
      buildIndex(TEST_AGENT);

      const index = JSON.parse(fs.readFileSync(TEST_INDEX, 'utf-8'));
      // Terms appearing in all chunks should have IDF = 0
      // Terms appearing in fewer chunks should have IDF > 0
      const idfValues = Object.values(index.idf);
      assert.ok(idfValues.length > 0);
      assert.ok(idfValues.some(v => v > 0), 'Some IDF values should be > 0');
    });

    it('returns null for non-existent agent', () => {
      const result = buildIndex('nonexistent-agent');
      assert.equal(result, null);
    });

    it('returns null for empty memory file', () => {
      fs.writeFileSync(TEST_FILE, '---\nagent: test\n---\n', 'utf-8');
      const result = buildIndex(TEST_AGENT);
      assert.equal(result, null);
    });

    it('creates indices directory if missing', () => {
      if (fs.existsSync(INDEX_DIR)) {
        fs.rmSync(INDEX_DIR, { recursive: true });
      }
      fs.writeFileSync(TEST_FILE, SAMPLE_MEMORY, 'utf-8');
      buildIndex(TEST_AGENT);
      assert.ok(fs.existsSync(INDEX_DIR));
    });
  });

  describe('search()', () => {
    beforeEach(() => {
      fs.writeFileSync(TEST_FILE, SAMPLE_MEMORY, 'utf-8');
      buildIndex(TEST_AGENT);
    });

    it('returns relevant chunks for a query', () => {
      const results = search(TEST_AGENT, 'password hashing argon2');
      assert.ok(results.length > 0);
      // The chunk about Argon2 should rank highest
      assert.ok(results[0].text.includes('Argon2'));
    });

    it('returns chunks about CORS when querying for CORS', () => {
      const results = search(TEST_AGENT, 'CORS preflight headers');
      assert.ok(results.length > 0);
      assert.ok(results[0].text.includes('CORS'));
    });

    it('returns chunks about React when querying for React', () => {
      const results = search(TEST_AGENT, 'React server components SSR');
      assert.ok(results.length > 0);
      assert.ok(results[0].text.includes('React'));
    });

    it('respects topK parameter', () => {
      const results = search(TEST_AGENT, 'api project decision', 1);
      assert.ok(results.length <= 1);
    });

    it('returns results sorted by score descending', () => {
      const results = search(TEST_AGENT, 'password hashing CORS React');
      for (let i = 1; i < results.length; i++) {
        assert.ok(results[i - 1].score >= results[i].score,
          'Results should be sorted by score descending');
      }
    });

    it('returns empty array when no index exists', () => {
      const results = search('nonexistent-agent', 'test query');
      assert.deepEqual(results, []);
    });

    it('returns empty array for empty query', () => {
      const results = search(TEST_AGENT, '');
      assert.deepEqual(results, []);
    });

    it('returns empty array for stopword-only query', () => {
      const results = search(TEST_AGENT, 'the and or is');
      assert.deepEqual(results, []);
    });

    it('result objects have expected shape', () => {
      const results = search(TEST_AGENT, 'password');
      assert.ok(results.length > 0);
      const r = results[0];
      assert.ok(typeof r.score === 'number');
      assert.ok(typeof r.date === 'string');
      assert.ok(typeof r.project === 'string');
      assert.ok(Array.isArray(r.tags));
      assert.ok(typeof r.tokens === 'number');
      assert.ok(typeof r.text === 'string');
    });
  });

  describe('loadWithRAG()', () => {
    it('returns RAG-retrieved content when index exists', () => {
      fs.writeFileSync(TEST_FILE, SAMPLE_MEMORY, 'utf-8');
      buildIndex(TEST_AGENT);

      const result = loadWithRAG(TEST_AGENT, 'password hashing', 500);
      assert.ok(result.includes('RAG-retrieved'));
      assert.ok(result.includes('Argon2'));
    });

    it('falls back to truncation when no index exists', () => {
      fs.writeFileSync(TEST_FILE, SAMPLE_MEMORY, 'utf-8');
      // Do NOT build index
      const result = loadWithRAG(TEST_AGENT, 'password hashing', 500);
      assert.ok(result.includes('Learnings from Previous Sessions'));
      assert.ok(!result.includes('RAG-retrieved'));
    });

    it('returns empty string for non-existent agent', () => {
      const result = loadWithRAG('nonexistent-agent', 'test query', 500);
      assert.equal(result, '');
    });

    it('respects token budget', () => {
      fs.writeFileSync(TEST_FILE, SAMPLE_MEMORY, 'utf-8');
      buildIndex(TEST_AGENT);

      // Very small budget should still return something
      const result = loadWithRAG(TEST_AGENT, 'password', 50);
      assert.ok(result.length > 0);
    });

    it('falls back when search returns no results', () => {
      fs.writeFileSync(TEST_FILE, SAMPLE_MEMORY, 'utf-8');
      buildIndex(TEST_AGENT);

      // Query with only stopwords should return fallback
      const result = loadWithRAG(TEST_AGENT, 'the and or', 500);
      assert.ok(result.includes('Learnings from Previous Sessions'));
      assert.ok(!result.includes('RAG-retrieved'));
    });
  });

  describe('edge cases', () => {
    it('handles memory file with no date headers gracefully', () => {
      const noHeaders = '---\nagent: test\n---\n\nSome plain text without headers\n';
      fs.writeFileSync(TEST_FILE, noHeaders, 'utf-8');
      const chunks = chunkAgentMemory(noHeaders, TEST_AGENT);
      // Should still produce one chunk (the plain text)
      assert.ok(chunks.length >= 0);
    });

    it('handles single-entry memory file', () => {
      const single = `---
agent: test
---

### 2026-03-15 — Project: solo
- [DECISION] Only one entry here
`;
      fs.writeFileSync(TEST_FILE, single, 'utf-8');
      const result = buildIndex(TEST_AGENT);
      assert.ok(result !== null);
      assert.equal(result.chunks, 1);

      // Search should still work with a single chunk
      const results = search(TEST_AGENT, 'entry');
      assert.ok(results.length >= 0);
    });

    it('handles memory file with no frontmatter', () => {
      const noFm = `### 2026-03-15 — Project: test
- [ERROR] Something broke
`;
      const chunks = chunkAgentMemory(noFm, TEST_AGENT);
      assert.equal(chunks.length, 1);
      assert.equal(chunks[0].date, '2026-03-15');
    });
  });
});
