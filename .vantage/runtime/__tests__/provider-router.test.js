import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  PROVIDERS,
  resolveModel,
  getNextProvider,
  trackUsage,
  getCostReport,
  resetUsage,
  getHealthStatus,
  reportError,
} from '../provider-router.js';

describe('provider-router', () => {
  beforeEach(() => {
    resetUsage();
  });

  // -----------------------------------------------------------------------
  // PROVIDERS constant
  // -----------------------------------------------------------------------
  describe('PROVIDERS', () => {
    it('defines anthropic, openai, google, and ollama', () => {
      assert.ok(PROVIDERS.anthropic);
      assert.ok(PROVIDERS.openai);
      assert.ok(PROVIDERS.google);
      assert.ok(PROVIDERS.ollama);
    });

    it('each provider has models and cost_per_1k_tokens for all tiers', () => {
      for (const [name, def] of Object.entries(PROVIDERS)) {
        for (const tier of ['opus', 'sonnet', 'haiku']) {
          assert.ok(def.models[tier], `${name} missing model for tier ${tier}`);
          assert.equal(typeof def.cost_per_1k_tokens[tier], 'number', `${name} missing cost for tier ${tier}`);
        }
      }
    });

    it('ollama has zero cost for all tiers', () => {
      assert.equal(PROVIDERS.ollama.cost_per_1k_tokens.opus, 0);
      assert.equal(PROVIDERS.ollama.cost_per_1k_tokens.sonnet, 0);
      assert.equal(PROVIDERS.ollama.cost_per_1k_tokens.haiku, 0);
    });
  });

  // -----------------------------------------------------------------------
  // resolveModel
  // -----------------------------------------------------------------------
  describe('resolveModel()', () => {
    it('returns correct provider/model for a heavy agent (opus tier)', () => {
      const result = resolveModel('08');
      assert.equal(result.provider, 'anthropic');
      assert.equal(result.model, 'claude-opus-4-6');
      assert.equal(result.tier, 'opus');
      assert.equal(result.costPer1k, 0.075);
    });

    it('returns correct provider/model for a standard agent (sonnet tier)', () => {
      const result = resolveModel('05');
      assert.equal(result.provider, 'anthropic');
      assert.equal(result.model, 'claude-sonnet-4-6');
      assert.equal(result.tier, 'sonnet');
      assert.equal(result.costPer1k, 0.015);
    });

    it('returns correct provider/model for a light agent (haiku tier)', () => {
      const result = resolveModel('23');
      assert.equal(result.provider, 'anthropic');
      assert.equal(result.model, 'claude-haiku-4-5-20251001');
      assert.equal(result.tier, 'haiku');
      assert.equal(result.costPer1k, 0.005);
    });

    it('handles full agent name with numeric prefix', () => {
      const result = resolveModel('08-security-architect');
      assert.equal(result.tier, 'opus');
      assert.equal(result.model, 'claude-opus-4-6');
    });

    it('respects config override for primary provider', () => {
      const result = resolveModel('08', { providers: { primary: 'openai' } });
      assert.equal(result.provider, 'openai');
      assert.equal(result.model, 'gpt-4o');
      assert.equal(result.tier, 'opus');
      assert.equal(result.costPer1k, 0.025);
    });

    it('uses ollama costs (zero) when primary is ollama', () => {
      const result = resolveModel('08', { providers: { primary: 'ollama' } });
      assert.equal(result.provider, 'ollama');
      assert.equal(result.costPer1k, 0);
    });
  });

  // -----------------------------------------------------------------------
  // getNextProvider (fallback chain)
  // -----------------------------------------------------------------------
  describe('getNextProvider()', () => {
    it('returns first fallback after primary', () => {
      const next = getNextProvider('anthropic');
      assert.equal(next, 'openai');
    });

    it('returns second fallback after first fallback', () => {
      const next = getNextProvider('openai');
      assert.equal(next, 'google');
    });

    it('returns null when last fallback is reached', () => {
      const next = getNextProvider('google');
      assert.equal(next, null);
    });

    it('returns null for unknown provider', () => {
      const next = getNextProvider('unknown-provider');
      assert.equal(next, null);
    });

    it('respects custom fallback chain from config', () => {
      const config = {
        providers: {
          primary: 'google',
          fallback: ['ollama', 'anthropic'],
        },
      };
      assert.equal(getNextProvider('google', config), 'ollama');
      assert.equal(getNextProvider('ollama', config), 'anthropic');
      assert.equal(getNextProvider('anthropic', config), null);
    });
  });

  // -----------------------------------------------------------------------
  // trackUsage + getCostReport
  // -----------------------------------------------------------------------
  describe('trackUsage() and getCostReport()', () => {
    it('accumulates tokens correctly', () => {
      trackUsage('anthropic', 'opus', 1000);
      trackUsage('anthropic', 'opus', 500);
      trackUsage('anthropic', 'sonnet', 2000);

      const report = getCostReport();
      assert.equal(report.byProvider.anthropic.tokens, 3500);
      assert.equal(report.byTier.opus.tokens, 1500);
      assert.equal(report.byTier.sonnet.tokens, 2000);
    });

    it('calculates costs accurately', () => {
      trackUsage('anthropic', 'opus', 1000); // 1000/1000 * 0.075 = 0.075
      trackUsage('openai', 'haiku', 10000); // 10000/1000 * 0.00015 = 0.0015

      const report = getCostReport();
      assert.ok(Math.abs(report.byProvider.anthropic.cost - 0.075) < 0.0001);
      assert.ok(Math.abs(report.byProvider.openai.cost - 0.0015) < 0.0001);
      assert.ok(Math.abs(report.totalCost - 0.0765) < 0.0001);
    });

    it('ollama usage has zero cost', () => {
      trackUsage('ollama', 'opus', 50000);
      trackUsage('ollama', 'sonnet', 30000);
      trackUsage('ollama', 'haiku', 20000);

      const report = getCostReport();
      assert.equal(report.byProvider.ollama.cost, 0);
      assert.equal(report.byProvider.ollama.tokens, 100000);
      assert.equal(report.totalCost, 0);
    });

    it('tracks multiple providers separately', () => {
      trackUsage('anthropic', 'sonnet', 5000);
      trackUsage('openai', 'sonnet', 3000);

      const report = getCostReport();
      assert.equal(report.byProvider.anthropic.tokens, 5000);
      assert.equal(report.byProvider.openai.tokens, 3000);
      // sonnet tier should aggregate both
      assert.equal(report.byTier.sonnet.tokens, 8000);
    });

    it('returns empty report when no usage tracked', () => {
      const report = getCostReport();
      assert.equal(report.totalCost, 0);
      assert.deepEqual(report.byProvider, {});
      assert.deepEqual(report.byTier, {});
    });
  });

  // -----------------------------------------------------------------------
  // resetUsage
  // -----------------------------------------------------------------------
  describe('resetUsage()', () => {
    it('clears all usage tracking', () => {
      trackUsage('anthropic', 'opus', 5000);
      trackUsage('openai', 'haiku', 3000);
      resetUsage();

      const report = getCostReport();
      assert.equal(report.totalCost, 0);
      assert.deepEqual(report.byProvider, {});
    });

    it('clears health state as well', () => {
      reportError('anthropic');
      reportError('anthropic');
      reportError('anthropic');
      resetUsage();

      const status = getHealthStatus();
      assert.equal(status.anthropic.errors, 0);
      assert.equal(status.anthropic.healthy, true);
    });
  });

  // -----------------------------------------------------------------------
  // getHealthStatus + reportError
  // -----------------------------------------------------------------------
  describe('getHealthStatus() and reportError()', () => {
    it('all providers start healthy with zero errors', () => {
      const status = getHealthStatus();
      for (const provider of Object.keys(PROVIDERS)) {
        assert.equal(status[provider].errors, 0);
        assert.equal(status[provider].lastError, null);
        assert.equal(status[provider].healthy, true);
      }
    });

    it('tracks errors without marking unhealthy below threshold', () => {
      reportError('anthropic');
      reportError('anthropic');

      const status = getHealthStatus();
      assert.equal(status.anthropic.errors, 2);
      assert.equal(status.anthropic.healthy, true);
    });

    it('marks unhealthy after 3 consecutive errors', () => {
      const fixedTime = () => new Date('2026-01-01T12:00:00Z');
      reportError('openai', fixedTime);
      reportError('openai', fixedTime);
      reportError('openai', fixedTime);

      const status = getHealthStatus(fixedTime);
      assert.equal(status.openai.errors, 3);
      assert.equal(status.openai.healthy, false);
    });

    it('auto-recovers after 5 minutes', () => {
      const errorTime = new Date('2026-01-01T12:00:00Z');
      const laterTime = new Date('2026-01-01T12:05:01Z'); // 5 min + 1 sec later

      reportError('google', () => errorTime);
      reportError('google', () => errorTime);
      reportError('google', () => errorTime);

      // Still unhealthy at error time
      const statusBefore = getHealthStatus(() => errorTime);
      assert.equal(statusBefore.google.healthy, false);

      // Recovered after 5 minutes
      const statusAfter = getHealthStatus(() => laterTime);
      assert.equal(statusAfter.google.healthy, true);
      assert.equal(statusAfter.google.errors, 0);
    });

    it('does not auto-recover before 5 minutes', () => {
      const errorTime = new Date('2026-01-01T12:00:00Z');
      const tooSoonTime = new Date('2026-01-01T12:04:59Z'); // just under 5 min

      reportError('google', () => errorTime);
      reportError('google', () => errorTime);
      reportError('google', () => errorTime);

      const status = getHealthStatus(() => tooSoonTime);
      assert.equal(status.google.healthy, false);
    });

    it('errors for one provider do not affect others', () => {
      reportError('anthropic');
      reportError('anthropic');
      reportError('anthropic');

      const status = getHealthStatus();
      assert.equal(status.anthropic.healthy, false);
      assert.equal(status.openai.healthy, true);
      assert.equal(status.google.healthy, true);
      assert.equal(status.ollama.healthy, true);
    });
  });
});
