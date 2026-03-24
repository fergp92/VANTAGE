import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Task pattern matching — maps natural language to transform names
// ---------------------------------------------------------------------------
const TASK_PATTERNS = {
  'var-to-const': /convert\s+var|var\s+to\s+const|modernize\s+declarations/i,
  'remove-console': /remove\s+console|strip\s+console|clean\s+console/i,
  'add-strict': /add\s+strict|use\s+strict/i,
  'sort-imports': /sort\s+imports|organize\s+imports|order\s+imports/i,
  'remove-unused-imports': /remove\s+unused|clean\s+imports|unused\s+imports/i,
  'normalize-quotes': /normalize\s+quotes|single\s+quotes|consistent\s+quotes/i,
};

// ---------------------------------------------------------------------------
// Token savings estimates per transform (avg tokens saved vs LLM round-trip)
// ---------------------------------------------------------------------------
const TOKEN_SAVINGS = {
  'var-to-const': 200,
  'remove-console': 150,
  'add-strict': 100,
  'sort-imports': 300,
  'remove-unused-imports': 250,
  'normalize-quotes': 150,
};

// ---------------------------------------------------------------------------
// In-memory stats
// ---------------------------------------------------------------------------
let stats = { totalExecuted: 0, totalSaved: 0, byTransform: {} };

function recordExecution(transform) {
  stats.totalExecuted += 1;
  stats.totalSaved += TOKEN_SAVINGS[transform] || 0;
  stats.byTransform[transform] = (stats.byTransform[transform] || 0) + 1;
}

// ---------------------------------------------------------------------------
// Transform implementations — pure functions (code in, code out)
// ---------------------------------------------------------------------------

function varToConst(code) {
  let changes = 0;
  // Collect all var declarations with their variable names
  const varRegex = /\bvar\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const declarations = [];
  let m;
  while ((m = varRegex.exec(code)) !== null) {
    declarations.push(m[1]);
  }

  let output = code;
  for (const name of declarations) {
    // Check for reassignment: name = ... (not preceded by var/let/const and not ===, !==, <=, >=)
    const reassignPattern = new RegExp(
      `(?<!var\\s)(?<!let\\s)(?<!const\\s)(?<![=!<>])\\b${name}\\s*=[^=]`,
    );
    // Find all assignments that are NOT the original declaration
    const lines = output.split('\n');
    let declSeen = false;
    let reassigned = false;
    for (const line of lines) {
      const isDecl = new RegExp(`\\bvar\\s+${name}\\b`).test(line);
      if (isDecl) {
        declSeen = true;
        continue;
      }
      if (declSeen && reassignPattern.test(line)) {
        reassigned = true;
        break;
      }
    }

    const replacement = reassigned ? 'let' : 'const';
    const declPattern = new RegExp(`\\bvar\\s+(${name}\\b)`);
    if (declPattern.test(output)) {
      output = output.replace(declPattern, `${replacement} $1`);
      changes += 1;
    }
  }

  return { output, changes };
}

