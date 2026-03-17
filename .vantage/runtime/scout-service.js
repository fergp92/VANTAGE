import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVAL_FILE = path.join(__dirname, '..', 'memory', 'evaluations.md');

export function loadCache() {
  if (!fs.existsSync(EVAL_FILE)) return new Map();
  const content = fs.readFileSync(EVAL_FILE, 'utf-8');
  const cache = new Map();
  const sections = content.split(/(?=^### )/m).filter(s => s.startsWith('### '));

  for (const section of sections) {
    const headerMatch = section.match(/^### (.+?) \((\w+)\)/);
    if (!headerMatch) continue;
    const name = headerMatch[1];
    const registry = headerMatch[2];
    const entry = { registry, name };
    const lines = section.split('\n').filter(l => l.startsWith('- '));
    for (const line of lines) {
      const match = line.match(/^- (.+?):\s*(.+)$/);
      if (!match) continue;
      const key = match[1].toLowerCase().replace(/\s+/g, '_');
      let value = match[2].trim();
      if (key === 'rating') {
        value = (value.match(/\u2605/g) || []).length || parseInt(value) || 0;
      } else if (key === 'downloads' || key === 'vulnerabilities') {
        value = parseInt(value) || 0;
      }
      entry[key] = value;
    }
    cache.set(name, entry);
  }
  return cache;
}

export function saveEvaluation(packageName, evaluation) {
  const today = new Date().toISOString().split('T')[0];
  const stars = '\u2605'.repeat(evaluation.rating || 0) + '\u2606'.repeat(5 - (evaluation.rating || 0));
  const section = [
    `### ${packageName} (${evaluation.registry || 'npm'})`,
    `- Rating: ${stars}`,
    evaluation.downloads != null ? `- Downloads: ${evaluation.downloads}` : null,
    evaluation.lastCommit ? `- Last commit: ${evaluation.lastCommit}` : null,
    evaluation.license ? `- License: ${evaluation.license}` : null,
    evaluation.vulnerabilities != null ? `- Vulnerabilities: ${evaluation.vulnerabilities}` : null,
    evaluation.verdict ? `- Verdict: ${evaluation.verdict}` : null,
    evaluation.used_in ? `- Used in: ${evaluation.used_in}` : null,
    `- Last evaluated: ${today}`,
  ].filter(Boolean).join('\n');

  if (!fs.existsSync(EVAL_FILE)) {
    fs.writeFileSync(EVAL_FILE, `# VANTAGE Evaluation Cache\n\n${section}\n`, 'utf-8');
    return;
  }
  let content = fs.readFileSync(EVAL_FILE, 'utf-8');
  const regex = new RegExp(`### ${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(\\w+\\)[\\s\\S]*?(?=\\n### |\\s*$)`);
  if (regex.test(content)) {
    content = content.replace(regex, section + '\n');
  } else {
    content = content.trimEnd() + '\n\n' + section + '\n';
  }
  fs.writeFileSync(EVAL_FILE, content, 'utf-8');
}

export function search(query, options = {}) {
  const cache = loadCache();
  const queryLower = query.toLowerCase();
  const cacheResults = [];
  for (const [name, entry] of cache) {
    if (name.toLowerCase().includes(queryLower) ||
        (entry.verdict && entry.verdict.toLowerCase().includes(queryLower))) {
      cacheResults.push({ ...entry, cached: true });
    }
  }

  // Filter by license whitelist if provided
  const filtered = options.licenseWhitelist
    ? cacheResults.filter(r => options.licenseWhitelist.includes(r.license))
    : cacheResults;

  if (options.cacheOnly || filtered.length > 0) {
    return filtered;
  }
  // Live search would go here — stubbed for now
  return [];
}

// CLI interface — guarded
const _argv1ss = process.argv[1] || '';
const _metaUrlSs = fileURLToPath(import.meta.url);
if (_argv1ss.replace(/\\/g, '/') === _metaUrlSs.replace(/\\/g, '/')) {
  const [,, command, ...args] = process.argv;
  if (command === 'search') {
    const query = args[0];
    const results = search(query, { cacheOnly: args.includes('--cache-only') });
    console.log(JSON.stringify(results, null, 2));
  } else if (command === 'cache') {
    const cache = loadCache();
    console.log(JSON.stringify(Object.fromEntries(cache), null, 2));
  }
}
