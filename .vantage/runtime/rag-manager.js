import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeId } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = path.join(__dirname, '..', 'memory', 'agents');
const INDEX_DIR = path.join(__dirname, '..', 'memory', 'indices');

// Rough token estimate: ~4 chars per token (matches memory-manager.js)
const CHARS_PER_TOKEN = 4;

// Current index format version
const INDEX_VERSION = '1.0';

// Inline stopwords list (~50 common English words)
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'were',
  'been', 'are', 'am', 'do', 'does', 'did', 'has', 'have', 'had', 'not',
  'no', 'if', 'so', 'up', 'out', 'that', 'this', 'then', 'than', 'its',
  'all', 'can', 'will', 'just', 'should', 'would', 'could', 'may', 'each',
  'which', 'when', 'what', 'who', 'how', 'about', 'into', 'over',
]);

/**
 * Tokenize text for TF-IDF: lowercase, split on whitespace/punctuation, remove stopwords.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[\s\W]+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Split markdown memory content into chunks on `### YYYY-MM-DD` headers.
 * Each chunk gets metadata: { agentId, date, project, tags, tokens, text }.
 * @param {string} content - Raw markdown memory file content
 * @param {string} agentId
 * @returns {Array<{ agentId: string, date: string, project: string, tags: string[], tokens: number, text: string }>}
 */
