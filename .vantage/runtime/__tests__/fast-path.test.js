import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { canHandle, execute, TRANSFORMS, getStats, resetStats } from '../fast-path.js';

// ---------------------------------------------------------------------------
// var-to-const
// ---------------------------------------------------------------------------
describe('var-to-const', () => {
  it('converts var to const when variable is never reassigned', () => {
    const code = 'var x = 1;\nvar y = 2;';
    const result = execute('var-to-const', code);
    assert.ok(result.success);
    assert.ok(result.output.includes('const x'));
    assert.ok(result.output.includes('const y'));
    assert.equal(result.changes, 2);
  });

  it('uses let when variable is reassigned', () => {
    const code = 'var count = 0;\ncount = count + 1;';
    const result = execute('var-to-const', code);
    assert.ok(result.success);
    assert.ok(result.output.includes('let count'));
    assert.ok(!result.output.includes('const count'));
    assert.equal(result.changes, 1);
  });

  it('handles mixed reassigned and non-reassigned vars', () => {
    const code = 'var a = 1;\nvar b = 2;\nb = 3;';
    const result = execute('var-to-const', code);
    assert.ok(result.output.includes('const a'));
    assert.ok(result.output.includes('let b'));
    assert.equal(result.changes, 2);
  });

  it('returns 0 changes when no var declarations exist', () => {
    const code = 'const x = 1;\nlet y = 2;';
    const result = execute('var-to-const', code);
    assert.equal(result.changes, 0);
  });
});

// ---------------------------------------------------------------------------
// remove-console
// ---------------------------------------------------------------------------
describe('remove-console', () => {
  it('removes console.log statements', () => {
    const code = 'const x = 1;\nconsole.log(x);\nreturn x;';
    const result = execute('remove-console', code);
    assert.ok(result.success);
    assert.ok(!result.output.includes('console.log'));
    assert.equal(result.changes, 1);
  });

  it('removes console.warn, console.info, console.debug', () => {
    const code = 'console.warn("w");\nconsole.info("i");\nconsole.debug("d");';
    const result = execute('remove-console', code);
    assert.equal(result.changes, 3);
    assert.ok(!result.output.includes('console.'));
  });

  it('preserves console.error', () => {
    const code = 'console.log("remove me");\nconsole.error("keep me");';
    const result = execute('remove-console', code);
    assert.ok(result.output.includes('console.error'));
    assert.ok(!result.output.includes('console.log'));
    assert.equal(result.changes, 1);
  });

  it('handles multiline console.log calls', () => {
    const code = 'console.log(\n  "hello",\n  "world"\n);\nconst a = 1;';
    const result = execute('remove-console', code);
    assert.ok(!result.output.includes('console.log'));
    assert.ok(result.output.includes('const a = 1'));
    assert.equal(result.changes, 1);
  });
});

// ---------------------------------------------------------------------------
// add-strict
// ---------------------------------------------------------------------------
describe('add-strict', () => {
  it('adds use strict to non-ESM files', () => {
    const code = 'function foo() { return 1; }';
    const result = execute('add-strict', code);
    assert.ok(result.success);
    assert.ok(result.output.startsWith("'use strict';"));
    assert.equal(result.changes, 1);
  });

  it('skips files that already have use strict', () => {
    const code = "'use strict';\nfunction foo() {}";
    const result = execute('add-strict', code);
    assert.equal(result.changes, 0);
    assert.equal(result.output, code);
  });

  it('skips ESM files with import statements', () => {
    const code = "import fs from 'node:fs';\nconst x = 1;";
    const result = execute('add-strict', code);
    assert.equal(result.changes, 0);
    assert.equal(result.output, code);
  });

  it('skips ESM files with export statements', () => {
    const code = 'export function foo() { return 1; }';
    const result = execute('add-strict', code);
    assert.equal(result.changes, 0);
    assert.equal(result.output, code);
  });
});