function removeConsole(code) {
  let changes = 0;
  // Remove console.log, console.warn, console.info, console.debug — preserve console.error
  // Handle multiline: match console.method( ... ); tracking parens
  const lines = code.split('\n');
  const result = [];
  let skipping = false;
  let parenDepth = 0;

  for (const line of lines) {
    if (skipping) {
      // Count parens to find end of multiline call
      for (const ch of line) {
        if (ch === '(') parenDepth += 1;
        if (ch === ')') parenDepth -= 1;
      }
      if (parenDepth <= 0) {
        skipping = false;
        parenDepth = 0;
      }
      continue;
    }

    const match = line.match(/\bconsole\.(log|warn|info|debug)\s*\(/);
    if (match) {
      changes += 1;
      // Count parens on this line
      parenDepth = 0;
      let inStr = false;
      let strChar = '';
      for (const ch of line.slice(line.indexOf(match[0]))) {
        if (!inStr && (ch === '"' || ch === "'" || ch === '`')) {
          inStr = true;
          strChar = ch;
        } else if (inStr && ch === strChar) {
          inStr = false;
        }
        if (!inStr) {
          if (ch === '(') parenDepth += 1;
          if (ch === ')') parenDepth -= 1;
        }
      }
      if (parenDepth > 0) {
        skipping = true;
      }
      continue;
    }

    result.push(line);
  }

  return { output: result.join('\n'), changes };
}

function addStrict(code) {
  // Skip if already has 'use strict' or is ESM (has import/export at top level)
  if (/['"]use strict['"]/.test(code)) {
    return { output: code, changes: 0 };
  }
  if (/\b(import\s+|export\s+)/.test(code)) {
    return { output: code, changes: 0 };
  }
  return { output: `'use strict';\n\n${code}`, changes: 1 };
}

function sortImports(code) {
  const lines = code.split('\n');
  const importLines = [];
  const nonImportLines = [];
  let pastImports = false;

  for (const line of lines) {
    if (!pastImports && /^\s*import\s+/.test(line)) {
      importLines.push(line);
    } else {
      if (importLines.length > 0 && !pastImports && line.trim() === '') {
        // Blank line right after imports — skip, we will add our own
        pastImports = true;
        continue;
      }
      if (importLines.length > 0 && !/^\s*import\s+/.test(line)) {
        pastImports = true;
      }
      nonImportLines.push(line);
    }
  }

  if (importLines.length <= 1) {
    return { output: code, changes: 0 };
  }

  const NODE_BUILTINS = new Set([
    'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram',
    'dns', 'domain', 'events', 'fs', 'http', 'http2', 'https', 'net',
    'os', 'path', 'perf_hooks', 'process', 'querystring', 'readline',
    'repl', 'stream', 'string_decoder', 'timers', 'tls', 'tty', 'url',
    'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib', 'test',
  ]);

  function getSource(importLine) {
    const match = importLine.match(/from\s+['"]([^'"]+)['"]/);
    if (!match) {
      // Side-effect import: import './foo'
      const m2 = importLine.match(/import\s+['"]([^'"]+)['"]/);
      return m2 ? m2[1] : '';
    }
    return match[1];
  }

  function classify(src) {
    if (src.startsWith('node:') || NODE_BUILTINS.has(src)) return 0; // builtin
    if (src.startsWith('.') || src.startsWith('/')) return 2;         // relative
    return 1;                                                         // external
  }

  const sorted = [...importLines].sort((a, b) => {
    const srcA = getSource(a);
    const srcB = getSource(b);
    const groupA = classify(srcA);
    const groupB = classify(srcB);
    if (groupA !== groupB) return groupA - groupB;
    return srcA.localeCompare(srcB);
  });

  // Check if already sorted
  const alreadySorted = importLines.every((line, i) => line === sorted[i]);
  if (alreadySorted) {
    return { output: code, changes: 0 };
  }

  // Insert blank lines between groups
  const grouped = [];
  let lastGroup = -1;
  for (const line of sorted) {
    const src = getSource(line);
    const group = classify(src);
    if (lastGroup !== -1 && group !== lastGroup) {
      grouped.push('');
    }
    grouped.push(line);
    lastGroup = group;
  }

  const output = [...grouped, '', ...nonImportLines].join('\n');
  return { output, changes: sorted.length };
}

function removeUnusedImports(code) {
  const lines = code.split('\n');
  const importLines = [];
  const bodyLines = [];
  let pastImports = false;

  for (const line of lines) {
    if (!pastImports && /^\s*import\s+/.test(line)) {
      importLines.push(line);
    } else {
      if (importLines.length > 0) pastImports = true;
      bodyLines.push(line);
    }
  }

  const body = bodyLines.join('\n');
  let changes = 0;
  const kept = [];

  for (const imp of importLines) {
    // Side-effect import: import './styles.css' or import 'module'
    if (/^\s*import\s+['"]/.test(imp)) {
      kept.push(imp);
      continue;
    }

    // Extract imported identifiers
    const identifiers = [];

    // Default import: import Foo from '...'
    const defMatch = imp.match(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from/);
    if (defMatch) identifiers.push(defMatch[1]);

    // Named imports: import { a, b as c } from '...'
    const namedMatch = imp.match(/\{([^}]+)\}/);
    if (namedMatch) {
      const names = namedMatch[1].split(',').map(n => {
        const parts = n.trim().split(/\s+as\s+/);
        return parts.length > 1 ? parts[1].trim() : parts[0].trim();
      });
      identifiers.push(...names.filter(Boolean));
    }

    // Namespace import: import * as Ns from '...'
    const nsMatch = imp.match(/import\s+\*\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (nsMatch) identifiers.push(nsMatch[1]);

    if (identifiers.length === 0) {
      // Cannot parse — keep it safe
      kept.push(imp);
      continue;
    }

    const used = identifiers.some(id => {
      // Check if identifier appears in body as a word boundary
      const pattern = new RegExp(`\\b${id}\\b`);
      return pattern.test(body);
    });

    if (used) {
      kept.push(imp);
    } else {
      changes += 1;
    }
  }

  if (changes === 0) {
    return { output: code, changes: 0 };
  }

  const output = [...kept, ...bodyLines].join('\n');
  return { output, changes };
}

function normalizeQuotes(code, options = {}) {
  const target = options.quote || "'";
  const other = target === "'" ? '"' : "'";
  let changes = 0;
  let output = '';
  let i = 0;

  while (i < code.length) {
    // Skip template literals
    if (code[i] === '`') {
      const start = i;
      i += 1;
      while (i < code.length && code[i] !== '`') {
        if (code[i] === '\\') i += 1; // skip escaped char
        i += 1;
      }
      i += 1; // closing backtick
      output += code.slice(start, i);
      continue;
    }

    // Match the "other" quote type
    if (code[i] === other) {
      const start = i;
      i += 1;
      let content = '';
      while (i < code.length && code[i] !== other) {
        if (code[i] === '\\') {
          content += code[i];
          i += 1;
          if (i < code.length) {
            content += code[i];
            i += 1;
          }
          continue;
        }
        content += code[i];
        i += 1;
      }
      i += 1; // closing quote

      // If the string contains the target quote, skip conversion
      if (content.includes(target)) {
        output += code.slice(start, i);
      } else {
        output += target + content + target;
        changes += 1;
      }
      continue;
    }

    // Skip strings in the target quote (leave as-is)
    if (code[i] === target) {
      const start = i;
      i += 1;
      while (i < code.length && code[i] !== target) {
        if (code[i] === '\\') i += 1;
        i += 1;
      }
      i += 1;
      output += code.slice(start, i);
      continue;
    }

    output += code[i];
    i += 1;
  }

  return { output, changes };
}

// ---------------------------------------------------------------------------
// TRANSFORMS registry
// ---------------------------------------------------------------------------
export const TRANSFORMS = {
  'var-to-const': {
    description: 'Convert var declarations to const (or let if reassigned)',
    fn: varToConst,
  },
  'remove-console': {
    description: 'Strip console.log/warn/info/debug statements (keeps console.error)',
    fn: removeConsole,
  },
  'add-strict': {
    description: "Add 'use strict' to files that don't have it (skips ESM)",
    fn: addStrict,
  },
  'sort-imports': {
    description: 'Sort import statements: node builtins > external > relative',
    fn: sortImports,
  },
  'remove-unused-imports': {
    description: 'Remove imports whose identifiers are not used in the file body',
    fn: removeUnusedImports,
  },
  'normalize-quotes': {
    description: 'Convert all strings to single quotes (skips template literals)',
    fn: normalizeQuotes,
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function canHandle(task) {
  if (!task || !task.description) {
    return { handled: false, transform: null };
  }
  for (const [name, pattern] of Object.entries(TASK_PATTERNS)) {
    if (pattern.test(task.description)) {
      return { handled: true, transform: name };
    }
  }
  return { handled: false, transform: null };
}

export function execute(transform, code, options = {}) {
  const entry = TRANSFORMS[transform];
  if (!entry) {
    return { success: false, output: code, changes: 0, error: `Unknown transform: ${transform}` };
  }
  try {
    const { output, changes } = entry.fn(code, options);
    recordExecution(transform);
    return { success: true, output, changes };
  } catch (err) {
    return { success: false, output: code, changes: 0, error: err.message };
  }
}

export function getStats() {
  return { ...stats, byTransform: { ...stats.byTransform } };
}

export function resetStats() {
  stats = { totalExecuted: 0, totalSaved: 0, byTransform: {} };
}

// ---------------------------------------------------------------------------
// CLI interface — guarded
// ---------------------------------------------------------------------------
const _argv1fp = process.argv[1] || '';
const _metaUrlFp = fileURLToPath(import.meta.url);
if (_argv1fp.replace(/\\/g, '/') === _metaUrlFp.replace(/\\/g, '/')) {
  const [,, command, ...rest] = process.argv;

  if (command === 'list') {
    process.stdout.write('Available transforms:\n\n');
    for (const [name, t] of Object.entries(TRANSFORMS)) {
      process.stdout.write(`  ${name.padEnd(26)} ${t.description}\n`);
    }
  } else if (command === 'check') {
    const taskIdx = rest.indexOf('--task');
    const description = taskIdx !== -1 ? rest[taskIdx + 1] : rest.join(' ');
    const result = canHandle({ type: 'code', description });
    if (result.handled) {
      process.stdout.write(`Fast-path match: ${result.transform}\n`);
    } else {
      process.stdout.write('No fast-path match — will fall back to agent.\n');
    }
  } else if (command === 'run') {
    const transform = rest[0];
    const inputIdx = rest.indexOf('--input');
    const code = inputIdx !== -1 ? rest[inputIdx + 1] : '';
    if (!transform || !code) {
      process.stdout.write('Usage: node fast-path.js run <transform> --input "<code>"\n');
      process.exit(1);
    }
    const result = execute(transform, code);
    if (result.success) {
      process.stdout.write(result.output + '\n');
      process.stdout.write(`\n--- ${result.changes} change(s) applied ---\n`);
    } else {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    }
  } else if (command === 'stats') {
    const s = getStats();
    process.stdout.write('Fast-path stats:\n');
    process.stdout.write(`  Total executed: ${s.totalExecuted}\n`);
    process.stdout.write(`  Tokens saved:   ${s.totalSaved}\n`);
    if (Object.keys(s.byTransform).length > 0) {
      process.stdout.write('  By transform:\n');
      for (const [name, count] of Object.entries(s.byTransform)) {
        process.stdout.write(`    ${name}: ${count}\n`);
      }
    }
  } else {
    process.stdout.write('Usage: node fast-path.js <command>\n');
    process.stdout.write('Commands: list, check, run, stats\n');
  }
}
