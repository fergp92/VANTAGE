import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeId, getDirname } from './utils.js';

const __dirname = getDirname(import.meta.url);
const REPORTS_DIR = path.join(__dirname, '..', 'memory', 'drift-reports');
const CONFIG_PATH = path.join(__dirname, '..', 'config.yml');

const DEFAULT_WEIGHTS = {
  missing_ref: 0.4,
  orphaned_spec: 0.3,
  scope_creep: 0.2,
  naming: 0.1,
};

const DEFAULT_CONFIG = {
  check_interval: 5,
  threshold: 0.3,
  auto_pause: true,
  weights: { ...DEFAULT_WEIGHTS },
};


/**
 * Load drift config from config.yml, falling back to defaults.
 * @returns {object}
 */
function loadDriftConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    // Lightweight YAML parse for drift section — avoid full yaml dep for this module
    const driftMatch = raw.match(/^drift:\s*\n((?:[ \t]+.*\n?)*)/m);
    if (!driftMatch) return { ...DEFAULT_CONFIG };

    const block = driftMatch[1];
    const getVal = (key) => {
      const m = block.match(new RegExp(`^\\s+${key}:\\s+(.+)`, 'm'));
      return m ? m[1].trim() : null;
    };

    const weightsBlock = block.match(/weights:\s*\n((?:\s{4,}.*\n?)*)/);
    const weights = { ...DEFAULT_WEIGHTS };
    if (weightsBlock) {
      for (const [key] of Object.entries(DEFAULT_WEIGHTS)) {
        const wm = weightsBlock[1].match(new RegExp(`${key}:\\s+([\\d.]+)`));
        if (wm) weights[key] = parseFloat(wm[1]);
      }
    }

    return {
      check_interval: parseInt(getVal('check_interval'), 10) || DEFAULT_CONFIG.check_interval,
      threshold: parseFloat(getVal('threshold')) || DEFAULT_CONFIG.threshold,
      auto_pause: getVal('auto_pause') !== 'false',
      weights,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Whether a drift check is due based on completed task count and interval.
 * @param {number} taskCount
 * @param {object} [config]
 * @returns {boolean}
 */
export function shouldCheck(taskCount, config) {
  const interval = config?.drift?.check_interval
    ?? config?.check_interval
    ?? DEFAULT_CONFIG.check_interval;
  return taskCount > 0 && taskCount % interval === 0;
}

/**
 * Main drift detection.
 * @param {Array<{id: string|number, title: string, specRef?: string, artifacts?: string[]}>} completedTasks
 * @param {Array<{path: string, sections: string[]}>} specRefs
 * @param {object} [options]
 * @param {string} [options.currentPhase] - current phase/sprint name for scope creep detection
 * @param {string[]} [options.allowedSpecPaths] - spec paths allowed in current phase
 * @param {RegExp|string} [options.namingPattern] - expected naming pattern for artifacts
 * @returns {{ score: number, driftedItems: Array, report: string }}
 */
export function checkDrift(completedTasks, specRefs, options = {}) {
  const cfg = loadDriftConfig();
  const weights = cfg.weights;
  const driftedItems = [];

  // --- 1. Missing spec references ---
  const missingRef = [];
  for (const task of completedTasks) {
    if (!task.specRef || task.specRef.trim() === '') {
      missingRef.push({
        type: 'missing_ref',
        taskId: task.id,
        title: task.title,
        message: `Task #${task.id}: "${task.title}" — no spec ref found`,
      });
    }
  }

  // --- 2. Orphaned specs ---
  const referencedSections = new Set();
  for (const task of completedTasks) {
    if (task.specRef) {
      referencedSections.add(task.specRef.trim());
    }
  }

  const allSpecSections = [];
  for (const spec of specRefs) {
    for (const section of spec.sections) {
      const fullRef = `${spec.path}#${section}`;
      allSpecSections.push(fullRef);
    }
  }

  const orphanedSpecs = [];
  for (const fullRef of allSpecSections) {
    // Check if any task references this spec (exact or partial match)
    const covered = completedTasks.some(t => {
      if (!t.specRef) return false;
      const ref = t.specRef.trim();
      return ref === fullRef || fullRef.startsWith(ref) || ref.startsWith(fullRef);
    });
    if (!covered) {
      orphanedSpecs.push({
        type: 'orphaned_spec',
        specRef: fullRef,
        message: `${fullRef} — no task covers this`,
      });
    }
  }

  // --- 3. Scope creep ---
  const scopeCreep = [];
  if (options.allowedSpecPaths && options.allowedSpecPaths.length > 0) {
    for (const task of completedTasks) {
      if (!task.specRef) continue;
      const refPath = task.specRef.split('#')[0];
      const allowed = options.allowedSpecPaths.some(p => refPath.startsWith(p));
      if (!allowed) {
        scopeCreep.push({
          type: 'scope_creep',
          taskId: task.id,
          title: task.title,
          specRef: task.specRef,
          message: `Task #${task.id}: references ${task.specRef} — not in current phase`,
        });
      }
    }
  }

  // --- 4. Naming drift ---
  const namingDrift = [];
  if (options.namingPattern) {
    const pattern = typeof options.namingPattern === 'string'
      ? new RegExp(options.namingPattern)
      : options.namingPattern;
    for (const task of completedTasks) {
      if (!task.artifacts || task.artifacts.length === 0) continue;
      for (const artifact of task.artifacts) {
        if (!pattern.test(artifact)) {
          namingDrift.push({
            type: 'naming',
            taskId: task.id,
            artifact,
            message: `Task #${task.id}: artifact "${artifact}" does not match naming convention`,
          });
        }
      }
    }
  }

  // --- Score calculation ---
  const totalTasks = completedTasks.length || 1;
  const totalSpecs = allSpecSections.length || 1;
  const totalArtifacts = completedTasks.reduce((n, t) => n + (t.artifacts?.length || 0), 0) || 1;

  const ratios = {
    missing_ref: missingRef.length / totalTasks,
    orphaned_spec: orphanedSpecs.length / totalSpecs,
    scope_creep: scopeCreep.length / totalTasks,
    naming: namingDrift.length / totalArtifacts,
  };

  const score = Math.min(1, Math.max(0,
    weights.missing_ref * ratios.missing_ref +
    weights.orphaned_spec * ratios.orphaned_spec +
    weights.scope_creep * ratios.scope_creep +
    weights.naming * ratios.naming
  ));

  driftedItems.push(...missingRef, ...orphanedSpecs, ...scopeCreep, ...namingDrift);

  const report = generateReport({
    score,
    driftedItems,
    missingRef,
    orphanedSpecs,
    scopeCreep,
    namingDrift,
    threshold: cfg.threshold,
    currentPhase: options.currentPhase || 'unknown',
  });

  return { score: Math.round(score * 1000) / 1000, driftedItems, report };
}

/**
 * Generate a human-readable drift report.
 * @param {object} driftResult
 * @returns {string}
 */
export function generateReport(driftResult) {
  const {
    score,
    missingRef = [],
    orphanedSpecs = [],
    scopeCreep = [],
    namingDrift = [],
    threshold = DEFAULT_CONFIG.threshold,
    currentPhase = 'unknown',
    driftedItems = [],
  } = driftResult;

  const level = score <= threshold * 0.5 ? 'OK'
    : score <= threshold ? 'WARNING'
    : 'CRITICAL';

  const recommendation = level === 'OK' ? 'CONTINUE'
    : level === 'WARNING' ? 'REVIEW'
    : 'PAUSE';

  const lines = [
    `DRIFT REPORT — Sprint: ${currentPhase}`,
    `Score: ${score.toFixed(2)} / 1.0 [${level}]`,
    '',
  ];

  if (missingRef.length > 0) {
    lines.push(`Missing Spec References (${missingRef.length} items):`);
    for (const item of missingRef) {
      lines.push(`  - ${item.message}`);
    }
    lines.push('');
  }

  if (orphanedSpecs.length > 0) {
    lines.push(`Orphaned Specs (${orphanedSpecs.length} sections):`);
    for (const item of orphanedSpecs) {
      lines.push(`  - ${item.message}`);
    }
    lines.push('');
  }

  if (scopeCreep.length > 0) {
    lines.push(`Scope Creep (${scopeCreep.length} items):`);
    for (const item of scopeCreep) {
      lines.push(`  - ${item.message}`);
    }
    lines.push('');
  }

  if (namingDrift.length > 0) {
    lines.push(`Naming Drift (${namingDrift.length} items):`);
    for (const item of namingDrift) {
      lines.push(`  - ${item.message}`);
    }
    lines.push('');
  }

  if (driftedItems.length === 0 && missingRef.length === 0 && orphanedSpecs.length === 0) {
    lines.push('No drift detected. All tasks align with specs.');
    lines.push('');
  }

  lines.push(`Recommendation: ${recommendation}`);

  return lines.join('\n');
}

/**
 * Persist a drift report to disk.
 * @param {string} report
 * @returns {string} path to saved file
 */
export function saveReport(report) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const now = new Date();
  const ts = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const filename = `drift-${ts}.md`;
  const filePath = path.join(REPORTS_DIR, sanitizeId(filename));
  fs.writeFileSync(filePath, report, 'utf-8');
  return filePath;
}