// ---------------------------------------------------------------------------
// sort-imports
// ---------------------------------------------------------------------------
describe('sort-imports', () => {
  it('groups and sorts imports: builtins > external > relative', () => {
    const code = [
      "import z from './z.js';",
      "import express from 'express';",
      "import fs from 'node:fs';",
      '',
      'const app = express();',
    ].join('\n');
    const result = execute('sort-imports', code);
    assert.ok(result.success);
    const lines = result.output.split('\n');
    // First import should be node:fs (builtin)
    assert.ok(lines[0].includes('node:fs'));
    // Then express (external) — after possible blank line
    const expressIdx = lines.findIndex(l => l.includes('express'));
    const relativeIdx = lines.findIndex(l => l.includes('./z.js'));
    assert.ok(expressIdx < relativeIdx);
  });

  it('returns 0 changes when imports already sorted', () => {
    const code = [
      "import fs from 'node:fs';",
      "import express from 'express';",
      "import z from './z.js';",
      '',
      'const app = express();',
    ].join('\n');
    const result = execute('sort-imports', code);
    assert.equal(result.changes, 0);
  });

  it('returns 0 changes for single import', () => {
    const code = "import x from './x.js';\n\nconst a = 1;";
    const result = execute('sort-imports', code);
    assert.equal(result.changes, 0);
  });
});

// ---------------------------------------------------------------------------
// remove-unused-imports
// ---------------------------------------------------------------------------
describe('remove-unused-imports', () => {
  it('removes imports whose identifiers are not used', () => {
    const code = [
      "import fs from 'node:fs';",
      "import path from 'node:path';",
      '',
      'const p = path.join("a", "b");',
    ].join('\n');
    const result = execute('remove-unused-imports', code);
    assert.ok(result.success);
    assert.ok(!result.output.includes('node:fs'));
    assert.ok(result.output.includes('node:path'));
    assert.equal(result.changes, 1);
  });

  it('keeps side-effect imports', () => {
    const code = [
      "import './styles.css';",
      "import unused from 'unused-pkg';",
      '',
      'doSomething();',
    ].join('\n');
    const result = execute('remove-unused-imports', code);
    assert.ok(result.output.includes('./styles.css'));
    assert.ok(!result.output.includes('unused-pkg'));
    assert.equal(result.changes, 1);
  });

  it('keeps all imports when all are used', () => {
    const code = [
      "import fs from 'node:fs';",
      "import path from 'node:path';",
      '',
      'fs.readFileSync(path.join("a"));',
    ].join('\n');
    const result = execute('remove-unused-imports', code);
    assert.equal(result.changes, 0);
  });

  it('handles named imports correctly', () => {
    const code = [
      "import { readFile, writeFile } from 'node:fs/promises';",
      '',
      'await readFile("test.txt");',
    ].join('\n');
    // writeFile is unused but readFile is used — the whole import stays
    // because we check if *any* identifier from the import is used
    const result = execute('remove-unused-imports', code);
    assert.equal(result.changes, 0);
  });
});

// ---------------------------------------------------------------------------
// normalize-quotes
// ---------------------------------------------------------------------------
describe('normalize-quotes', () => {
  it('converts double quotes to single quotes', () => {
    const code = 'const x = "hello";\nconst y = "world";';
    const result = execute('normalize-quotes', code);
    assert.ok(result.success);
    assert.ok(result.output.includes("'hello'"));
    assert.ok(result.output.includes("'world'"));
    assert.equal(result.changes, 2);
  });

  it('skips template literals', () => {
    const code = 'const x = `hello ${name}`;\nconst y = "world";';
    const result = execute('normalize-quotes', code);
    assert.ok(result.output.includes('`hello ${name}`'));
    assert.ok(result.output.includes("'world'"));
    assert.equal(result.changes, 1);
  });

  it('skips strings containing the target quote character', () => {
    const code = "const x = \"it's fine\";";
    const result = execute('normalize-quotes', code);
    // Should keep double quotes because the string contains a single quote
    assert.ok(result.output.includes('"'));
    assert.equal(result.changes, 0);
  });

  it('leaves already single-quoted strings alone', () => {
    const code = "const x = 'hello';";
    const result = execute('normalize-quotes', code);
    assert.equal(result.output, code);
    assert.equal(result.changes, 0);
  });
});

