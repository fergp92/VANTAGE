import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getModelForAgent, getTierForAgent, DEFAULT_TIERS } from '../agent-tiers.js';

describe('agent-tiers', () => {
  describe('DEFAULT_TIERS', () => {
    it('has all three tier lists and a model_map', () => {
      assert.ok(Array.isArray(DEFAULT_TIERS.heavy));
      assert.ok(Array.isArray(DEFAULT_TIERS.standard));
      assert.ok(Array.isArray(DEFAULT_TIERS.light));
      assert.ok(DEFAULT_TIERS.model_map);
      assert.equal(DEFAULT_TIERS.model_map.heavy, 'opus');
      assert.equal(DEFAULT_TIERS.model_map.standard, 'sonnet');
      assert.equal(DEFAULT_TIERS.model_map.light, 'haiku');
    });
  });

  describe('getTierForAgent()', () => {
    it('returns tier 1 for heavy agents (01, 04, 08, 11)', () => {
      assert.equal(getTierForAgent('01'), 1);
      assert.equal(getTierForAgent('04'), 1);
      assert.equal(getTierForAgent('08'), 1);
      assert.equal(getTierForAgent('11'), 1);
    });

    it('returns tier 2 for standard agents', () => {
      assert.equal(getTierForAgent('02'), 2);
      assert.equal(getTierForAgent('05'), 2);
      assert.equal(getTierForAgent('24'), 2);
      assert.equal(getTierForAgent('25'), 2);
    });

    it('returns tier 3 for light agents', () => {
      assert.equal(getTierForAgent('07'), 3);
      assert.equal(getTierForAgent('14'), 3);
      assert.equal(getTierForAgent('23'), 3);
      assert.equal(getTierForAgent('33'), 3);
    });

    it('handles full agent IDs like 08-security-architect', () => {
      assert.equal(getTierForAgent('08-security-architect'), 1);
      assert.equal(getTierForAgent('23-documentation'), 3);
      assert.equal(getTierForAgent('02-requirements-architect'), 2);
    });

    it('defaults to tier 2 (standard) for unknown agents', () => {
      assert.equal(getTierForAgent('99'), 2);
      assert.equal(getTierForAgent('50-unknown-agent'), 2);
    });

    it('respects projectConfig tier overrides', () => {
      const config = {
        tiers: {
          heavy: ['02', '03'],
          standard: ['08'],
          light: ['01'],
          model_map: { heavy: 'opus', standard: 'sonnet', light: 'haiku' },
        },
      };
      // Agent 08 was heavy by default, now standard via override
      assert.equal(getTierForAgent('08', config), 2);
      // Agent 02 was standard by default, now heavy via override
      assert.equal(getTierForAgent('02', config), 1);
      // Agent 01 was heavy by default, now light via override
      assert.equal(getTierForAgent('01', config), 3);
    });
  });

  describe('getModelForAgent()', () => {
    it('returns opus for tier 1 agents', () => {
      assert.equal(getModelForAgent('08'), 'opus');
      assert.equal(getModelForAgent('01'), 'opus');
    });

    it('returns sonnet for tier 2 agents', () => {
      assert.equal(getModelForAgent('05'), 'sonnet');
      assert.equal(getModelForAgent('24'), 'sonnet');
    });

    it('returns haiku for tier 3 agents', () => {
      assert.equal(getModelForAgent('16'), 'haiku');
      assert.equal(getModelForAgent('23'), 'haiku');
    });

    it('returns sonnet for unknown agents (default tier 2)', () => {
      assert.equal(getModelForAgent('99'), 'sonnet');
    });

    it('respects custom model_map in projectConfig', () => {
      const config = {
        tiers: {
          heavy: ['08'],
          standard: ['05'],
          light: ['23'],
          model_map: {
            heavy: 'claude-opus-4',
            standard: 'claude-sonnet-4',
            light: 'claude-haiku-3',
          },
        },
      };
      assert.equal(getModelForAgent('08', config), 'claude-opus-4');
      assert.equal(getModelForAgent('05', config), 'claude-sonnet-4');
      assert.equal(getModelForAgent('23', config), 'claude-haiku-3');
    });

    it('handles numeric IDs without zero-padding', () => {
      assert.equal(getModelForAgent('8'), 'opus');
      assert.equal(getModelForAgent('4'), 'opus');
      assert.equal(getModelForAgent('7'), 'haiku');
    });
  });
});
