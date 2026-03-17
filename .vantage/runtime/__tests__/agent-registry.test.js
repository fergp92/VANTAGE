import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadAgent, getTeamAgents, buildPrompt } from '../agent-registry.js';

describe('agent-registry', () => {
  describe('loadAgent()', () => {
    it('loads agent prompt, memory, and toolkit for existing agent', () => {
      const result = loadAgent('08-security-architect', {
        memory: { injection_budget: 500 },
      });
      assert.ok(result.prompt.length > 0, 'prompt should not be empty');
      assert.equal(typeof result.memory, 'string');
      assert.equal(typeof result.toolkitIndex, 'string');
      assert.ok(result.config.memoryBudget > 0);
    });

    it('returns empty prompt for non-existent agent', () => {
      const result = loadAgent('99-nonexistent', {});
      assert.equal(result.prompt, '');
    });
  });

  describe('getTeamAgents()', () => {
    it('returns agent IDs for known preset', () => {
      const agents = getTeamAgents('minimum-viable');
      assert.ok(Array.isArray(agents));
      assert.ok(agents.includes('00'));
      assert.ok(agents.length >= 4);
    });

    it('returns core team for unknown preset', () => {
      const agents = getTeamAgents('nonexistent-preset');
      assert.ok(agents.includes('00'));
      assert.ok(agents.includes('08'));
    });
  });

  describe('buildPrompt()', () => {
    it('assembles prompt with task, memory, and toolkit', () => {
      const prompt = buildPrompt(
        '08-security-architect',
        'Review auth module for OWASP Top 10',
        { projectStack: ['node', 'fastify'] },
        { memory: { injection_budget: 500 } }
      );
      assert.ok(prompt.includes('Review auth module'));
      assert.ok(prompt.includes('## Agent Definition'));
    });

    it('includes memory learnings when memory file exists', () => {
      const memDir = path.join(import.meta.dirname, '../../memory/agents');
      const memFile = path.join(memDir, '08-security-architect.md');
      fs.mkdirSync(memDir, { recursive: true });
      const memContent = `---\nagent: "08-security-architect"\ntotal_invocations: 1\nlast_used: 2026-03-14\n---\n\n### 2026-03-14 — Project: test\n- [DECISION] Always use Argon2 over bcrypt.\n`;
      fs.writeFileSync(memFile, memContent, 'utf-8');

      try {
        const prompt = buildPrompt('08-security-architect', 'Review auth', {}, { memory: { injection_budget: 500 } });
        assert.ok(prompt.includes('Learnings from Previous Sessions'));
        assert.ok(prompt.includes('Argon2'));
      } finally {
        fs.unlinkSync(memFile);
      }
    });
  });
});
