import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { audit, shouldRun } from '../maintenance.js';

describe('maintenance', () => {
  describe('shouldRun()', () => {
    it('returns true when no last audit recorded', () => {
      assert.equal(shouldRun({ maintenance: { auto_trigger_days: 30 } }), true);
    });

    it('returns false when last audit is recent', () => {
      const today = new Date().toISOString().split('T')[0];
      assert.equal(shouldRun({ maintenance: { auto_trigger_days: 30, last_audit: today } }), false);
    });

    it('returns true when exactly at threshold boundary', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      assert.equal(shouldRun({ maintenance: { auto_trigger_days: 30, last_audit: pastDate.toISOString().split('T')[0] } }), true);
    });

    it('returns false one day before threshold', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 29);
      assert.equal(shouldRun({ maintenance: { auto_trigger_days: 30, last_audit: pastDate.toISOString().split('T')[0] } }), false);
    });
  });

  describe('audit()', () => {
    it('returns structured report with stats', () => {
      const result = audit();
      assert.ok(result.report.includes('Maintenance Report'));
      assert.ok(typeof result.stats.tracked === 'number');
      assert.ok(Array.isArray(result.actionRequired));
      assert.ok(Array.isArray(result.allClear));
    });
  });
});
