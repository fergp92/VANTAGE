import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDependencyGraph,
  planParallelExecution,
  detectConflicts,
  formatPlan,
  CycleError,
} from '../parallel-dispatcher.js';

describe('parallel-dispatcher', () => {
  // -----------------------------------------------------------------------
  // buildDependencyGraph
  // -----------------------------------------------------------------------
  describe('buildDependencyGraph', () => {
    it('places independent tasks in a single level', () => {
      const tasks = [
        { id: 'A', title: 'Task A', depends_on: [] },
        { id: 'B', title: 'Task B', depends_on: [] },
        { id: 'C', title: 'Task C', depends_on: [] },
      ];
      const { levels, roots } = buildDependencyGraph(tasks);
      assert.equal(levels.length, 1);
      assert.deepEqual(levels[0].sort(), ['A', 'B', 'C']);
      assert.deepEqual(roots.sort(), ['A', 'B', 'C']);
    });

    it('builds linear chain into sequential levels', () => {
      const tasks = [
        { id: 'A', title: 'Task A', depends_on: [] },
        { id: 'B', title: 'Task B', depends_on: ['A'] },
        { id: 'C', title: 'Task C', depends_on: ['B'] },
      ];
      const { levels, roots } = buildDependencyGraph(tasks);
      assert.equal(levels.length, 3);
      assert.deepEqual(levels[0], ['A']);
      assert.deepEqual(levels[1], ['B']);
      assert.deepEqual(levels[2], ['C']);
      assert.deepEqual(roots, ['A']);
    });

    it('handles mixed dependencies with correct levels', () => {
      const tasks = [
        { id: 'A', title: 'A', depends_on: [] },
        { id: 'B', title: 'B', depends_on: ['A'] },
        { id: 'C', title: 'C', depends_on: ['A'] },
        { id: 'D', title: 'D', depends_on: [] },
        { id: 'E', title: 'E', depends_on: ['D'] },
        { id: 'F', title: 'F', depends_on: ['B', 'C', 'E'] },
      ];
      const { levels } = buildDependencyGraph(tasks);
      // Level 0: A, D (no deps)
      // Level 1: B, C, E (depend on level-0 tasks)
      // Level 2: F (depends on level-1 tasks)
      assert.equal(levels.length, 3);
      assert.deepEqual(levels[0].sort(), ['A', 'D']);
      assert.deepEqual(levels[1].sort(), ['B', 'C', 'E']);
      assert.deepEqual(levels[2], ['F']);
    });

    it('detects cycles and throws CycleError', () => {
      const tasks = [
        { id: 'A', title: 'A', depends_on: ['C'] },
        { id: 'B', title: 'B', depends_on: ['A'] },
        { id: 'C', title: 'C', depends_on: ['B'] },
      ];
      assert.throws(
        () => buildDependencyGraph(tasks),
        (err) => {
          assert.ok(err instanceof CycleError);
          assert.ok(err.nodes.length > 0);
          return true;
        },
      );
    });

    it('throws on unknown dependency reference', () => {
      const tasks = [
        { id: 'A', title: 'A', depends_on: ['Z'] },
      ];
      assert.throws(
        () => buildDependencyGraph(tasks),
        /unknown task "Z"/,
      );
    });

    it('handles tasks with no depends_on field', () => {
      const tasks = [
        { id: 'A', title: 'A' },
        { id: 'B', title: 'B' },
      ];
      const { levels } = buildDependencyGraph(tasks);
      assert.equal(levels.length, 1);
      assert.equal(levels[0].length, 2);
    });
  });

  // -----------------------------------------------------------------------
  // planParallelExecution
  // -----------------------------------------------------------------------
  describe('planParallelExecution', () => {
    it('produces 3 sequential waves for a linear chain', () => {
      const tasks = [
        { id: 'A', title: 'A', depends_on: [] },
        { id: 'B', title: 'B', depends_on: ['A'] },
        { id: 'C', title: 'C', depends_on: ['B'] },
      ];
      const plan = planParallelExecution(tasks);
      assert.equal(plan.totalWaves, 3);
      assert.deepEqual(plan.waves[0].tasks, ['A']);
      assert.equal(plan.waves[0].concurrent, false);
      assert.deepEqual(plan.waves[1].tasks, ['B']);
      assert.deepEqual(plan.waves[2].tasks, ['C']);
    });

    it('produces 1 wave for fully independent tasks', () => {
      const tasks = [
        { id: 'A', title: 'A', depends_on: [] },
        { id: 'B', title: 'B', depends_on: [] },
        { id: 'C', title: 'C', depends_on: [] },
      ];
      const plan = planParallelExecution(tasks);
      assert.equal(plan.totalWaves, 1);
      assert.deepEqual(plan.waves[0].tasks.sort(), ['A', 'B', 'C']);
      assert.equal(plan.waves[0].concurrent, true);
    });

    it('splits large levels into sub-waves respecting max_concurrent', () => {
      const tasks = [
        { id: 'A', title: 'A', depends_on: [] },
        { id: 'B', title: 'B', depends_on: [] },
        { id: 'C', title: 'C', depends_on: [] },
        { id: 'D', title: 'D', depends_on: [] },
        { id: 'E', title: 'E', depends_on: [] },
        { id: 'F', title: 'F', depends_on: [] },
      ];
      const plan = planParallelExecution(tasks, { parallel: { max_concurrent: 2 } });
      // 6 tasks, max 2 concurrent → 3 waves
      assert.equal(plan.totalWaves, 3);
      for (const wave of plan.waves) {
        assert.ok(wave.tasks.length <= 2);
        assert.equal(wave.concurrent, true);
      }
    });

    it('calculates estimated speedup', () => {
      const tasks = [
        { id: 'A', title: 'A', depends_on: [] },
        { id: 'B', title: 'B', depends_on: [] },
        { id: 'C', title: 'C', depends_on: [] },
        { id: 'D', title: 'D', depends_on: [] },
      ];
      const plan = planParallelExecution(tasks, { parallel: { max_concurrent: 4 } });
      // 4 tasks in 1 wave → speedup = 4
      assert.equal(plan.estimatedSpeedup, 4);
    });

    it('uses default max_concurrent when config is absent', () => {
      const tasks = [
        { id: 'A', title: 'A', depends_on: [] },
        { id: 'B', title: 'B', depends_on: [] },
        { id: 'C', title: 'C', depends_on: [] },
        { id: 'D', title: 'D', depends_on: [] },
        { id: 'E', title: 'E', depends_on: [] },
      ];
      // Default max_concurrent is 4 → 5 tasks = 2 waves (4+1)
      const plan = planParallelExecution(tasks);
      assert.equal(plan.totalWaves, 2);
    });

    it('handles mixed dependencies producing correct levels', () => {
      const tasks = [
        { id: 'A', title: 'A', depends_on: [] },
        { id: 'B', title: 'B', depends_on: ['A'] },
        { id: 'C', title: 'C', depends_on: ['A'] },
        { id: 'D', title: 'D', depends_on: [] },
        { id: 'E', title: 'E', depends_on: ['D'] },
        { id: 'F', title: 'F', depends_on: ['B', 'C', 'E'] },
      ];
      const plan = planParallelExecution(tasks, { parallel: { max_concurrent: 4 } });
      // Level 0: A,D  Level 1: B,C,E  Level 2: F → 3 waves
      assert.equal(plan.totalWaves, 3);
      assert.deepEqual(plan.waves[0].tasks.sort(), ['A', 'D']);
      assert.deepEqual(plan.waves[1].tasks.sort(), ['B', 'C', 'E']);
      assert.deepEqual(plan.waves[2].tasks, ['F']);
    });
  });

  // -----------------------------------------------------------------------
  // detectConflicts
  // -----------------------------------------------------------------------
  describe('detectConflicts', () => {
    it('finds conflicts when tasks modify the same file', () => {
      const results = [
        { taskId: 'A', files_modified: ['src/index.ts', 'src/utils.ts'] },
        { taskId: 'B', files_modified: ['src/index.ts', 'src/auth.ts'] },
      ];
      const { hasConflicts, conflicts } = detectConflicts(results);
      assert.equal(hasConflicts, true);
      assert.equal(conflicts.length, 1);
      assert.equal(conflicts[0].file, 'src/index.ts');
      assert.deepEqual(conflicts[0].tasks, ['A', 'B']);
    });

    it('returns no conflicts when files do not overlap', () => {
      const results = [
        { taskId: 'A', files_modified: ['src/users.ts'] },
        { taskId: 'B', files_modified: ['src/auth.ts'] },
        { taskId: 'C', files_modified: ['src/admin.ts'] },
      ];
      const { hasConflicts, conflicts } = detectConflicts(results);
      assert.equal(hasConflicts, false);
      assert.equal(conflicts.length, 0);
    });

    it('detects multiple conflicts across multiple files', () => {
      const results = [
        { taskId: 'A', files_modified: ['shared.ts', 'config.ts'] },
        { taskId: 'B', files_modified: ['shared.ts', 'config.ts'] },
        { taskId: 'C', files_modified: ['config.ts'] },
      ];
      const { hasConflicts, conflicts } = detectConflicts(results);
      assert.equal(hasConflicts, true);
      assert.equal(conflicts.length, 2);
      const sharedConflict = conflicts.find(c => c.file === 'shared.ts');
      const configConflict = conflicts.find(c => c.file === 'config.ts');
      assert.deepEqual(sharedConflict.tasks, ['A', 'B']);
      assert.deepEqual(configConflict.tasks, ['A', 'B', 'C']);
    });

    it('handles empty results gracefully', () => {
      const { hasConflicts, conflicts } = detectConflicts([]);
      assert.equal(hasConflicts, false);
      assert.equal(conflicts.length, 0);
    });

    it('handles tasks with empty files_modified', () => {
      const results = [
        { taskId: 'A', files_modified: [] },
        { taskId: 'B', files_modified: [] },
      ];
      const { hasConflicts, conflicts } = detectConflicts(results);
      assert.equal(hasConflicts, false);
      assert.equal(conflicts.length, 0);
    });
  });

  // -----------------------------------------------------------------------
  // formatPlan
  // -----------------------------------------------------------------------
  describe('formatPlan', () => {
    it('produces readable output with wave details', () => {
      const plan = {
        waves: [
          { tasks: ['A', 'D'], concurrent: true },
          { tasks: ['B', 'C', 'E'], concurrent: true },
          { tasks: ['F'], concurrent: false },
        ],
        totalWaves: 3,
        estimatedSpeedup: 2,
      };
      const output = formatPlan(plan);
      assert.ok(output.includes('PARALLEL EXECUTION PLAN'));
      assert.ok(output.includes('Total waves: 3'));
      assert.ok(output.includes('Estimated speedup: 2x'));
      assert.ok(output.includes('Wave 1 [PARALLEL]: A, D'));
      assert.ok(output.includes('Wave 2 [PARALLEL]: B, C, E'));
      assert.ok(output.includes('Wave 3 [SEQUENTIAL]: F'));
    });
  });
});
