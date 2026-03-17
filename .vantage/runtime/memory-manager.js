import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = path.join(__dirname, '..', 'memory', 'agents');

// Rough token estimate: ~4 chars per token
const CHARS_PER_TOKEN = 4;

/** Sanitize ID to prevent path traversal */
function sanitizeId(id) {
  return path.basename(id).replace(/[^a-zA-Z0-9._-]/g, '');
}

/**
 * Load agent memory, optionally truncated to token budget.
 * @param {string} agentId
 * @param {number} tokenBudget - max tokens to return (default 500)
 * @returns {string} Formatted memory section or empty string
 */
export function load(agentId, tokenBudget = 500) {
  const filePath = path.join(MEMORY_DIR, `${sanitizeId(agentId)}.md`);
  if (!fs.existsSync(filePath)) return '';

  let content = fs.readFileSync(filePath, 'utf-8');

  // Parse frontmatter (validate YAML)
  try {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) yaml.load(fmMatch[1]); // validate, ignore result
  } catch {
    // Corrupted YAML — still return the content body
  }

  // Extract body (after frontmatter)
  const bodyStart = content.indexOf('---', 3);
  const body = bodyStart > -1 ? content.slice(bodyStart + 3).trim() : content.trim();

  if (!body) return '';

  // Truncate to budget — keep most recent entries (from end)
  const maxChars = tokenBudget * CHARS_PER_TOKEN;
  const truncated = body.length > maxChars
    ? '[...older entries truncated...]\n\n' + body.slice(-maxChars)
    : body;

  return `## Learnings from Previous Sessions\n\n${truncated}`;
}

/**
 * Append a learning entry to an agent's memory file.
 * @param {string} agentId
 * @param {{ type: string, content: string, project: string, reusable: boolean }} entry
 */
export function appendLearning(agentId, entry) {
  const filePath = path.join(MEMORY_DIR, `${sanitizeId(agentId)}.md`);
  const today = new Date().toISOString().split('T')[0];

  fs.mkdirSync(MEMORY_DIR, { recursive: true });

  if (!fs.existsSync(filePath)) {
    // Create new file with frontmatter
    const frontmatter = yaml.dump({
      agent: agentId,
      total_invocations: 1,
      success_rate: 1.0,
      last_used: today,
    });
    const newEntry = `---\n${frontmatter}---\n\n### ${today} — Project: ${entry.project}\n- [${entry.type}] ${entry.content}\n`;
    fs.writeFileSync(filePath, newEntry, 'utf-8');
    return;
  }

  // Append to existing file
  let existing;
  try {
    existing = fs.readFileSync(filePath, 'utf-8');
  } catch {
    existing = '';
  }

  // Update frontmatter
  try {
    const fmMatch = existing.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const fm = yaml.load(fmMatch[1]) || {};
      fm.total_invocations = (fm.total_invocations || 0) + 1;
      fm.last_used = today;
      existing = existing.replace(/^---\n[\s\S]*?\n---/, `---\n${yaml.dump(fm)}---`);
    }
  } catch {
    // If YAML parse fails, just append without updating frontmatter
  }

  // Append new entry at the end (chronological order)
  const newLine = `\n### ${today} — Project: ${entry.project}\n- [${entry.type}] ${entry.content}\n`;
  existing = existing.trimEnd() + '\n' + newLine;
  fs.writeFileSync(filePath, existing, 'utf-8');
}

/**
 * Graduate session learnings to persistent memory.
 * Rules: reusable=true AND (errors always graduate, decisions/discoveries with roundtrips > 2)
 * @param {string} agentId
 * @param {{ decisions: Array, errors: Array, discoveries: Array }} sessionMemory
 * @returns {{ graduated: number, discarded: number }}
 */
export function graduate(agentId, sessionMemory) {
  let graduated = 0;
  let discarded = 0;

  const entries = [
    ...sessionMemory.decisions.map(e => ({ ...e, type: 'DECISION' })),
    ...sessionMemory.errors.map(e => ({ ...e, type: 'ERROR' })),
    ...sessionMemory.discoveries.map(e => ({ ...e, type: 'DISCOVERY' })),
  ];

  for (const entry of entries) {
    // Graduation rules
    const shouldGraduate = entry.reusable && (
      entry.type === 'ERROR' || // errors always graduate if reusable
      (entry.roundtrips || 0) > 2 // decisions/discoveries need significant effort
    );

    if (shouldGraduate) {
      appendLearning(agentId, entry);
      graduated++;
    } else {
      discarded++;
    }
  }

  return { graduated, discarded };
}

/**
 * Compact memory file if it exceeds token threshold.
 * Keeps recent entries, archives old ones.
 * @param {string} agentId
 * @param {number} threshold - token threshold (default 8000)
 * @returns {{ compacted: boolean, archivedEntries?: number }}
 */
export function compactIfNeeded(agentId, threshold = 8000) {
  const filePath = path.join(MEMORY_DIR, `${sanitizeId(agentId)}.md`);
  if (!fs.existsSync(filePath)) return { compacted: false };

  const content = fs.readFileSync(filePath, 'utf-8');
  const tokens = Math.ceil(content.length / CHARS_PER_TOKEN);

  if (tokens <= threshold) return { compacted: false };

  // Split into frontmatter and entries
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---)\n*/);
  const frontmatter = fmMatch ? fmMatch[1] : '';
  const body = fmMatch ? content.slice(fmMatch[0].length) : content;

  // Split entries by ### headers
  const entries = body.split(/(?=^### )/m).filter(e => e.trim());

  if (entries.length <= 2) return { compacted: false }; // Keep at least 2

  // Keep last half, archive first half
  const midpoint = Math.floor(entries.length / 2);
  const toArchive = entries.slice(0, midpoint);
  const toKeep = entries.slice(midpoint);

  // Write archive
  const archiveDir = path.join(__dirname, '..', 'memory', 'archive');
  fs.mkdirSync(archiveDir, { recursive: true });
  const archivePath = path.join(archiveDir, `${agentId}-${new Date().toISOString().split('T')[0]}.md`);
  fs.writeFileSync(archivePath, `# Archived Memory: ${agentId}\n\n${toArchive.join('\n')}`, 'utf-8');

  // Rewrite main file
  const compacted = frontmatter + '\n\n' + toKeep.join('\n');
  fs.writeFileSync(filePath, compacted, 'utf-8');

  return { compacted: true, archivedEntries: toArchive.length };
}

// CLI interface: node memory-manager.js <command> <agentId> [options]
// Guarded so it only runs when invoked directly, not when imported
const _argv1mm = process.argv[1] || '';
const _metaUrlMm = fileURLToPath(import.meta.url);
if (_argv1mm.replace(/\\/g, '/') === _metaUrlMm.replace(/\\/g, '/')) {
  const [,, command, agentId] = process.argv;

  if (command === 'load') {
    const budget = parseInt(process.argv[4]) || 500;
    const result = load(agentId, budget);
    process.stdout.write(result);
  } else if (command === 'compact') {
    const threshold = parseInt(process.argv[4]) || 8000;
    const result = compactIfNeeded(agentId, threshold);
    console.log(JSON.stringify(result));
  }
}