export function chunkAgentMemory(content, agentId) {
  if (!content || typeof content !== 'string') return [];

  // Strip frontmatter
  const fmMatch = content.match(/^---\n[\s\S]*?\n---\n*/);
  const body = fmMatch ? content.slice(fmMatch[0].length) : content;

  if (!body.trim()) return [];

  // Split on ### YYYY-MM-DD headers
  const sections = body.split(/(?=^### \d{4}-\d{2}-\d{2})/m).filter(s => s.trim());

  return sections.map(section => {
    // Extract date from header
    const dateMatch = section.match(/^### (\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : 'unknown';

    // Extract project from header (### YYYY-MM-DD — Project: <name>)
    const projectMatch = section.match(/Project:\s*(.+?)$/m);
    const project = projectMatch ? projectMatch[1].trim() : 'unknown';

    // Extract tags from bracketed markers like [DECISION], [ERROR], [DISCOVERY]
    const tagMatches = section.match(/\[(DECISION|ERROR|DISCOVERY)\]/g) || [];
    const tags = [...new Set(tagMatches.map(t => t.replace(/[[\]]/g, '')))];

    const text = section.trim();
    const tokens = Math.ceil(text.length / CHARS_PER_TOKEN);

    return { agentId, date, project, tags, tokens, text };
  });
}

/**
 * Build a TF-IDF index from an agent's memory chunks.
 * Stores the index in `.vantage/memory/indices/{agentId}.index.json`.
 * @param {string} agentId
 * @returns {{ chunks: number, terms: number, path: string } | null}
 */
export function buildIndex(agentId) {
  const filePath = path.join(MEMORY_DIR, `${sanitizeId(agentId)}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const chunks = chunkAgentMemory(content, agentId);

  if (chunks.length === 0) return null;

  // Compute term frequencies per chunk
  const chunkTFs = chunks.map(chunk => {
    const terms = tokenize(chunk.text);
    const tf = {};
    for (const term of terms) {
      tf[term] = (tf[term] || 0) + 1;
    }
    // Normalize by total terms in chunk
    const total = terms.length || 1;
    for (const term of Object.keys(tf)) {
      tf[term] = tf[term] / total;
    }
    return tf;
  });

  // Compute document frequencies
  const df = {};
  for (const tf of chunkTFs) {
    for (const term of Object.keys(tf)) {
      df[term] = (df[term] || 0) + 1;
    }
  }

  // Compute IDF values
  const totalDocs = chunks.length;
  const idf = {};
  for (const [term, count] of Object.entries(df)) {
    idf[term] = Math.log(totalDocs / count);
  }

  // Build index object
  const index = {
    version: INDEX_VERSION,
    agentId,
    builtAt: new Date().toISOString(),
    chunks: chunks.map((chunk, i) => ({
      date: chunk.date,
      project: chunk.project,
      tags: chunk.tags,
      tokens: chunk.tokens,
      text: chunk.text,
      tf: chunkTFs[i],
    })),
    idf,
  };

  // Write index
  fs.mkdirSync(INDEX_DIR, { recursive: true });
  const indexPath = path.join(INDEX_DIR, `${sanitizeId(agentId)}.index.json`);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');

  return { chunks: chunks.length, terms: Object.keys(idf).length, path: indexPath };
}

/**
 * Search the TF-IDF index for chunks most relevant to a query string.
 * @param {string} agentId
 * @param {string} query
 * @param {number} topK - number of results to return (default 3)
 * @returns {Array<{ score: number, date: string, project: string, tags: string[], tokens: number, text: string }>}
 */
export function search(agentId, query, topK = 3) {
  const indexPath = path.join(INDEX_DIR, `${sanitizeId(agentId)}.index.json`);
  if (!fs.existsSync(indexPath)) return [];

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const queryTerms = tokenize(query);

  if (queryTerms.length === 0) return [];

  // Score each chunk
  const scored = index.chunks.map(chunk => {
    let score = 0;
    for (const term of queryTerms) {
      const tf = chunk.tf[term] || 0;
      const idf = index.idf[term] || 0;
      score += tf * idf;
    }
    return {
      score,
      date: chunk.date,
      project: chunk.project,
      tags: chunk.tags,
      tokens: chunk.tokens,
      text: chunk.text,
    };
  });

  // Sort by score descending, return top-K with score > 0
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * High-level function: loads agent memory using RAG retrieval instead of
 * full-file truncation. Falls back to truncation if no index exists.
 * @param {string} agentId
 * @param {string} query
 * @param {number} tokenBudget - max tokens to return (default 500)
 * @returns {string} Formatted memory section or empty string
 */
export function loadWithRAG(agentId, query, tokenBudget = 500) {
  const indexPath = path.join(INDEX_DIR, `${sanitizeId(agentId)}.index.json`);

  // Fall back to truncation approach if no index exists
  if (!fs.existsSync(indexPath)) {
    // Dynamic import would be circular; inline the truncation logic
    return _fallbackLoad(agentId, tokenBudget);
  }

  // Search for relevant chunks
  const results = search(agentId, query, 10); // fetch more, then trim to budget

  if (results.length === 0) {
    return _fallbackLoad(agentId, tokenBudget);
  }

  // Select chunks within token budget
  const selected = [];
  let usedTokens = 0;
  for (const result of results) {
    if (usedTokens + result.tokens > tokenBudget) {
      // Try to fit a truncated version of this chunk
      const remaining = tokenBudget - usedTokens;
      if (remaining > 50) {
        const maxChars = remaining * CHARS_PER_TOKEN;
        selected.push({
          ...result,
          text: result.text.slice(0, maxChars) + '...',
        });
      }
      break;
    }
    selected.push(result);
    usedTokens += result.tokens;
  }

  if (selected.length === 0) {
    return _fallbackLoad(agentId, tokenBudget);
  }

  // Sort selected chunks chronologically for readability
  selected.sort((a, b) => a.date.localeCompare(b.date));

  const body = selected.map(s => s.text).join('\n\n');
  return `## Learnings from Previous Sessions (RAG-retrieved)\n\n${body}`;
}

/**
 * Fallback: inline truncation load (mirrors memory-manager.js load logic).
 * @param {string} agentId
 * @param {number} tokenBudget
 * @returns {string}
 */
function _fallbackLoad(agentId, tokenBudget) {
  const filePath = path.join(MEMORY_DIR, `${sanitizeId(agentId)}.md`);
  if (!fs.existsSync(filePath)) return '';

  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract body (after frontmatter)
  const bodyStart = content.indexOf('---', 3);
  const body = bodyStart > -1 ? content.slice(bodyStart + 3).trim() : content.trim();

  if (!body) return '';

  const maxChars = tokenBudget * CHARS_PER_TOKEN;
  const truncated = body.length > maxChars
    ? '[...older entries truncated...]\n\n' + body.slice(-maxChars)
    : body;

  return `## Learnings from Previous Sessions\n\n${truncated}`;
}

// ---------------------------------------------------------------------------
// CLI interface: guarded by import.meta.url check
// ---------------------------------------------------------------------------
const _cliArg = process.argv[1] || '';
const _moduleUrl = fileURLToPath(import.meta.url);
if (_cliArg.replace(/\\/g, '/') === _moduleUrl.replace(/\\/g, '/')) {
  const [,, command, agentId, ...rest] = process.argv;

  if (command === 'index' && agentId) {
    if (agentId === '--all' || agentId === 'all') {
      // index-all: build indices for all agents with memory files
      if (!fs.existsSync(MEMORY_DIR)) {
        console.log('No memory directory found.');
        process.exit(0);
      }
      const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
      let indexed = 0;
      for (const file of files) {
        const id = file.replace(/\.md$/, '');
        const result = buildIndex(id);
        if (result) {
          console.log(`Indexed ${id}: ${result.chunks} chunks, ${result.terms} terms`);
          indexed++;
        } else {
          console.log(`Skipped ${id}: no content`);
        }
      }
      console.log(`\nTotal: ${indexed} agents indexed.`);
    } else {
      const result = buildIndex(agentId);
      if (result) {
        console.log(`Indexed ${agentId}: ${result.chunks} chunks, ${result.terms} terms`);
        console.log(`Index saved to: ${result.path}`);
      } else {
        console.log(`No memory found for agent: ${agentId}`);
      }
    }
  } else if (command === 'index-all') {
    // Alternative syntax: `node rag-manager.js index-all`
    if (!fs.existsSync(MEMORY_DIR)) {
      console.log('No memory directory found.');
      process.exit(0);
    }
    const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
    let indexed = 0;
    for (const file of files) {
      const id = file.replace(/\.md$/, '');
      const result = buildIndex(id);
      if (result) {
        console.log(`Indexed ${id}: ${result.chunks} chunks, ${result.terms} terms`);
        indexed++;
      } else {
        console.log(`Skipped ${id}: no content`);
      }
    }
    console.log(`\nTotal: ${indexed} agents indexed.`);
  } else if (command === 'search' && agentId) {
    const query = rest.join(' ');
    if (!query) {
      console.error('Usage: node rag-manager.js search <agentId> <query>');
      process.exit(1);
    }
    const results = search(agentId, query);
    if (results.length === 0) {
      console.log('No results found. Has the index been built? Run: node rag-manager.js index ' + agentId);
    } else {
      for (const r of results) {
        console.log(`\n--- Score: ${r.score.toFixed(4)} | Date: ${r.date} | Tags: ${r.tags.join(', ') || 'none'} ---`);
        console.log(r.text.slice(0, 300) + (r.text.length > 300 ? '...' : ''));
      }
    }
  } else {
    console.log('Usage:');
    console.log('  node rag-manager.js index <agentId>    Build index for an agent');
    console.log('  node rag-manager.js index-all          Build indices for all agents');
    console.log('  node rag-manager.js search <agentId> <query>  Search agent memory');
  }
}
