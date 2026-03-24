import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

import { getDirname } from './utils.js';
const __dirname = getDirname(import.meta.url);
const VANTAGE_ROOT = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(VANTAGE_ROOT, 'config.yml');

// Rough token estimate: ~4 chars per token
const CHARS_PER_TOKEN = 4;

const VALID_TYPES = ['architecture', 'security', 'implementation', 'error'];
const VALID_OUTCOMES = ['success', 'failure'];

// Agent ID to relevant pattern type mapping
const AGENT_TYPE_MAP = {
  '01': ['architecture'],
  '04': ['architecture'],
  '05': ['architecture', 'implementation'],
  '06': ['architecture', 'implementation'],
  '07': ['architecture', 'implementation'],
  '08': ['security'],
  '09': ['security'],
  '10': ['security'],
  '11': ['security', 'error'],
  '12': ['implementation'],
  '13': ['implementation'],
  '14': ['implementation'],
  '15': ['implementation', 'architecture'],
  '16': ['implementation'],
  '17': ['implementation', 'error'],
  '18': ['implementation', 'error'],
  '19': ['implementation', 'architecture'],
  '20': ['security', 'error'],
  '21': ['implementation'],
  '22': ['implementation', 'error'],
  '23': ['implementation'],
};

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return yaml.load(raw) || {};
  } catch {
    return {};
  }
}

function getPatternsDir(configOverride) {
  const config = configOverride || loadConfig();
  const rel = config?.patterns?.directory || 'memory/patterns';
  return path.join(VANTAGE_ROOT, rel);
}

function getMaxInjectionTokens(configOverride) {
  const config = configOverride || loadConfig();
  return config?.patterns?.max_injection_tokens || 500;
}

// ---------------------------------------------------------------------------
// Frontmatter parsing / serialization
// ---------------------------------------------------------------------------

function parsePatternFile(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) return null;
  try {
    const meta = yaml.load(fmMatch[1]) || {};
    const body = fmMatch[2].trim();
    return { meta, body };
  } catch {
    return null;
  }
}

function extractSections(body) {
  const sections = {};
  const re = /###\s+(.+)\n([\s\S]*?)(?=###|\s*$)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    sections[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return sections;
}

