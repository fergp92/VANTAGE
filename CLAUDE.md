# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

**VANTAGE** (Verified Agent Network for Trusted, Governed Engineering) is a multi-agent development framework with an intelligent runtime. It orchestrates 34 AI agents through a spec-driven, security-first software development lifecycle with certification-backed expertise, persistent memory, and context-aware execution.

## Repository Structure

```
agents/              34 agent system prompts (NN-agent-name.md format)
docs/                Framework documentation and guides
bin/                 CLI entry point (npx vantage init)
.vantage/            v2.0 Runtime
├── runtime/         7 modules: memory-manager, toolkit-loader, token-estimator,
│   │                scout-service, agent-registry, maintenance, session-lock
│   └── __tests__/   50+ tests (Node.js built-in test runner)
├── skills/          6 phase skill definitions (discovery → operations)
├── toolkits/        7 agent indices + 24 tool definitions (YAML)
├── locks/           Session lock files (crash recovery)
├── memory/          Persistent agent memory (auto-managed, gitignored)
└── config.yml       Project configuration (ceremony levels, git strategy, etc.)
QUICKSTART.md        Entry point for new users
```

Key docs:
- `docs/VANTAGE.md` — Master framework specification
- `docs/MASTER-INVOCATION-GUIDE.md` — Prompt templates for invoking the framework
- `docs/agent-certification-map.md` — Professional certifications per agent
- `docs/team-presets.md` — YAML team configurations by project type
- `docs/DECISIONS-TEMPLATE.md` — Architecture Decision Record format

## Runtime (v2.0)

The runtime lives in `.vantage/runtime/` and uses Node.js ES modules with `js-yaml` as the only dependency.

### Running Tests

```bash
cd .vantage/runtime && npm install
node --test __tests__/*.test.js
```

### Key Modules

| Module | Exports | Purpose |
|--------|---------|---------|
| `memory-manager.js` | `load`, `appendLearning`, `graduate`, `compactIfNeeded` | Persistent agent memory with graduation rules |
| `toolkit-loader.js` | `loadIndex`, `loadTool`, `listTools` | Two-level YAML toolkit loading |
| `token-estimator.js` | `estimate`, `formatEstimate`, `track`, `formatDashboard` | Token cost estimation + actual usage tracking |
| `scout-service.js` | `loadCache`, `saveEvaluation`, `search` | OSS package evaluation cache |
| `agent-registry.js` | `loadAgent`, `getTeamAgents`, `buildPrompt` | Agent loading + subagent prompt assembly |
| `maintenance.js` | `shouldRun`, `audit` | Toolkit integrity + vulnerability auditing |
| `session-lock.js` | `acquireLock`, `releaseLock`, `checkStaleLocks`, `clearStaleLocks` | Crash recovery + session state |

All modules have CLI interfaces guarded by `import.meta.url` checks. They can be run directly or imported as libraries.

### Path Conventions

- Agent prompts: `agents/NN-agent-name.md`
- Toolkit indices: `.vantage/toolkits/NN-agent-name.index.yml`
- Tool definitions: `.vantage/toolkits/tools/tool-name.tool.yml`
- Agent memory: `.vantage/memory/agents/agent-id.md` (gitignored)
- Phase skills: `.vantage/skills/vantage-{phase}.md`
- Session locks: `.vantage/locks/{phase}-{timestamp}.lock`
- Cost ledger: `.vantage/memory/cost-ledger.yml`
- Project state: `backlog/PROJECT-STATE.md`

## Agent Numbering & Layers

Agents are numbered 00-33 and organized into layers:

| Range | Layer |
|-------|-------|
| 00, 24-26, 28 | META / Agile (Orchestration) |
| 01-03, 32 | Governance & Discovery |
| 04-07, 27, 33 | Architecture & Specifications |
| 08-11 | Security (Agent 08 has **veto power**) |
| 12-16 | Implementation (Domain > App > Adapters > Frontend > UI) |
| 17-20, 31 | Quality Assurance |
| 21-23, 29-30 | Operations |

Main agents (stay in context): 00, 08, 24. All others dispatched as subagents.

## Ceremony Levels

VANTAGE supports 4 ceremony levels based on task scope:

| Level | Agents | Phases | Use Case |
|-------|--------|--------|----------|
| **Quick** | 1 (Orchestrator only) | Implementation only | Bug fixes, config changes, one-file edits |
| **Standard** | Core team (00, 08, 27, 28) | Kickoff → Security (light) → Impl → QA | Features within existing architecture |
| **Full** | Team preset | All 8 phases | New features requiring spec changes |
| **Enterprise** | Custom team | All 8 + compliance | Regulated industries, SOC2/HIPAA/PCI |

## Core Framework Invariants

These rules must not be violated in any agent prompt or documentation:
1. Security phase always runs **before** implementation
2. Agent 08 (Security Architect) has **veto power** at any phase
3. No code is written until specs (OpenAPI, DB schema, wireframes) are approved
4. Clean Architecture: dependencies point inward only — Domain < App < Infrastructure < UI
5. Domain layer has zero external dependencies
6. Context quality degrades above 50% usage — always dispatch subagents with fresh sessions

## Development Framework

Follow VANTAGE phases 0-7 for all development work.
Read `docs/VANTAGE.md` for the full framework.
For each active agent, consult `docs/agent-certification-map.md`.

Use the token estimator before starting:
```bash
node .vantage/runtime/token-estimator.js estimate --complexity medium
```

Check for crash recovery on session start:
```bash
node .vantage/runtime/session-lock.js check
```

View cost dashboard:
```bash
node .vantage/runtime/token-estimator.js dashboard
```
