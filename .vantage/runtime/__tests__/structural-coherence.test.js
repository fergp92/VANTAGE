import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  shouldRunStructuralCheck,
  parseCanonical,
  verifyCanonicalPaths,
  detectAlternativeImplementations,
  auditPreambleMarkers,
  categorizeFinding,
  runStructuralAudit,
  generateStructuralReport,
} from '../structural-coherence.js';

const SAMPLE_CANONICAL = `# CANONICAL.md — Test Project

> One implementation per concern.

## Cross-Cutting Concerns

| Concern | Canonical Path | Owner Agent | Notes |
|---------|----------------|-------------|-------|
| Authentication | \`src/infrastructure/auth/SessionManager.ts\` | 09 | OAuth 2.1 |
| Logging | \`src/infrastructure/logging/Logger.ts\` | 22 | JSON structured |
| Error Types | \`(to be created at src/domain/errors/AppError.ts)\` | 12 | Pending |

## Divergence Log

| Date | Concern | Alternative Path | ADR | Reason |
|------|---------|------------------|-----|--------|
| 2026-01-01 | Logging | \`src/legacy/old-logger.ts\` | ADR-007 | Legacy migration |
`;

describe('structural-coherence', () => {
  // -----------------------------------------------------------------------
  // shouldRunStructuralCheck
  // -----------------------------------------------------------------------
  describe('shouldRunStructuralCheck', () => {
    it('accepts the three valid modes', () => {
      assert.equal(shouldRunStructuralCheck('pr'), true);
      assert.equal(shouldRunStructuralCheck('sprint-close'), true);
      assert.equal(shouldRunStructuralCheck('consolidation'), true);
    });

    it('rejects invalid modes', () => {
      assert.equal(shouldRunStructuralCheck('merge'), false);
      assert.equal(shouldRunStructuralCheck(''), false);
      assert.equal(shouldRunStructuralCheck(undefined), false);
    });
  });

  // -----------------------------------------------------------------------
  // parseCanonical
  // -----------------------------------------------------------------------
  describe('parseCanonical', () => {
    it('extracts concerns from the cross-cutting table', () => {
      const concerns = parseCanonical(SAMPLE_CANONICAL);
      assert.equal(concerns.length, 3);
      assert.equal(concerns[0].concern, 'Authentication');
      assert.equal(concerns[0].canonicalPath, 'src/infrastructure/auth/SessionManager.ts');
      assert.equal(concerns[0].ownerAgent, '09');
    });

    it('strips backticks from canonical paths', () => {
      const concerns = parseCanonical(SAMPLE_CANONICAL);
      for (const c of concerns) {
        assert.equal(c.canonicalPath.includes('`'), false);
      }
    });

    it('does NOT include divergence log rows', () => {
      const concerns = parseCanonical(SAMPLE_CANONICAL);
      const fromDivergence = concerns.find(c => c.canonicalPath.includes('legacy/old-logger'));
      assert.equal(fromDivergence, undefined);
    });

    it('returns empty array for empty input', () => {
      assert.deepEqual(parseCanonical(''), []);
      assert.deepEqual(parseCanonical(null), []);
    });
  });

  // -----------------------------------------------------------------------
  // verifyCanonicalPaths
  // -----------------------------------------------------------------------
  describe('verifyCanonicalPaths', () => {
    it('flags missing paths', () => {
      const concerns = [
        { concern: 'Auth', canonicalPath: 'src/auth.ts' },
        { concern: 'Log', canonicalPath: 'src/log.ts' },
      ];
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vantage-test-'));
      try {
        // Create only one of the two paths
        fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmp, 'src', 'auth.ts'), '// stub');
        const missing = verifyCanonicalPaths(concerns, tmp);
        assert.equal(missing.length, 1);
        assert.equal(missing[0].concern, 'Log');
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    });

    it('skips placeholder rows marked "to be created"', () => {
      const concerns = [
        { concern: 'Errors', canonicalPath: '(to be created at src/errors.ts)' },
      ];
      const missing = verifyCanonicalPaths(concerns, '/nonexistent');
      assert.equal(missing.length, 0);
    });
  });

  // -----------------------------------------------------------------------
  // detectAlternativeImplementations
  // -----------------------------------------------------------------------
  describe('detectAlternativeImplementations', () => {
    const concerns = [
      { concern: 'Authentication', canonicalPath: 'src/infrastructure/auth/SessionManager.ts' },
      { concern: 'Logging', canonicalPath: 'src/infrastructure/logging/Logger.ts' },
    ];

    it('flags new files matching a concern keyword that are NOT the canonical path', () => {
      const newFiles = [
        'src/features/billing/auth-helper.ts',
        'src/utils/another-logging-thing.ts',
      ];
      const findings = detectAlternativeImplementations(newFiles, concerns);
      assert.equal(findings.length, 2);
    });

    it('does NOT flag the canonical path itself', () => {
      const newFiles = ['src/infrastructure/auth/SessionManager.ts'];
      const findings = detectAlternativeImplementations(newFiles, concerns);
      assert.equal(findings.length, 0);
    });

    it('does NOT flag unrelated files', () => {
      const newFiles = ['src/domain/Order.ts', 'README.md'];
      const findings = detectAlternativeImplementations(newFiles, concerns);
      assert.equal(findings.length, 0);
    });
  });

  // -----------------------------------------------------------------------
  // auditPreambleMarkers
  // -----------------------------------------------------------------------
  describe('auditPreambleMarkers', () => {
    it('passes commits with the marker', () => {
      const commits = [
        { sha: 'aaa111', message: 'feat: add billing\n\nPreamble executed: yes' },
        { sha: 'bbb222', message: 'fix: typo\n\nPreamble executed: skipped — comment fix' },
      ];
      assert.deepEqual(auditPreambleMarkers(commits), []);
    });

    it('flags commits without the marker', () => {
      const commits = [
        { sha: 'aaa111', message: 'feat: add billing' },
        { sha: 'bbb222', message: 'fix: typo\n\nPreamble executed: yes' },
      ];
      const missing = auditPreambleMarkers(commits);
      assert.equal(missing.length, 1);
      assert.equal(missing[0].sha, 'aaa111');
      assert.equal(missing[0].subject, 'feat: add billing');
    });

    it('handles commits with no message', () => {
      const commits = [{ sha: 'ccc333', message: '' }];
      const missing = auditPreambleMarkers(commits);
      assert.equal(missing.length, 1);
    });
  });

  // -----------------------------------------------------------------------
  // categorizeFinding
  // -----------------------------------------------------------------------
  describe('categorizeFinding', () => {
    it('marks structural blockers as BLOCKER at sprint-close', () => {
      assert.equal(categorizeFinding({ type: 'missing_canonical_path' }, 'sprint-close'), 'BLOCKER');
      assert.equal(categorizeFinding({ type: 'alternative_implementation' }, 'sprint-close'), 'BLOCKER');
      assert.equal(categorizeFinding({ type: 'duplication_over_threshold' }, 'sprint-close'), 'BLOCKER');
      assert.equal(categorizeFinding({ type: 'new_dead_code' }, 'sprint-close'), 'BLOCKER');
    });

    it('downgrades blockers to WARNING in pr mode (Mode A is advisory)', () => {
      assert.equal(categorizeFinding({ type: 'alternative_implementation' }, 'pr'), 'WARNING');
    });

    it('marks missing preamble as WARNING at sprint-close, INFO at pr', () => {
      assert.equal(categorizeFinding({ type: 'missing_preamble' }, 'sprint-close'), 'WARNING');
      assert.equal(categorizeFinding({ type: 'missing_preamble' }, 'pr'), 'INFO');
    });
  });

  // -----------------------------------------------------------------------
  // runStructuralAudit (integration)
  // -----------------------------------------------------------------------
  describe('runStructuralAudit', () => {
    it('returns PASS when there are no findings at sprint-close', () => {
      const result = runStructuralAudit({
        canonicalContent: '',
        projectRoot: '/tmp',
        newFiles: [],
        commits: [],
        duplicationDeltaPct: 0,
        newDeadCode: [],
        mode: 'sprint-close',
        sprintName: 'sprint-001',
      });
      assert.equal(result.verdict, 'PASS');
      assert.equal(result.findings.length, 0);
    });

    it('returns FAIL when blockers exist at sprint-close', () => {
      const result = runStructuralAudit({
        canonicalContent: SAMPLE_CANONICAL,
        projectRoot: '/nonexistent-root',
        newFiles: ['src/billing/auth-thing.ts'],
        commits: [{ sha: 'aaa', message: 'feat: stuff' }],
        duplicationDeltaPct: 12,
        newDeadCode: ['src/dead.ts'],
        mode: 'sprint-close',
        sprintName: 'sprint-002',
      });
      assert.equal(result.verdict, 'FAIL');
      const blockers = result.findings.filter(f => f.severity === 'BLOCKER');
      assert.ok(blockers.length >= 3, `expected blockers, got ${result.findings.map(f => f.severity)}`);
    });

    it('returns PASS at pr mode even with violations (Mode A is advisory)', () => {
      const result = runStructuralAudit({
        canonicalContent: SAMPLE_CANONICAL,
        projectRoot: '/nonexistent',
        newFiles: ['src/x/auth-x.ts'],
        commits: [{ sha: 'aaa', message: 'feat: x' }],
        duplicationDeltaPct: 50,
        newDeadCode: ['src/zombie.ts'],
        mode: 'pr',
        sprintName: 'pr-test',
      });
      assert.equal(result.verdict, 'PASS', 'Mode A is non-blocking');
      assert.ok(result.findings.length > 0, 'findings still produced as advisory');
    });

    it('throws on invalid mode', () => {
      assert.throws(
        () => runStructuralAudit({
          canonicalContent: '', projectRoot: '/tmp', newFiles: [],
          commits: [], duplicationDeltaPct: 0, newDeadCode: [], mode: 'merge',
        }),
        /Invalid audit mode/,
      );
    });
  });

  // -----------------------------------------------------------------------
  // generateStructuralReport
  // -----------------------------------------------------------------------
  describe('generateStructuralReport', () => {
    it('emits a Markdown report with summary and finding sections', () => {
      const result = runStructuralAudit({
        canonicalContent: SAMPLE_CANONICAL,
        projectRoot: '/nonexistent',
        newFiles: [],
        commits: [{ sha: 'aaa', message: 'feat\n\nPreamble executed: yes' }],
        duplicationDeltaPct: 8,
        newDeadCode: ['src/orphan.ts'],
        mode: 'sprint-close',
        sprintName: 'sprint-003',
      });
      const report = generateStructuralReport({ summary: result.summary, findings: result.findings });
      assert.ok(report.includes('Verdict: FAIL'));
      assert.ok(report.includes('## [BLOCKER]'));
      assert.ok(report.includes('Sprint: sprint-003'));
    });

    it('reports clean state when no findings', () => {
      const report = generateStructuralReport({
        summary: { sprint: 's1', mode: 'sprint-close', verdict: 'PASS',
          counts: { blocker: 0, warning: 0, info: 0 },
          duplication_delta_pct: 0, new_files: 0, new_dead_code: 0, canonical_concerns: 5 },
        findings: [],
      });
      assert.ok(report.includes('No structural drift detected'));
    });
  });
});
