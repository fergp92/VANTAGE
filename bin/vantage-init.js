#!/usr/bin/env node

/**
 * VANTAGE v2.0 CLI
 * Usage: npx vantage init [--name <name>] [--preset <preset>]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CWD = process.cwd();
const VANTAGE_DIR = path.join(CWD, '.vantage');

const PKG_ROOT = path.resolve(__dirname, '..');
const SRC_RUNTIME = path.join(PKG_ROOT, '.vantage', 'runtime');
const SRC_TOOLKITS = path.join(PKG_ROOT, '.vantage', 'toolkits');
const SRC_SKILLS = path.join(PKG_ROOT, '.vantage', 'skills');
const SRC_CONFIG = path.join(PKG_ROOT, '.vantage', 'config.yml');

function main() {
  console.log('VANTAGE v2.0 — Initializing...\n');

  // 1. Create directory structure
  const dirs = [
    '.vantage/runtime', '.vantage/runtime/__tests__',
    '.vantage/toolkits/tools', '.vantage/skills',
    '.vantage/memory/agents', '.vantage/memory/archive',
  ];
  for (const dir of dirs) {
    const full = path.join(CWD, dir);
    fs.mkdirSync(full, { recursive: true });
    console.log(`  Created: ${dir}/`);
  }

  // 2. Copy runtime files
  if (fs.existsSync(SRC_RUNTIME)) {
    copyDir(SRC_RUNTIME, path.join(VANTAGE_DIR, 'runtime'));
    console.log('  Copied: runtime modules');
  }

  // 3. Copy toolkits
  if (fs.existsSync(SRC_TOOLKITS)) {
    copyDir(SRC_TOOLKITS, path.join(VANTAGE_DIR, 'toolkits'));
    console.log('  Copied: toolkit definitions');
  }

  // 4. Copy skills
  if (fs.existsSync(SRC_SKILLS)) {
    copyDir(SRC_SKILLS, path.join(VANTAGE_DIR, 'skills'));
    console.log('  Copied: phase skills');
  }

  // 5. Copy default config
  if (fs.existsSync(SRC_CONFIG)) {
    fs.copyFileSync(SRC_CONFIG, path.join(VANTAGE_DIR, 'config.yml'));
    console.log('  Created: config.yml');
  }

  // 6. Create .gitkeep files for empty directories
  for (const dir of ['memory/agents', 'memory/archive']) {
    const gitkeep = path.join(VANTAGE_DIR, dir, '.gitkeep');
    if (!fs.existsSync(gitkeep)) {
      fs.writeFileSync(gitkeep, '', 'utf-8');
    }
  }
  console.log('  Created: .gitkeep files for empty dirs');

  // 7. Create empty evaluations.md
  const evalFile = path.join(VANTAGE_DIR, 'memory', 'evaluations.md');
  if (!fs.existsSync(evalFile)) {
    fs.writeFileSync(evalFile, '# VANTAGE Evaluation Cache\n\n', 'utf-8');
    console.log('  Created: memory/evaluations.md');
  }

  // 8. Update .gitignore
  updateGitignore(CWD);

  // 9. Inject CLAUDE.md section
  injectClaudeMd(CWD);

  console.log('\nVANTAGE v2.0 initialized successfully!');
  console.log('Edit .vantage/config.yml to configure your project.\n');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updateGitignore(cwd) {
  const gitignorePath = path.join(cwd, '.gitignore');
  const entries = [
    '# VANTAGE v2.0 — personal agent memories (not shared)',
    '.vantage/memory/agents/',
    '.vantage/memory/archive/',
    '# Keep evaluations.md (project knowledge)',
    '!.vantage/memory/evaluations.md',
  ];
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }
  if (content.includes('.vantage/memory/agents/')) {
    console.log('  .gitignore: already configured');
    return;
  }
  content += '\n' + entries.join('\n') + '\n';
  fs.writeFileSync(gitignorePath, content, 'utf-8');
  console.log('  Updated: .gitignore');
}

function injectClaudeMd(cwd) {
  const claudeMdPath = path.join(cwd, 'CLAUDE.md');
  const section = `
## VANTAGE v2.0 Runtime

This project uses VANTAGE v2.0. Before writing code:

1. Read \`.vantage/config.yml\` for project configuration
2. Use phase skills in \`.vantage/skills/\` to guide each development phase
3. Load agent memory before dispatching: \`node .vantage/runtime/memory-manager.js load {agent-id}\`
4. Load toolkit index for each agent: \`node .vantage/runtime/toolkit-loader.js index {agent-id}\`
5. Use the token estimator before starting: \`node .vantage/runtime/token-estimator.js estimate\`
6. Run maintenance check: \`node .vantage/runtime/maintenance.js check\`
7. After each phase, graduate learnings: save \`[DECISION]\`, \`[ERROR]\`, \`[DISCOVERY]\` entries via memory-manager

### Agent Dispatch
- Main agents (00-Orchestrator, 08-Security, 24-PM): stay in conversation context
- All other agents: dispatch as subagents via Claude Code's Agent tool
- Use \`node .vantage/runtime/agent-registry.js prompt {agent-id} "{task}"\` to build prompts
- Use \`isolation: "worktree"\` for agents that write code
- Use \`run_in_background: true\` for parallel dispatch
`;

  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(claudeMdPath, section.trim() + '\n', 'utf-8');
    console.log('  Created: CLAUDE.md with VANTAGE v2.0 section');
    return;
  }
  let content = fs.readFileSync(claudeMdPath, 'utf-8');
  if (content.includes('VANTAGE v2.0 Runtime')) {
    console.log('  CLAUDE.md: VANTAGE section already present');
    return;
  }
  content += '\n' + section;
  fs.writeFileSync(claudeMdPath, content, 'utf-8');
  console.log('  Updated: CLAUDE.md with VANTAGE v2.0 section');
}

// CLI entry — guarded
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const subcommand = process.argv[2];
  if (subcommand === 'init' || !subcommand) {
    main();
  } else {
    console.error(`Unknown command: ${subcommand}\nUsage: npx vantage init [--name <name>] [--preset <preset>]`);
    process.exit(1);
  }
}
