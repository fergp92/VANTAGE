import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Parallel Sprint Dispatcher — VANTAGE v2.1
//
// Analyses sprint task dependencies, builds execution waves for concurrent
// agent dispatch, and detects file-level conflicts after parallel runs.
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG = {
  parallel: {
    enabled: true,
    max_concurrent: 4,
    isolation: 'worktree',
    conflict_strategy: 'flag',
  },
};

// ---------------------------------------------------------------------------
// buildDependencyGraph
// ---------------------------------------------------------------------------

/**
 * Build a dependency graph from a list of sprint tasks.
 *
 * @param {Array<{id: string|number, title: string, depends_on?: Array<string|number>, assignee?: string, specRef?: string}>} tasks
 * @returns {{ graph: Map<string|number, Set<string|number>>, roots: Array<string|number>, levels: Array<Array<string|number>> }}
 */
export function buildDependencyGraph(tasks) {
  // adjacency list: id → set of dependencies (upstream ids)
  const graph = new Map();
  const idSet = new Set();

  for (const task of tasks) {
    idSet.add(task.id);
    graph.set(task.id, new Set(task.depends_on ?? []));
  }

  // Validate that all dependencies reference known task ids
  for (const [id, deps] of graph) {
    for (const dep of deps) {
      if (!idSet.has(dep)) {
        throw new Error(`Task "${id}" depends on unknown task "${dep}"`);
      }
    }
  }

  // --- Cycle detection + topological level sort (Kahn's algorithm) ---

  // in-degree: how many deps each task still has unresolved
  const inDegree = new Map();
  // reverse adjacency: dep → set of tasks that depend on it
  const reverse = new Map();

  for (const id of idSet) {
    inDegree.set(id, 0);
    reverse.set(id, new Set());
  }

  for (const [id, deps] of graph) {
    inDegree.set(id, deps.size);
    for (const dep of deps) {
      reverse.get(dep).add(id);
    }
  }

  // Seeds: tasks with no dependencies
  let queue = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const roots = [...queue];
  const levels = [];
  let visited = 0;

  while (queue.length > 0) {
    levels.push([...queue]);
    visited += queue.length;

    const nextQueue = [];
    for (const id of queue) {
      for (const downstream of reverse.get(id)) {
        const newDeg = inDegree.get(downstream) - 1;
        inDegree.set(downstream, newDeg);
        if (newDeg === 0) {
          nextQueue.push(downstream);
        }
      }
    }
    queue = nextQueue;
  }

  if (visited < idSet.size) {
    // Remaining nodes with inDegree > 0 form cycle(s)
    const cycleNodes = [];
    for (const [id, deg] of inDegree) {
      if (deg > 0) cycleNodes.push(id);
    }
    throw new CycleError(cycleNodes);
  }

  return { graph, roots, levels };
}

// ---------------------------------------------------------------------------
// CycleError
// ---------------------------------------------------------------------------

export class CycleError extends Error {
  /** @param {Array<string|number>} nodes */
  constructor(nodes) {
    super(`Dependency cycle detected among tasks: ${nodes.join(', ')}`);
    this.name = 'CycleError';
    this.nodes = nodes;
  }
}

// ---------------------------------------------------------------------------
// planParallelExecution
// ---------------------------------------------------------------------------

/**
 * Create a wave-based execution plan respecting max concurrency.
 *
 * @param {Array<{id: string|number, title: string, depends_on?: Array<string|number>, assignee?: string, specRef?: string}>} tasks
 * @param {object} [config]
 * @returns {{ waves: Array<{tasks: Array<string|number>, concurrent: boolean}>, totalWaves: number, estimatedSpeedup: number }}
 */
export function planParallelExecution(tasks, config) {
  const maxConcurrent = config?.parallel?.max_concurrent
    ?? config?.max_concurrent
    ?? DEFAULT_CONFIG.parallel.max_concurrent;

  const { levels } = buildDependencyGraph(tasks);
  const waves = [];

  for (const level of levels) {
    if (level.length <= maxConcurrent) {
      waves.push({ tasks: [...level], concurrent: level.length > 1 });
    } else {
      // Split into sub-waves
      for (let i = 0; i < level.length; i += maxConcurrent) {
        const chunk = level.slice(i, i + maxConcurrent);
        waves.push({ tasks: chunk, concurrent: chunk.length > 1 });
      }
    }
  }

  const totalWaves = waves.length;
  const totalTasks = tasks.length;
  const estimatedSpeedup = totalTasks > 0 && totalWaves > 0
    ? Math.round((totalTasks / totalWaves) * 100) / 100
    : 1;

  return { waves, totalWaves, estimatedSpeedup };
}

// ---------------------------------------------------------------------------
// detectConflicts
// ---------------------------------------------------------------------------

/**
 * Detect file-level conflicts after parallel task execution.
 *
 * @param {Array<{taskId: string|number, files_modified: string[]}>} results
 * @returns {{ hasConflicts: boolean, conflicts: Array<{file: string, tasks: Array<string|number>}> }}
 */
export function detectConflicts(results) {
  /** @type {Map<string, Array<string|number>>} */
  const fileMap = new Map();

  for (const result of results) {
    for (const file of result.files_modified) {
      if (!fileMap.has(file)) {
        fileMap.set(file, []);
      }
      fileMap.get(file).push(result.taskId);
    }
  }

  const conflicts = [];
  for (const [file, tasks] of fileMap) {
    if (tasks.length > 1) {
      conflicts.push({ file, tasks });
    }
  }

  return { hasConflicts: conflicts.length > 0, conflicts };
}

// ---------------------------------------------------------------------------
// formatPlan
// ---------------------------------------------------------------------------

/**
 * Human-readable execution plan.
 *
 * @param {{ waves: Array<{tasks: Array<string|number>, concurrent: boolean}>, totalWaves: number, estimatedSpeedup: number }} plan
 * @returns {string}
 */
export function formatPlan(plan) {
  const lines = [
    'PARALLEL EXECUTION PLAN',
    `Total waves: ${plan.totalWaves}`,
    `Estimated speedup: ${plan.estimatedSpeedup}x`,
    '',
  ];

  for (let i = 0; i < plan.waves.length; i++) {
    const wave = plan.waves[i];
    const mode = wave.concurrent ? 'PARALLEL' : 'SEQUENTIAL';
    lines.push(`Wave ${i + 1} [${mode}]: ${wave.tasks.join(', ')}`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI interface — guarded
// ---------------------------------------------------------------------------
const _argv1 = process.argv[1] || '';
const _metaUrl = fileURLToPath(import.meta.url);
if (_argv1.replace(/\\/g, '/') === _metaUrl.replace(/\\/g, '/')) {
  const [,, command] = process.argv;

  if (command === 'demo') {
    const tasks = [
      { id: 'A', title: 'Domain entities', depends_on: [] },
      { id: 'B', title: 'App services', depends_on: ['A'] },
      { id: 'C', title: 'Adapters', depends_on: ['A'] },
      { id: 'D', title: 'Frontend arch', depends_on: [] },
      { id: 'E', title: 'UI components', depends_on: ['D'] },
      { id: 'F', title: 'Integration', depends_on: ['B', 'C', 'E'] },
    ];
    const plan = planParallelExecution(tasks);
    console.log(formatPlan(plan));
  } else {
    console.log('VANTAGE Parallel Dispatcher v2.1');
    console.log('');
    console.log('Commands:');
    console.log('  demo    Run a sample dependency graph');
  }
}
