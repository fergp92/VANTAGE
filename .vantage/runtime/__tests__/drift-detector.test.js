import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkDrift, shouldCheck, generateReport } from '../drift-detector.js';

describe('drift-detector', () => {
  // -----------------------------------------------------------------------
  // checkDrift
  // -----------------------------------------------------------------------
  describe('checkDrift', () => {
    it('returns score 0 for perfect alignment', () => {
      const tasks = [
        { id: 1, title: 'Implement users endpoint', specRef: 'specs/api.yaml#/paths/users', artifacts: ['src/users.ts'] },
        { id: 2, title: 'Implement auth endpoint', specRef: 'specs/api.yaml#/paths/auth', artifacts: ['src/auth.ts'] },
      ];
      const specs = [
        { path: 'specs/api.yaml', sections: ['/paths/users', '/paths/auth'] },
      ];
      const result = checkDrift(tasks, specs);
      assert.equal(result.score, 0);
      assert.equal(result.driftedItems.length, 0);
    });

    it('detects missing spec references', () => {
      const tasks = [
        { id: 1, title: 'Implement users endpoint', specRef: 'specs/api.yaml#/paths/users', artifacts: [] },
        { id: 2, title: 'Add dark mode', specRef: '', artifacts: [] },
        { id: 3, title: 'Fix typos', artifacts: [] },
      ];
      const specs = [
        { path: 'specs/api.yaml', sections: ['/paths/users'] },
      ];
      const result = checkDrift(tasks, specs);
      assert.ok(result.score > 0);
      const missing = result.driftedItems.filter(d => d.type === 'missing_ref');
      assert.equal(missing.length, 2);
      assert.ok(missing.some(m => m.taskId === 2));
      assert.ok(missing.some(m => m.taskId === 3));
    });

    it('detects orphaned specs', () => {
      const tasks = [
        { id: 1, title: 'Implement users endpoint', specRef: 'specs/api.yaml#/paths/users', artifacts: [] },
      ];
      const specs = [
        { path: 'specs/api.yaml', sections: ['/paths/users', '/paths/auth', '/paths/admin'] },
      ];
      const result = checkDrift(tasks, specs);
      assert.ok(result.score > 0);
      const orphaned = result.driftedItems.filter(d => d.type === 'orphaned_spec');
      assert.equal(orphaned.length, 2);
    });

    it('detects scope creep when allowedSpecPaths is provided', () => {
      const tasks = [
        { id: 1, title: 'Implement v1 endpoint', specRef: 'specs/v1-api.yaml#/paths/users', artifacts: [] },
        { id: 2, title: 'Sneak in v2 work', specRef: 'specs/v2-api.yaml#/paths/beta', artifacts: [] },
      ];
      const specs = [
        { path: 'specs/v1-api.yaml', sections: ['/paths/users'] },
      ];
      const result = checkDrift(tasks, specs, { allowedSpecPaths: ['specs/v1-api.yaml'] });
      const creep = result.driftedItems.filter(d => d.type === 'scope_creep');
      assert.equal(creep.length, 1);
      assert.equal(creep[0].taskId, 2);
    });

    it('detects naming drift when namingPattern is provided', () => {
      const tasks = [
        { id: 1, title: 'Users module', specRef: 'specs/api.yaml#/paths/users', artifacts: ['src/users.controller.ts'] },
        { id: 2, title: 'Auth module', specRef: 'specs/api.yaml#/paths/auth', artifacts: ['auth-handler.js', 'utils.js'] },
      ];
      const specs = [
        { path: 'specs/api.yaml', sections: ['/paths/users', '/paths/auth'] },
      ];
      // Pattern: must end with .controller.ts or .service.ts
      const result = checkDrift(tasks, specs, { namingPattern: /\.(controller|service)\.ts$/ });
      const naming = result.driftedItems.filter(d => d.type === 'naming');
      assert.equal(naming.length, 2); // auth-handler.js and utils.js
    });

    it('clamps score between 0 and 1', () => {
      // All tasks missing refs, all specs orphaned — worst case
      const tasks = [
        { id: 1, title: 'No ref 1', artifacts: [] },
        { id: 2, title: 'No ref 2', artifacts: [] },
      ];
      const specs = [
        { path: 'specs/big.yaml', sections: ['/a', '/b', '/c', '/d', '/e'] },
      ];
      const result = checkDrift(tasks, specs);
      assert.ok(result.score <= 1);
      assert.ok(result.score >= 0);
    });

    it('returns report string in result', () => {
      const tasks = [{ id: 1, title: 'Test', specRef: 'spec.yaml#/a', artifacts: [] }];
      const specs = [{ path: 'spec.yaml', sections: ['/a'] }];
      const result = checkDrift(tasks, specs);
      assert.equal(typeof result.report, 'string');
      assert.ok(result.report.includes('DRIFT REPORT'));
    });
  });

  // -----------------------------------------------------------------------
  // shouldCheck
  // -----------------------------------------------------------------------
  describe('shouldCheck', () => {
    it('returns true when taskCount is a multiple of interval', () => {
      assert.equal(shouldCheck(5, { check_interval: 5 }), true);
      assert.equal(shouldCheck(10, { check_interval: 5 }), true);
      assert.equal(shouldCheck(15, { check_interval: 5 }), true);
    });

    it('returns false when taskCount is not a multiple of interval', () => {
      assert.equal(shouldCheck(3, { check_interval: 5 }), false);
      assert.equal(shouldCheck(7, { check_interval: 5 }), false);
    });

    it('returns false for zero tasks', () => {
      assert.equal(shouldCheck(0, { check_interval: 5 }), false);
    });

    it('uses default interval when config is absent', () => {
      // Default is 5
      assert.equal(shouldCheck(5), true);
      assert.equal(shouldCheck(3), false);
    });

    it('supports nested drift.check_interval config', () => {
      assert.equal(shouldCheck(3, { drift: { check_interval: 3 } }), true);
      assert.equal(shouldCheck(3, { drift: { check_interval: 5 } }), false);
    });
  });

  // -----------------------------------------------------------------------
  // generateReport
  // -----------------------------------------------------------------------
  describe('generateReport', () => {
    it('produces OK level and CONTINUE recommendation for low score', () => {
      const report = generateReport({ score: 0.05, threshold: 0.3, currentPhase: 'sprint-1' });
      assert.ok(report.includes('[OK]'));
      assert.ok(report.includes('Recommendation: CONTINUE'));
      assert.ok(report.includes('Sprint: sprint-1'));
    });

    it('produces WARNING level and REVIEW recommendation near threshold', () => {
      const report = generateReport({ score: 0.25, threshold: 0.3, currentPhase: 'sprint-2' });
      assert.ok(report.includes('[WARNING]'));
      assert.ok(report.includes('Recommendation: REVIEW'));
    });

    it('produces CRITICAL level and PAUSE recommendation above threshold', () => {
      const report = generateReport({ score: 0.6, threshold: 0.3, currentPhase: 'sprint-3' });
      assert.ok(report.includes('[CRITICAL]'));
      assert.ok(report.includes('Recommendation: PAUSE'));
    });

    it('includes missing ref items in report', () => {
      const report = generateReport({
        score: 0.4,
        threshold: 0.3,
        missingRef: [{ message: 'Task #42: "Add dark mode" — no spec ref found' }],
        currentPhase: 'sprint-1',
      });
      assert.ok(report.includes('Missing Spec References (1 items)'));
      assert.ok(report.includes('Task #42'));
    });

    it('includes orphaned specs in report', () => {
      const report = generateReport({
        score: 0.3,
        threshold: 0.3,
        orphanedSpecs: [{ message: 'specs/openapi.yaml#/paths/~1users — no task covers this' }],
        currentPhase: 'sprint-1',
      });
      assert.ok(report.includes('Orphaned Specs (1 sections)'));
      assert.ok(report.includes('specs/openapi.yaml'));
    });

    it('includes scope creep items in report', () => {
      const report = generateReport({
        score: 0.2,
        threshold: 0.3,
        scopeCreep: [{ message: 'Task #55: references specs/v2-api.yaml — not in current phase' }],
        currentPhase: 'sprint-1',
      });
      assert.ok(report.includes('Scope Creep (1 items)'));
      assert.ok(report.includes('Task #55'));
    });

    it('shows score formatted to 2 decimal places', () => {
      const report = generateReport({ score: 0.123, threshold: 0.3, currentPhase: 'test' });
      assert.ok(report.includes('Score: 0.12'));
    });
  });
});