/**
 * Load the most recent drift report.
 * @returns {string|null}
 */
export function loadLatestReport() {
  if (!fs.existsSync(REPORTS_DIR)) return null;
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.startsWith('drift-') && f.endsWith('.md'))
    .sort()
    .reverse();
  if (files.length === 0) return null;
  return fs.readFileSync(path.join(REPORTS_DIR, files[0]), 'utf-8');
}

// ---------------------------------------------------------------------------
// CLI interface — guarded
// ---------------------------------------------------------------------------
const _argv1dd = process.argv[1] || '';
const _metaUrlDd = fileURLToPath(import.meta.url);
if (_argv1dd.replace(/\\/g, '/') === _metaUrlDd.replace(/\\/g, '/')) {
  const [,, command] = process.argv;
  const args = process.argv.slice(3);

  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx > -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  if (command === 'check') {
    const tasksDir = getArg('--tasks');
    const specsDir = getArg('--specs');
    const phase = getArg('--phase') || 'current';

    if (!tasksDir || !specsDir) {
      console.error('Usage: node drift-detector.js check --tasks <dir> --specs <dir> [--phase <name>]');
      process.exit(1);
    }

    // Load tasks from markdown files in tasks dir
    const tasksPath = path.resolve(tasksDir);
    const specsPath = path.resolve(specsDir);

    const tasks = [];
    if (fs.existsSync(tasksPath)) {
      for (const file of fs.readdirSync(tasksPath).filter(f => f.endsWith('.md'))) {
        const content = fs.readFileSync(path.join(tasksPath, file), 'utf-8');
        const idMatch = content.match(/^#+\s*(?:Task\s+)?#?(\S+)/m);
        const titleMatch = content.match(/title:\s*["']?(.+?)["']?\s*$/m) || content.match(/^#+\s*(.+)/m);
        const specMatch = content.match(/spec[_-]?ref:\s*["']?(.+?)["']?\s*$/m);
        const artifactMatches = content.match(/artifact:\s*["']?(.+?)["']?\s*$/gm);
        tasks.push({
          id: idMatch ? idMatch[1] : path.basename(file, '.md'),
          title: titleMatch ? titleMatch[1] : file,
          specRef: specMatch ? specMatch[1] : '',
          artifacts: artifactMatches ? artifactMatches.map(a => a.replace(/artifact:\s*["']?/, '').replace(/["']?\s*$/, '')) : [],
        });
      }
    }

    // Load spec refs
    const specs = [];
    if (fs.existsSync(specsPath)) {
      for (const file of fs.readdirSync(specsPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.md'))) {
        const content = fs.readFileSync(path.join(specsPath, file), 'utf-8');
        const sections = [];
        // Extract headings or YAML paths as sections
        const headings = content.match(/^#{1,4}\s+.+/gm) || [];
        for (const h of headings) {
          sections.push(h.replace(/^#+\s+/, '').trim());
        }
        specs.push({ path: file, sections });
      }
    }

    const result = checkDrift(tasks, specs, { currentPhase: phase });
    const saved = saveReport(result.report);
    console.log(result.report);
    console.log(`\nReport saved to: ${saved}`);
  } else if (command === 'report') {
    const latest = loadLatestReport();
    if (latest) {
      console.log(latest);
    } else {
      console.log('No drift reports found.');
    }
  } else {
    console.log('VANTAGE Drift Detector v2.1');
    console.log('');
    console.log('Commands:');
    console.log('  check   --tasks <dir> --specs <dir> [--phase <name>]');
    console.log('  report  --latest');
  }
}