// ---------------------------------------------------------------------------
// canHandle
// ---------------------------------------------------------------------------
describe('canHandle', () => {
  it('matches var-to-const patterns', () => {
    assert.deepEqual(canHandle({ type: 'code', description: 'convert var to const' }),
      { handled: true, transform: 'var-to-const' });
    assert.deepEqual(canHandle({ type: 'code', description: 'modernize declarations' }),
      { handled: true, transform: 'var-to-const' });
  });

  it('matches remove-console patterns', () => {
    assert.deepEqual(canHandle({ type: 'code', description: 'remove console.log statements' }),
      { handled: true, transform: 'remove-console' });
    assert.deepEqual(canHandle({ type: 'code', description: 'strip console output' }),
      { handled: true, transform: 'remove-console' });
  });

  it('matches sort-imports patterns', () => {
    assert.deepEqual(canHandle({ type: 'code', description: 'sort imports alphabetically' }),
      { handled: true, transform: 'sort-imports' });
    assert.deepEqual(canHandle({ type: 'code', description: 'organize imports' }),
      { handled: true, transform: 'sort-imports' });
  });

  it('matches remove-unused-imports patterns', () => {
    assert.deepEqual(canHandle({ type: 'code', description: 'remove unused imports' }),
      { handled: true, transform: 'remove-unused-imports' });
  });

  it('matches normalize-quotes patterns', () => {
    assert.deepEqual(canHandle({ type: 'code', description: 'normalize quotes to single quotes' }),
      { handled: true, transform: 'normalize-quotes' });
  });

  it('matches add-strict patterns', () => {
    assert.deepEqual(canHandle({ type: 'code', description: 'add use strict directive' }),
      { handled: true, transform: 'add-strict' });
  });

  it('returns handled: false for unknown tasks', () => {
    assert.deepEqual(canHandle({ type: 'code', description: 'refactor the entire codebase' }),
      { handled: false, transform: null });
  });

  it('returns handled: false for null/missing description', () => {
    assert.deepEqual(canHandle(null), { handled: false, transform: null });
    assert.deepEqual(canHandle({ type: 'code' }), { handled: false, transform: null });
  });
});

// ---------------------------------------------------------------------------
// execute
// ---------------------------------------------------------------------------
describe('execute', () => {
  it('returns correct change counts', () => {
    const code = 'var a = 1;\nvar b = 2;\nvar c = 3;';
    const result = execute('var-to-const', code);
    assert.ok(result.success);
    assert.equal(result.changes, 3);
  });

  it('returns error for unknown transform', () => {
    const result = execute('nonexistent', 'code');
    assert.equal(result.success, false);
    assert.ok(result.error.includes('Unknown transform'));
    assert.equal(result.changes, 0);
  });

  it('returns original code on error', () => {
    const result = execute('nonexistent', 'my code');
    assert.equal(result.output, 'my code');
  });
});

// ---------------------------------------------------------------------------
// TRANSFORMS registry
// ---------------------------------------------------------------------------
describe('TRANSFORMS', () => {
  it('exports all six transforms', () => {
    const names = Object.keys(TRANSFORMS);
    assert.equal(names.length, 6);
    assert.ok(names.includes('var-to-const'));
    assert.ok(names.includes('remove-console'));
    assert.ok(names.includes('add-strict'));
    assert.ok(names.includes('sort-imports'));
    assert.ok(names.includes('remove-unused-imports'));
    assert.ok(names.includes('normalize-quotes'));
  });

  it('each transform has a description and fn', () => {
    for (const [name, entry] of Object.entries(TRANSFORMS)) {
      assert.ok(typeof entry.description === 'string', `${name} missing description`);
      assert.ok(typeof entry.fn === 'function', `${name} missing fn`);
    }
  });
});

// ---------------------------------------------------------------------------
// Stats tracking
// ---------------------------------------------------------------------------
describe('getStats', () => {
  beforeEach(() => {
    resetStats();
  });

  it('starts at zero', () => {
    const s = getStats();
    assert.equal(s.totalExecuted, 0);
    assert.equal(s.totalSaved, 0);
    assert.deepEqual(s.byTransform, {});
  });

  it('increments after execution', () => {
    execute('var-to-const', 'var x = 1;');
    const s = getStats();
    assert.equal(s.totalExecuted, 1);
    assert.equal(s.totalSaved, 200);
    assert.equal(s.byTransform['var-to-const'], 1);
  });

  it('tracks multiple transforms separately', () => {
    execute('var-to-const', 'var x = 1;');
    execute('remove-console', 'console.log("hi");');
    execute('var-to-const', 'var y = 2;');
    const s = getStats();
    assert.equal(s.totalExecuted, 3);
    assert.equal(s.totalSaved, 200 + 150 + 200);
    assert.equal(s.byTransform['var-to-const'], 2);
    assert.equal(s.byTransform['remove-console'], 1);
  });

  it('returns a copy (mutations do not affect internal state)', () => {
    execute('add-strict', 'function f() {}');
    const s1 = getStats();
    s1.totalExecuted = 999;
    s1.byTransform['add-strict'] = 999;
    const s2 = getStats();
    assert.equal(s2.totalExecuted, 1);
    assert.equal(s2.byTransform['add-strict'], 1);
  });
});
