import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, appendLearning, graduate, compactIfNeeded } from '../memory-manager.js';

const TEST_DIR = path.join(import.meta.dirname, '../../memory/agents');
const TEST_AGENT = 'test-agent';
const TEST_FILE = path.join(TEST_DIR, `${TEST_AGENT}.md`);

describe('memory-manager', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
  });

  describe('load()', () => {
    it('returns empty string when memory file does not exist', () => {
      const result = load(TEST_AGENT);
      assert.equal(result, '');
    });

    it('returns full content when file exists and within budget', () => {
      fs.writeFileSync(TEST_FILE, '---\nagent: test\n---\n\n### Entry\n- [DECISION] Use Fastify\n', 'utf-8');
      const result = load(TEST_AGENT, 1000);
      assert.ok(result.includes('[DECISION] Use Fastify'));
    });

    it('truncates content when exceeding token budget', () => {
      const longContent = '---\nagent: test\n---\n\n' + 'x'.repeat(5000);
      fs.writeFileSync(TEST_FILE, longContent, 'utf-8');
      const result = load(TEST_AGENT, 100);
      assert.ok(result.length < longContent.length);
    });

    it('returns formatted section with header', () => {
      fs.writeFileSync(TEST_FILE, '---\nagent: test\n---\n\n### Entry\n- [DECISION] Use Fastify\n', 'utf-8');
      const result = load(TEST_AGENT);
      assert.ok(result.includes('Learnings from Previous Sessions'));
    });

    it('handles corrupted YAML frontmatter gracefully', () => {
      fs.writeFileSync(TEST_FILE, '---\n: invalid yaml {{{\n---\n\n### Entry\n- [DECISION] Test\n', 'utf-8');
      const result = load(TEST_AGENT, 500);
      assert.equal(typeof result, 'string');
    });
  });

  describe('appendLearning()', () => {
    it('creates new file with frontmatter if none exists', () => {
      appendLearning(TEST_AGENT, { type: 'DECISION', content: 'Use PostgreSQL', project: 'test', reusable: true });
      assert.ok(fs.existsSync(TEST_FILE));
      const content = fs.readFileSync(TEST_FILE, 'utf-8');
      assert.ok(content.includes('agent:'));
      assert.ok(content.includes('[DECISION] Use PostgreSQL'));
    });

    it('appends to existing file in chronological order', () => {
      appendLearning(TEST_AGENT, { type: 'DECISION', content: 'First entry', project: 'test', reusable: true });
      appendLearning(TEST_AGENT, { type: 'ERROR', content: 'Second entry', project: 'test', reusable: true });
      const content = fs.readFileSync(TEST_FILE, 'utf-8');
      const firstIdx = content.indexOf('First entry');
      const secondIdx = content.indexOf('Second entry');
      assert.ok(firstIdx < secondIdx, 'Entries should be in chronological order');
    });

    it('creates directory if missing', () => {
      const customAgent = 'subdir-test-agent';
      const customFile = path.join(TEST_DIR, `${customAgent}.md`);
      try {
        appendLearning(customAgent, { type: 'DISCOVERY', content: 'Dir test', project: 'test', reusable: true });
        assert.ok(fs.existsSync(customFile));
      } finally {
        if (fs.existsSync(customFile)) fs.unlinkSync(customFile);
      }
    });

    it('handles empty entries gracefully', () => {
      appendLearning(TEST_AGENT, { type: 'DECISION', content: '', project: 'test', reusable: true });
      assert.ok(fs.existsSync(TEST_FILE));
    });
  });

  describe('graduate()', () => {
    it('promotes reusable session learnings to persistent memory', () => {
      const sessionMemory = {
        decisions: [
          { content: 'Use Argon2 over bcrypt', project: 'auth-api', reusable: true, roundtrips: 3 },
          { content: 'Temporary debug flag', project: 'auth-api', reusable: false, roundtrips: 1 },
        ],
        errors: [
          { content: 'CORS misconfigured for preflight', project: 'auth-api', reusable: true, roundtrips: 4 },
        ],
        discoveries: [
          { content: 'Fastify v5 changed hook order', project: 'auth-api', reusable: true, roundtrips: 1 },
        ],
      };

      const result = graduate(TEST_AGENT, sessionMemory);
      assert.ok(result.graduated >= 2); // Argon2 + CORS (both reusable + high roundtrips or errors)
      assert.ok(result.discarded >= 1); // debug flag (not reusable)

      const content = fs.readFileSync(TEST_FILE, 'utf-8');
      assert.ok(content.includes('Argon2'));
      assert.ok(content.includes('CORS'));
    });

    it('handles empty session memory', () => {
      const result = graduate(TEST_AGENT, { decisions: [], errors: [], discoveries: [] });
      assert.equal(result.graduated, 0);
      assert.equal(result.discarded, 0);
    });
  });

  describe('compactIfNeeded()', () => {
    it('returns compacted=false when file is under threshold', () => {
      appendLearning(TEST_AGENT, { type: 'DECISION', content: 'Short entry', project: 'test', reusable: true });
      const result = compactIfNeeded(TEST_AGENT, 8000);
      assert.equal(result.compacted, false);
    });

    it('compacts file when over threshold', () => {
      // Create a file large enough to exceed a small threshold
      for (let i = 0; i < 20; i++) {
        appendLearning(TEST_AGENT, { type: 'DECISION', content: `Entry ${i} with some padding text to make it longer`, project: 'test', reusable: true });
      }
      const beforeSize = fs.readFileSync(TEST_FILE, 'utf-8').length;
      const result = compactIfNeeded(TEST_AGENT, 50); // Very low threshold in tokens
      assert.equal(result.compacted, true);
      const afterSize = fs.readFileSync(TEST_FILE, 'utf-8').length;
      assert.ok(afterSize < beforeSize);
    });
  });
});
