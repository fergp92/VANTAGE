import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeId, getDirname } from './utils.js';

const __dirname = getDirname(import.meta.url);
const REPORTS_DIR = path.join(__dirname, '..', 'memory', 'drift-reports');
const CONFIG_PATH = path.join(__dirname, '..', 'config.yml');

const DEFAULT_CONFIG = {
  duplication_threshold_pct: 5,
  dead_code_block_new: true,
  preamble_marker_required: true,
  reports_dir: REPORTS_DIR,
};

const VALID_MODES = new Set(['pr', 'sprint-close', 'consolidation']);

/**
 * Load structural config from .vantage/config.yml `structural:` section,
 * falling back to defaults. Mirrors loadDriftConfig style in drift-detector.js.
 * @returns {object}
 */
function loadStructuralConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const match = raw.match(/^structural:\s*\n((?:[ \t]+.*\n?)*)/m);
    if (!match) return { ...DEFAULT_CONFIG };

    const block = match[1];
    const getVal = (key) => {
      const m = block.match(new RegExp(`^\\s+${key}:\\s+(.+)`, 'm'));
      return m ? m[1].trim() : null;
    };

    return {
      duplication_threshold_pct: parseFloat(getVal('duplication_threshold_pct'))
        || DEFAULT_CONFIG.duplication_threshold_pct,
      dead_code_block_new: getVal('dead_code_block_new') !== 'false',
      preamble_marker_required: getVal('preamble_marker_required') !== 'false',
      reports_dir: DEFAULT_CONFIG.reports_dir,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Decide whether a structural audit should run for a given trigger.
 * - 'pr':            Mode A advisory, always runs on PR events
 * - 'sprint-close':  Mode B blocking (Gate G3.5), always runs at sprint close
 * - 'consolidation': Mode C, runs once when a Consolidation Sprint opens
 * @param {string} trigger
 * @returns {boolean}
 */
export function shouldRunStructuralCheck(trigger) {
  return VALID_MODES.has(trigger);
}

/**
 * Parse CANONICAL.md content into a structured list of concerns.
 *
 * Expected table format (anywhere in the file):
 *   | Concern | Canonical Path | Owner Agent | Notes |
 *   |---|---|---|---|
 *   | Authentication | `src/.../SessionManager.ts` | 09 | ... |
 *
 * @param {string} content - raw CANONICAL.md text
 * @returns {Array<{concern: string, canonicalPath: string, ownerAgent: string, notes: string}>}
 */
export function parseCanonical(content) {
  if (!content) return [];

  const lines = content.split(/\r?\n/);
  const concerns = [];
  let inTable = false;
  let inDivergenceLog = false;

  for (const line of lines) {
    // Detect Divergence Log section heading; after it we stop collecting concerns
    if (/^##\s+Divergence Log/i.test(line)) {
      inDivergenceLog = true;
      inTable = false;
      continue;
    }

    if (inDivergenceLog) continue;

    // Header line of the concerns table
    if (/^\|\s*Concern\s*\|\s*Canonical Path\s*\|/i.test(line)) {
      inTable = true;
      continue;
    }

    // Separator line | --- | --- |
    if (inTable && /^\|\s*-+\s*\|/.test(line)) continue;

    // Empty line ends the table
    if (inTable && line.trim() === '') {
      inTable = false;
      continue;
    }

    if (inTable && line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.length < 2) continue;
      const [concern, canonicalPath, ownerAgent = '', notes = ''] = cells;
      // Skip placeholder rows: empty concern or boilerplate
      if (!concern || concern.startsWith('(') || concern.startsWith('>')) continue;
      // Strip backticks from path
      const cleanPath = canonicalPath.replace(/`/g, '').trim();
      concerns.push({ concern, canonicalPath: cleanPath, ownerAgent, notes });
    }
  }

  return concerns;
}

/**
 * For each canonical path, verify the file exists (or is explicitly marked
 * as "to be created"). Returns the list of missing paths (those that should
 * exist but do not).
 *
 * @param {Array<{canonicalPath: string}>} concerns
 * @param {string} projectRoot
 * @returns {Array<{concern: string, canonicalPath: string}>}
 */
export function verifyCanonicalPaths(concerns, projectRoot) {
  const missing = [];
  for (const c of concerns) {
    const p = c.canonicalPath;
    // Skip placeholders explicitly marked
    if (/^\(to be created/i.test(p) || p === '') continue;
    const fullPath = path.isAbsolute(p) ? p : path.join(projectRoot, p);
    if (!fs.existsSync(fullPath)) {
      missing.push({ concern: c.concern, canonicalPath: p });
    }
  }
  return missing;
}

// Generic path components that are not concern-specific. Used to filter
// out false positives when deriving keywords from canonical paths.
const GENERIC_PATH_PARTS = new Set([
  'src', 'lib', 'app', 'core', 'utils', 'common', 'shared', 'helpers',
  'infrastructure', 'application', 'domain', 'adapters', 'features',
  'modules', 'packages', 'public', 'private', 'internal',
]);

/**
 * Derive matching keywords for a concern from its name AND its canonical path.
 *
 * Rationale: real codebases abbreviate. "Authentication" is `src/.../auth/...`,
 * "Authorization" is `.../authz/...`. Matching only on the full concern name
 * misses the file naming most teams actually use. So we ALSO derive a keyword
 * from the deepest non-generic directory in the canonical path.
 *
 * @param {{concern: string, canonicalPath: string}} c
 * @returns {string[]}
 */
function deriveKeywords(c) {
  const set = new Set();
  const fromConcern = (c.concern || '').toLowerCase().replace(/[^a-z]/g, '');
  if (fromConcern.length >= 3) set.add(fromConcern);

  if (c.canonicalPath) {
    const parts = c.canonicalPath.toLowerCase().split(/[\/\\]/).filter(Boolean);
    // Take deepest directory (the one immediately above the file). Skip generic ones.
    if (parts.length >= 2) {
      for (let i = parts.length - 2; i >= 0; i--) {
        const cleaned = parts[i].replace(/[^a-z]/g, '');
        if (cleaned.length >= 3 && !GENERIC_PATH_PARTS.has(cleaned)) {
          set.add(cleaned);
          break;
        }
      }
    }
  }
  return [...set];
}

/**
 * Audit a list of newly-introduced files against CANONICAL.md.
 * A new file is "unjustified" if:
 *  (a) its filename matches a concern keyword (concern name OR deepest canonical
 *      path component) AND
 *  (b) the file is NOT the declared canonical path AND
 *  (c) the file is NOT in the Divergence Log
 *
 * @param {string[]} newFiles - files added in the PR or sprint
 * @param {Array<{concern: string, canonicalPath: string}>} concerns
 * @returns {Array<{file: string, concern: string, canonicalPath: string, matchedKeyword: string}>}
 */
export function detectAlternativeImplementations(newFiles, concerns) {
  const findings = [];
  for (const file of newFiles) {
    const lowerFile = file.toLowerCase();
    for (const c of concerns) {
      const canonical = (c.canonicalPath || '').toLowerCase();
      // Skip placeholder canonicals
      if (!canonical || canonical.startsWith('(')) continue;
      // Skip if this IS the canonical path
      if (lowerFile.endsWith(canonical) || canonical.endsWith(lowerFile)) continue;

      const keywords = deriveKeywords(c);
      const matched = keywords.find(k => lowerFile.includes(k));
      if (!matched) continue;

      findings.push({
        file,
        concern: c.concern,
        canonicalPath: c.canonicalPath,
        matchedKeyword: matched,
      });
    }
  }
  return findings;
}

/**
 * Audit commit messages for the forced-context preamble marker.
 * @param {Array<{sha: string, message: string}>} commits
 * @returns {Array<{sha: string, subject: string}>} commits missing the marker
 */
export function auditPreambleMarkers(commits) {
  const missing = [];
  for (const c of commits) {
    if (!c.message) {
      missing.push({ sha: c.sha, subject: '(no message)' });
      continue;
    }
    if (!/^Preamble executed:\s*(yes|skipped)/m.test(c.message)) {
      const subject = c.message.split('\n')[0] || '(no subject)';
      missing.push({ sha: c.sha, subject });
    }
  }
  return missing;
}

/**
 * Categorize a finding into [BLOCKER] | [WARNING] | [INFO] based on type and mode.
 * @param {object} finding
 * @param {string} mode - 'pr' | 'sprint-close' | 'consolidation'
 * @returns {string}
 */
export function categorizeFinding(finding, mode) {
  const type = finding.type;
  // sprint-close mode: tighter rules (Gate G3.5 is blocking)
  if (mode === 'sprint-close') {
    if (type === 'missing_canonical_path') return 'BLOCKER';
    if (type === 'alternative_implementation') return 'BLOCKER';
    if (type === 'duplication_over_threshold') return 'BLOCKER';
    if (type === 'new_dead_code') return 'BLOCKER';
    if (type === 'missing_preamble') return 'WARNING';
    return 'INFO';
  }
  // pr mode: same severity but ALL findings are advisory at runtime
  return mode === 'pr'
    ? (type === 'missing_preamble' ? 'INFO' : 'WARNING')
    : 'INFO';
}

/**
 * Run the structural audit. Pure-logic entry point: callers (CI hooks, agent
 * runners) supply the raw inputs and persist the report themselves via
 * saveStructuralReport.
 *
 * @param {object} input
 * @param {string} input.canonicalContent - raw CANONICAL.md text
 * @param {string} input.projectRoot - absolute path to project root
 * @param {string[]} input.newFiles - files added in this PR/sprint
 * @param {Array<{sha:string, message:string}>} input.commits - commits in this PR/sprint
 * @param {number} input.duplicationDeltaPct - % new duplication vs baseline (caller computes via jscpd)
 * @param {string[]} input.newDeadCode - orphan exports / unused files newly introduced
 * @param {string} input.mode - 'pr' | 'sprint-close' | 'consolidation'
 * @param {string} [input.sprintName]
 * @param {object} [input.config]
 * @returns {{ verdict: 'PASS'|'FAIL', findings: Array, summary: object, report: string }}
 */
export function runStructuralAudit(input) {
  const cfg = { ...DEFAULT_CONFIG, ...loadStructuralConfig(), ...(input.config || {}) };
  const mode = input.mode || 'pr';
  if (!shouldRunStructuralCheck(mode)) {
    throw new Error(`Invalid audit mode: ${mode}. Expected one of ${[...VALID_MODES].join(', ')}`);
  }

  const concerns = parseCanonical(input.canonicalContent || '');
  const findings = [];

  // 1. Missing canonical paths
  const missing = verifyCanonicalPaths(concerns, input.projectRoot || '.');
  for (const m of missing) {
    findings.push({
      type: 'missing_canonical_path',
      concern: m.concern,
      canonicalPath: m.canonicalPath,
      message: `Canonical path declared in CANONICAL.md does not exist: ${m.canonicalPath}`,
    });
  }

  // 2. Alternative implementations
  const alternatives = detectAlternativeImplementations(input.newFiles || [], concerns);
  for (const a of alternatives) {
    findings.push({
      type: 'alternative_implementation',
      concern: a.concern,
      file: a.file,
      canonicalPath: a.canonicalPath,
      message: `New file ${a.file} appears to implement "${a.concern}" but is not the canonical path ${a.canonicalPath}`,
    });
  }

  // 3. Duplication threshold
  const dupDelta = typeof input.duplicationDeltaPct === 'number' ? input.duplicationDeltaPct : 0;
  if (dupDelta > cfg.duplication_threshold_pct) {
    findings.push({
      type: 'duplication_over_threshold',
      delta: dupDelta,
      threshold: cfg.duplication_threshold_pct,
      message: `Duplication delta ${dupDelta}% exceeds threshold ${cfg.duplication_threshold_pct}%`,
    });
  }

  // 4. New dead code
  if (cfg.dead_code_block_new && Array.isArray(input.newDeadCode) && input.newDeadCode.length > 0) {
    findings.push({
      type: 'new_dead_code',
      items: input.newDeadCode,
      message: `${input.newDeadCode.length} newly-introduced orphan export(s) or unused file(s)`,
    });
  }

  // 5. Preamble markers
  if (cfg.preamble_marker_required) {
    const missingPreamble = auditPreambleMarkers(input.commits || []);
    for (const c of missingPreamble) {
      findings.push({
        type: 'missing_preamble',
        sha: c.sha,
        subject: c.subject,
        message: `Commit ${c.sha?.slice(0, 8)} missing "Preamble executed:" marker -- ${c.subject}`,
      });
    }
  }

  // Categorize and decide verdict
  for (const f of findings) {
    f.severity = categorizeFinding(f, mode);
  }

  const blockers = findings.filter(f => f.severity === 'BLOCKER');
  const verdict = (mode === 'sprint-close' && blockers.length > 0) ? 'FAIL' : 'PASS';

  const summary = {
    sprint: input.sprintName || 'unnamed',
    mode,
    verdict,
    counts: {
      blocker: findings.filter(f => f.severity === 'BLOCKER').length,
      warning: findings.filter(f => f.severity === 'WARNING').length,
      info: findings.filter(f => f.severity === 'INFO').length,
    },
    duplication_delta_pct: dupDelta,
    new_files: (input.newFiles || []).length,
    new_dead_code: (input.newDeadCode || []).length,
    canonical_concerns: concerns.length,
  };

  const report = generateStructuralReport({ summary, findings });

  return { verdict, findings, summary, report };
}

/**
 * Generate a human-readable Markdown report.
 * @param {{summary: object, findings: Array}} result
 * @returns {string}
 */
export function generateStructuralReport(result) {
  const { summary, findings } = result;
  const lines = [];
  lines.push(`# Structural Drift Report -- Sprint: ${summary.sprint}`);
  lines.push(`Mode: ${summary.mode}`);
  lines.push(`Verdict: ${summary.verdict}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Blockers: ${summary.counts.blocker}`);
  lines.push(`- Warnings: ${summary.counts.warning}`);
  lines.push(`- Info: ${summary.counts.info}`);
  lines.push(`- Duplication delta: ${summary.duplication_delta_pct}%`);
  lines.push(`- New files: ${summary.new_files}`);
  lines.push(`- New dead code items: ${summary.new_dead_code}`);
  lines.push(`- Canonical concerns tracked: ${summary.canonical_concerns}`);
  lines.push('');

  for (const sev of ['BLOCKER', 'WARNING', 'INFO']) {
    const subset = findings.filter(f => f.severity === sev);
    if (subset.length === 0) continue;
    lines.push(`## [${sev}] (${subset.length})`);
    for (const f of subset) {
      lines.push(`- ${f.message}`);
    }
    lines.push('');
  }

  if (findings.length === 0) {
    lines.push('No structural drift detected.');
  }

  return lines.join('\n');
}

/**
 * Persist a structural report to disk under .vantage/memory/drift-reports/.
 * Uses the sanitized sprint name in the filename to keep them grouped with
 * the spec-drift reports produced by drift-detector.js but distinguishable
 * by the `structural-` prefix.
 *
 * @param {string} report
 * @param {string} sprintName
 * @returns {string} path to saved file
 */
export function saveStructuralReport(report, sprintName = 'unnamed') {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const filename = `structural-${sanitizeId(sprintName)}-${ts}.md`;
  const filePath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filePath, report, 'utf-8');
  return filePath;
}

// ---------------------------------------------------------------------------
// CLI interface — guarded
// ---------------------------------------------------------------------------
const _argv1sc = process.argv[1] || '';
const _metaUrlSc = fileURLToPath(import.meta.url);
if (_argv1sc.replace(/\\/g, '/') === _metaUrlSc.replace(/\\/g, '/')) {
  const [,, command] = process.argv;
  console.log('VANTAGE Structural Coherence (Agent 34) v2.0');
  console.log('');
  if (command === 'parse-canonical') {
    const file = process.argv[3];
    if (!file) {
      console.error('Usage: node structural-coherence.js parse-canonical <path-to-CANONICAL.md>');
      process.exit(1);
    }
    const content = fs.readFileSync(path.resolve(file), 'utf-8');
    const concerns = parseCanonical(content);
    console.log(JSON.stringify(concerns, null, 2));
  } else {
    console.log('Commands:');
    console.log('  parse-canonical <path>    Parse a CANONICAL.md and emit concerns as JSON');
    console.log('');
    console.log('Programmatic API: import { runStructuralAudit } from this module.');
  }
}