function buildPatternContent(meta, sections) {
  const fm = yaml.dump(meta, { lineWidth: -1 });
  let body = `## Pattern: ${sections.title || 'Untitled'}\n\n`;
  if (sections.solution) body += `### Solution\n${sections.solution}\n\n`;
  if (sections.why) body += `### Why It Works\n${sections.why}\n\n`;
  if (sections.antiPattern) body += `### Anti-Pattern\n${sections.antiPattern}\n`;
  return `---\n${fm}---\n\n${body.trimEnd()}\n`;
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function nextId(dir) {
  if (!fs.existsSync(dir)) return 'pat-001';
  const files = fs.readdirSync(dir).filter(f => f.startsWith('pat-') && f.endsWith('.md'));
  if (files.length === 0) return 'pat-001';
  const nums = files.map(f => {
    const m = f.match(/^pat-(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = Math.max(...nums);
  return `pat-${String(max + 1).padStart(3, '0')}`;
}

// ---------------------------------------------------------------------------
// Similarity helpers
// ---------------------------------------------------------------------------

function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/).filter(Boolean);
}

function tagSetIntersection(a, b) {
  const setB = new Set(b.map(t => t.toLowerCase()));
  return a.filter(t => setB.has(t.toLowerCase()));
}

function tagSetUnion(a, b) {
  const s = new Set([...a.map(t => t.toLowerCase()), ...b.map(t => t.toLowerCase())]);
  return [...s];
}

function jaccardTags(queryTags, patternTags) {
  if (!queryTags || queryTags.length === 0) return 0;
  const inter = tagSetIntersection(queryTags, patternTags);
  const union = tagSetUnion(queryTags, patternTags);
  return union.length === 0 ? 0 : inter.length / union.length;
}

function contextKeywordScore(queryContext, patternContext) {
  if (!queryContext) return 0;
  const qTokens = tokenize(queryContext);
  if (qTokens.length === 0) return 0;
  const pTokens = new Set(tokenize(patternContext));
  const matches = qTokens.filter(t => pTokens.has(t)).length;
  return matches / qTokens.length;
}

function computeScore(query, pattern) {
  const tagScore = jaccardTags(query.tags || [], pattern.tags || []);
  const ctxScore = contextKeywordScore(query.context, pattern.context);
  return tagScore * 0.6 + ctxScore * 0.4;
}

// ---------------------------------------------------------------------------
// Core exports
// ---------------------------------------------------------------------------

/**
 * Store a new pattern or update existing if a similar one is found.
 * @param {object} pattern - { tags, context, type, outcome, solution, antiPattern, project }
 * @param {object} [opts] - { dir } override patterns directory (for testing)
 * @returns {{ id: string, isNew: boolean, merged: boolean }}
 */
export function store(pattern, opts = {}) {
  const dir = opts.dir || getPatternsDir(opts.config);
  fs.mkdirSync(dir, { recursive: true });

  const tags = (pattern.tags || []).map(t => t.toLowerCase().trim()).filter(Boolean);
  const context = (pattern.context || '').trim();
  const type = VALID_TYPES.includes(pattern.type) ? pattern.type : 'implementation';
  const outcome = VALID_OUTCOMES.includes(pattern.outcome) ? pattern.outcome : 'success';
  const today = new Date().toISOString().split('T')[0];

  // Check for existing similar pattern (deduplicate)
  const existing = findSimilar(tags, context, dir);
  if (existing) {
    // Merge: update frequency, last_used, projects
    const content = fs.readFileSync(existing.path, 'utf-8');
    const parsed = parsePatternFile(content);
    if (parsed) {
      parsed.meta.frequency = (parsed.meta.frequency || 1) + 1;
      parsed.meta.last_used = today;
      const projects = new Set(parsed.meta.projects || []);
      if (pattern.project) projects.add(pattern.project);
      parsed.meta.projects = [...projects];

      // Merge tags
      const mergedTags = new Set([...(parsed.meta.tags || []), ...tags]);
      parsed.meta.tags = [...mergedTags];

      const sections = extractSections(parsed.body);
      if (pattern.solution) sections.solution = pattern.solution;
      if (pattern.antiPattern) sections['anti-pattern'] = pattern.antiPattern;
      sections.antiPattern = sections['anti-pattern'] || sections.antiPattern;

      const newContent = buildPatternContent(parsed.meta, {
        title: sections.title || parsed.body.match(/## Pattern:\s*(.+)/)?.[1] || 'Untitled',
        solution: sections.solution || '',
        why: sections['why it works'] || '',
        antiPattern: sections.antiPattern || sections['anti-pattern'] || '',
      });
      fs.writeFileSync(existing.path, newContent, 'utf-8');
      return { id: parsed.meta.id, isNew: false, merged: true };
    }
  }

  // Create new pattern
  const id = nextId(dir);
  const meta = {
    id,
    tags,
    context,
    type,
    outcome,
    frequency: 1,
    created: today,
    last_used: today,
    projects: pattern.project ? [pattern.project] : [],
  };

  const sections = {
    title: context || tags.join(', '),
    solution: pattern.solution || '',
    why: pattern.why || '',
    antiPattern: pattern.antiPattern || '',
  };

  const content = buildPatternContent(meta, sections);
  fs.writeFileSync(path.join(dir, `${id}.md`), content, 'utf-8');
  return { id, isNew: true, merged: false };
}

/**
 * Find a similar existing pattern by tags + context overlap.
 * Returns the first pattern with score >= 0.6 (strong match).
 */
function findSimilar(tags, context, dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parsePatternFile(content);
    if (!parsed) continue;

    const score = computeScore(
      { tags, context },
      { tags: parsed.meta.tags, context: parsed.meta.context }
    );
    if (score >= 0.6) {
      return { path: filePath, meta: parsed.meta, score };
    }
  }
  return null;
}

/**
 * Search patterns by tags, context, type, and/or outcome.
 * @param {object} query - { tags?, context?, type?, outcome? }
 * @param {object} [opts] - { dir } override patterns directory
 * @returns {Array<{ id, tags, context, solution, score }>}
 */
export function search(query, opts = {}) {
  const dir = opts.dir || getPatternsDir(opts.config);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const results = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const parsed = parsePatternFile(content);
    if (!parsed) continue;

    // Filter by type/outcome if specified
    if (query.type && parsed.meta.type !== query.type) continue;
    if (query.outcome && parsed.meta.outcome !== query.outcome) continue;

    const score = computeScore(query, {
      tags: parsed.meta.tags || [],
      context: parsed.meta.context || '',
    });

    if (score > 0) {
      const sections = extractSections(parsed.body);
      results.push({
        id: parsed.meta.id,
        tags: parsed.meta.tags || [],
        context: parsed.meta.context || '',
        solution: sections.solution || '',
        score: Math.round(score * 1000) / 1000,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Get relevant patterns for a specific agent's current task.
 * @param {string} agentId - Agent ID (e.g., '08', '12')
 * @param {string} taskContext - Description of the current task
 * @param {object} [opts] - { dir, config }
 * @returns {string} Formatted patterns for prompt injection
 */
export function getForAgent(agentId, taskContext, opts = {}) {
  const maxTokens = getMaxInjectionTokens(opts.config);
  const maxChars = maxTokens * CHARS_PER_TOKEN;

  // Determine relevant types for this agent
  const relevantTypes = AGENT_TYPE_MAP[agentId] || ['implementation'];

  // Search across all relevant types
  const taskTokens = tokenize(taskContext);
  let allResults = [];

  for (const type of relevantTypes) {
    const results = search({ tags: taskTokens, context: taskContext, type }, opts);
    allResults.push(...results);
  }

  // Deduplicate by ID and sort by score
  const seen = new Set();
  allResults = allResults.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  allResults.sort((a, b) => b.score - a.score);

  if (allResults.length === 0) return '';

  // Build formatted output within token budget
  let output = '## Relevant Patterns\n\n';
  for (const r of allResults) {
    const entry = `### ${r.id} (score: ${r.score})\n**Context:** ${r.context}\n**Solution:** ${r.solution}\n\n`;
    if ((output.length + entry.length) > maxChars) break;
    output += entry;
  }

  return output.trimEnd();
}

/**
 * Auto-capture patterns after a gate passes.
 * Extracts successful patterns from phase artifacts.
 * @param {string} gate - Gate ID (e.g., 'G1', 'G2')
 * @param {object} artifacts - Gate artifacts
 * @param {object} [opts] - { dir }
 * @returns {{ captured: number }}
 */
export function captureFromGate(gate, artifacts, opts = {}) {
  const config = opts.config || loadConfig();
  if (config?.patterns?.auto_capture === false) return { captured: 0 };

  let captured = 0;
  const gateTypeMap = {
    'G0': 'architecture',
    'G1': 'architecture',
    'G2': 'security',
    'G3': 'implementation',
    'G4': 'implementation',
    'G5': 'implementation',
  };

  const type = gateTypeMap[gate] || 'implementation';

  // Extract patterns from artifacts
  if (artifacts?.decisions && Array.isArray(artifacts.decisions)) {
    for (const decision of artifacts.decisions) {
      if (decision.reusable !== false) {
        store({
          tags: decision.tags || [],
          context: decision.context || `${gate} gate decision`,
          type,
          outcome: 'success',
          solution: decision.content || decision.solution || '',
          project: artifacts.project || '',
        }, opts);
        captured++;
      }
    }
  }

  if (artifacts?.patterns && Array.isArray(artifacts.patterns)) {
    for (const pat of artifacts.patterns) {
      store({
        tags: pat.tags || [],
        context: pat.context || '',
        type: pat.type || type,
        outcome: pat.outcome || 'success',
        solution: pat.solution || '',
        antiPattern: pat.antiPattern || '',
        project: artifacts.project || '',
      }, opts);
      captured++;
    }
  }

  return { captured };
}

/**
 * List all patterns with optional filters.
 * @param {object} [filters] - { type?, outcome?, tag? }
 * @param {object} [opts] - { dir }
 * @returns {{ total: number, patterns: Array<{ id, tags, type, outcome, frequency }> }}
 */
export function list(filters = {}, opts = {}) {
  const dir = opts.dir || getPatternsDir(opts.config);
  if (!fs.existsSync(dir)) return { total: 0, patterns: [] };

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const patterns = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const parsed = parsePatternFile(content);
    if (!parsed) continue;

    if (filters.type && parsed.meta.type !== filters.type) continue;
    if (filters.outcome && parsed.meta.outcome !== filters.outcome) continue;
    if (filters.tag) {
      const hasTags = (parsed.meta.tags || []).some(
        t => t.toLowerCase() === filters.tag.toLowerCase()
      );
      if (!hasTags) continue;
    }

    patterns.push({
      id: parsed.meta.id,
      tags: parsed.meta.tags || [],
      type: parsed.meta.type || 'implementation',
      outcome: parsed.meta.outcome || 'success',
      frequency: parsed.meta.frequency || 1,
    });
  }

  return { total: patterns.length, patterns };
}

// ---------------------------------------------------------------------------
// CLI interface
// ---------------------------------------------------------------------------

const _argv1 = process.argv[1] || '';
const _metaUrl = fileURLToPath(import.meta.url);
if (_argv1.replace(/\\/g, '/') === _metaUrl.replace(/\\/g, '/')) {
  const [,, command, ...rest] = process.argv;

  function parseCliArgs(args) {
    const parsed = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].slice(2);
        const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
        parsed[key] = val;
        if (val !== 'true') i++;
      }
    }
    return parsed;
  }

  const args = parseCliArgs(rest);

  if (command === 'store') {
    const tags = args.tags ? args.tags.split(',').map(t => t.trim()) : [];
    const result = store({
      tags,
      context: args.context || '',
      type: args.type || 'implementation',
      outcome: args.outcome || 'success',
      solution: args.solution || '',
      antiPattern: args.antipattern || args.antiPattern || '',
      project: args.project || '',
    });
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'search') {
    const tags = args.tags ? args.tags.split(',').map(t => t.trim()) : undefined;
    const results = search({
      tags,
      context: args.context,
      type: args.type,
      outcome: args.outcome,
    });
    console.log(JSON.stringify(results, null, 2));
  } else if (command === 'list') {
    const result = list({
      type: args.type,
      outcome: args.outcome,
      tag: args.tag,
    });
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Usage:
  node pattern-library.js store --tags "auth,jwt" --context "REST API auth" --type architecture --solution "Use RS256..."
  node pattern-library.js search --tags "auth" --type security
  node pattern-library.js list [--type architecture] [--outcome success] [--tag auth]`);
  }
}
