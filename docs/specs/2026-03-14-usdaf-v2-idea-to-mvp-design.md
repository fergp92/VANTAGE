# USDAF v2.0 — "Idea to MVP" Runtime Evolution

**Date**: 2026-03-14
**Status**: Draft
**Author**: Fergus + Claude
**Scope**: Framework evolution — memory, subagents, toolkits, OSS scout, skills integration

---

## 1. Vision

USDAF v2 transforms the framework from a system of static prompts into an **intelligent runtime** that learns, discovers, and optimizes tokens automatically. Someone arrives with an idea → USDAF orchestrates agents with memory, tools, and OSS knowledge → out comes an MVP with real value.

### Principles

- Everything is `.md` files + `.js` scripts — no database, no server
- Compatible with any project using Claude Code
- Agents are first-class citizens with memory, tools, and identity
- Subagents do the heavy lifting in isolated contexts
- Prompts in English for token efficiency (~15% less than Spanish)
- Single approval gate: user approves total token estimate before execution starts

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                 ORCHESTRATOR (main agent)                  │
│          Phase Skills · dispatch · token estimator         │
│                                                            │
│   discovery → architecture → security → impl → qa → ops   │
├────────┬──────────┬──────────┬──────────┬─────────────────┤
│ MEMORY │ TOOLKIT  │  SCOUT   │  MAINT.  │  TOKEN          │
│ SYSTEM │ ENGINE   │  SYSTEM  │  AGENT   │  ESTIMATOR      │
│        │          │          │          │                   │
│Session │ Index    │Proactive │Audits    │ Estimated range  │
│   ↕    │ (200tok) │(Discov.) │tools     │ per phase        │
│Persist │    ↕     │    +     │Deps/CVEs │ Single approval  │
│ (.md)  │On-demand │Reactive  │Upgrades  │ before start     │
│        │ (~500tok)│(Impl.)   │          │                   │
├────────┴──────────┴──────────┴──────────┴─────────────────┤
│               SUBAGENT DISPATCH ENGINE                     │
│                                                            │
│  Orchestrator (agent) ──spawn──► Subagents (isolated)      │
│  Security Arch (agent) ─spawn──► CVE lookup, npm audit     │
│  Test Architect (agent) ─spawn─► Coverage run, E2E         │
│                                                            │
│  Each subagent: own context → concrete result              │
│  Parallel when independent                                 │
├────────────────────────────────────────────────────────────┤
│                    AGENT RUNTIME (Node.js)                  │
│                                                            │
│  agent-registry.js  — agent → prompt + memory + toolkit    │
│  agent-dispatch.js  — spawn subagents, collect results     │
│  memory-manager.js  — load/save/compact/graduate           │
│  toolkit-loader.js  — index + on-demand loading            │
│  scout-service.js   — npm/GitHub search + eval cache       │
│  token-estimator.js — estimate + track + report            │
└────────────────────────────────────────────────────────────┘
```

### Typical Flow (idea → MVP)

1. User invokes USDAF with an idea
2. Token Estimator shows estimated range for the full project → user approves once
3. Orchestrator activates phase skill `discovery`
4. Discovery spawns **proactive OSS Scout** as subagent → maps stack against existing packages
5. Each agent is instantiated with **memory** (previous learnings) + **toolkit index**
6. Agents dispatch subagents for heavy work (searches, audits, tests)
7. At gate transitions, important learnings **graduate** to persistent memory
8. Maintenance Agent runs validating tools/deps health
9. Output: functional MVP

---

## 3. Agent Memory System

### 3a. Session Memory (within conversation)

```
Storage: in-context object (does not persist)
Format: { decisions: [], errors: [], discoveries: [] }
```

- Each agent accumulates **decisions** (what it chose and why), **errors** (what failed and root cause), and **discoveries** (unexpected findings)
- Passed between agents on handoff (e.g., Architecture → Security)
- At end of phase, Orchestrator performs **graduation**: extracts items marked `reusable: true` and promotes to persistent memory

### 3b. Persistent Memory (across sessions)

```
Storage: .md files in the project
Location: .usdaf/memory/agents/{agent-id}.md
Format: YAML frontmatter + dated entries
```

**Structure of a memory file:**

```markdown
---
agent: "08-security-architect"
total_invocations: 12
success_rate: 0.91
last_used: 2026-03-14
---

### 2026-03-14 — Project: kiwi-api
- [ERROR] Assumed bcrypt was installed without checking package.json. Always verify deps first.
- [DECISION] Chose Argon2 over bcrypt for hashing. Reason: GPU attack resistance, OWASP 2025 recommendation.

### 2026-03-10 — Project: gastoscope
- [DISCOVERY] Stack already had helmet.js configured. Don't duplicate security middleware.
```

**Injection**: memory-manager loads the last N entries (~500 tokens) and injects them as a `## Learnings from Previous Sessions` section at the top of the agent prompt.

**Compaction**: when a memory file exceeds 8K tokens, old learnings are summarized into general patterns and archived to `.usdaf/memory/archive/`.

**Graduation rules** (session → persistent):

| Condition | Graduates? |
|-----------|-----------|
| Error that cost >2 roundtrips to fix | Yes |
| Decision validated in code review | Yes |
| Discovery about the project stack | Yes |
| Routine operations, obvious fixes | No — discarded |

### 3c. Evaluation Memory (for the Scout)

```
Location: .usdaf/memory/evaluations.md
```

```markdown
### better-sqlite3 (npm)
- Rating: ★★★★★
- Used in: nexus, gastoscope
- Verdict: Excellent. Sync API, zero deps, 3x faster than sqlite3.
- Last evaluated: 2026-03-01

### pdf-parse (npm)
- Rating: ★★☆☆☆
- Verdict: Abandoned, last release 2022. Use pdf2json instead.
- Last evaluated: 2026-02-15
```

Loaded **only when the Scout is active**. ~50 tokens per entry.

---

## 4. Subagent Dispatch System

### 4a. Agents vs Subagents

**Agents** remain in the main conversation context. They need global visibility:

| Agent | Reason |
|-------|--------|
| 00-Orchestrator | Needs full picture, makes phase decisions |
| 08-Security Architect | Veto power, needs to see everything |
| 24-Project Manager | Manages gates, needs global state |

**Subagents** run in isolated contexts. Everything else:

- Each subagent receives only what it needs (task + relevant specs + memory)
- Returns a concrete artifact (file, JSON, list) — not prose
- Can run in parallel when independent
- Can be nested (a subagent can spawn its own subagents)

### 4b. Dispatch Protocol

```javascript
// agent-dispatch.js
async function dispatchSubagent({
  agentId,          // "17-test-architect"
  task,             // "Generate test strategy for auth module"
  context,          // { projectStack, relevantSpecs, memory }
  isolation,        // "worktree" | "none"
  parallel,         // true = don't await immediately
  maxTokens,        // budget cap for this subagent
}) → { result, tokensUsed, learnings[] }
```

### 4c. Dispatch Patterns

**Sequential** (one depends on another):

```
Orchestrator
  → spawn Requirements Architect → specs
  → spawn Data Architect (with specs) → ERD
  → spawn Security Review (with ERD + specs) → threat model
```

**Parallel** (independent):

```
Orchestrator
  ├→ spawn OSS Scout → dependency map
  ├→ spawn Requirements Architect → specs
  └→ spawn Compliance → framework mapping
  (awaits all 3, then continues)
```

**Nested** (subagent spawns sub-subagent):

```
Implementation Agent (subagent)
  └→ spawn OSS Scout reactive: "need a JWT library"
     → result: "use jose, evaluation ★★★★★"
```

### 4d. Token Impact

```
WITHOUT SUBAGENTS (sequential in context):
  Agent 1: +3K to context
  Agent 2: +3K (reads 3K from agent 1 = 6K input)
  Agent 3: +3K (reads 6K prior = 9K input)
  ...
  Agent 10: +3K (reads 27K prior = 30K input)
  Total input tokens: ~135K

WITH SUBAGENTS (isolated):
  Subagent 1: 3K context → returns ~500 tokens result
  Subagent 2: 3K context → returns ~500 tokens
  ...
  Subagent 10: 3K context → returns ~500 tokens
  Orchestrator accumulates: 10 × 500 = 5K tokens
  Total input tokens: ~35K (75% reduction)
```

---

## 5. Toolkit Engine

### 5a. Lightweight Index (always loaded, ~200 tokens per agent)

```yaml
# .usdaf/toolkits/08-security-architect.index.yml
agent: "08-security-architect"
tools:
  - id: stride-analysis
    description: "STRIDE threat model template with per-component analysis"
  - id: npm-audit
    description: "Run npm audit and parse results into risk matrix"
  - id: cve-lookup
    description: "Search CVE database for known vulnerabilities in deps"
  - id: controls-matrix
    description: "Map controls to NIST 800-53 / ISO 27001 / OWASP"
  - id: owasp-checklist
    description: "OWASP Top 10 verification checklist for code review"
```

### 5b. Full Definition (loaded on-demand, ~500 tokens each)

```yaml
# .usdaf/toolkits/tools/stride-analysis.tool.yml
id: stride-analysis
description: "STRIDE threat model template"
when_to_use: "During security review of new components or APIs"
input:
  - name: component_name
    type: string
    required: true
  - name: data_flows
    type: array
    description: "List of data flows to analyze"
template: |
  ## STRIDE Analysis: {{component_name}}

  | Threat | Applies? | Mitigation | Status |
  |--------|----------|------------|--------|
  | Spoofing | | | |
  | Tampering | | | |
  | Repudiation | | | |
  | Info Disclosure | | | |
  | Denial of Service | | | |
  | Elevation of Priv. | | | |

  ### Data Flows
  {{#each data_flows}}
  - {{this}}: [threat analysis]
  {{/each}}
output: "threat-model.md artifact"
```

### 5c. Toolkits by Agent

| Agent | Tools |
|-------|-------|
| 02-Requirements Architect | user-story-template, acceptance-criteria-generator, requirement-classifier |
| 05-Data Architect | erd-generator, migration-template, schema-validator |
| 06-Integration Architect | openapi-validator, api-contract-template, breaking-change-detector |
| 08-Security Architect | stride-analysis, npm-audit, cve-lookup, controls-matrix, owasp-checklist |
| 15-Frontend Architect | component-inventory, accessibility-checklist, bundle-analyzer |
| 17-Test Architect | coverage-matrix, test-strategy-template, e2e-scenario-generator |
| 25-Innovation Scout | npm-search, github-search, license-checker, package-evaluator |

---

## 6. OSS Scout System

### 6a. Proactive Scout (Discovery phase)

Spawned as a subagent during Discovery. Receives requirements and maps:

```
Input: "Need auth, file upload, PDF generation, email sending"

Output: dependency-map.md
┌─────────────────┬──────────────────┬────────┬───────────┐
│ Requirement     │ Package          │ Rating │ Decision  │
├─────────────────┼──────────────────┼────────┼───────────┤
│ Auth/JWT        │ jose             │ ★★★★★  │ USE       │
│ File upload     │ multer           │ ★★★★☆  │ USE       │
│ PDF generation  │ pdf-lib          │ ★★★★★  │ USE       │
│ Email           │ nodemailer       │ ★★★★★  │ USE       │
│ ORM             │ drizzle-orm      │ ★★★★☆  │ EVALUATE  │
│ Validation      │ zod              │ ★★★★★  │ USE       │
└─────────────────┴──────────────────┴────────┴───────────┘
```

**Evaluation criteria:**

- Active maintenance (last commit < 6 months)
- Weekly downloads (npm) / stars (GitHub)
- Open vs closed issues ratio
- Known vulnerabilities (npm audit)
- Compatible license
- Previous evaluations in memory

### 6b. Reactive Scout (Implementation phase)

Any agent can spawn it during implementation:

```
Agent 14 (Adapters): "Need an S3 client compatible with MinIO"
  → spawn Scout reactive
  → result: "@aws-sdk/client-s3 ★★★★★, MinIO compatible,
     already used in gastoscope project with good results"
```

### 6c. Evaluation Cache

All evaluations persist in `.usdaf/memory/evaluations.md`. Before searching, the Scout checks the cache. If evaluation is < 90 days old, it reuses it. If > 90 days, it re-evaluates.

---

## 7. Skills Integration (Phase + Tool)

### 7a. Phase Skills (for the Orchestrator)

Each USDAF phase is encapsulated in a skill the Orchestrator invokes:

```
skills/
  usdaf-discovery.md      → Phase 1: requirements, OSS scout, stack mapping
  usdaf-architecture.md   → Phase 2: C4, DDD, API contracts, ERD
  usdaf-security.md       → Phase 3: threat model, controls, STRIDE
  usdaf-implementation.md → Phase 4: TDD, code generation, reactive scout
  usdaf-qa.md             → Phase 5: test execution, coverage, review
  usdaf-operations.md     → Phase 6: CI/CD, observability, deploy
```

Each phase skill defines:

- Which agents/subagents to activate
- What artifacts to expect as output
- Gate criteria to pass to the next phase
- Token budget estimate for that phase

### 7b. Tool Skills (for individual agents)

Agents use existing ecosystem skills as cross-cutting tools:

| Skill | Used by | Purpose |
|-------|---------|---------|
| brainstorming | Requirements Architect | Explore ideas with the user |
| test-driven-development | Test Architect, Implementation | Write tests before code |
| systematic-debugging | Any agent | When something fails during execution |
| verification-before-completion | QA, Code Review | Verify before marking done |
| writing-plans | Orchestrator | Create implementation plan per phase |

**Rule**: phase skills control the flow (what happens and when), tool skills improve execution (how it's done).

---

## 8. Maintenance Agent

Subagent that runs on-demand or at the start of each project to audit toolkit and dependency health.

### Responsibilities

- Verify that tools defined in toolkits are still valid
- Search for new CVEs in packages from evaluation memory
- Update ratings in evaluations.md if a package was abandoned/compromised
- Suggest upgrades when better alternatives exist
- Report to Orchestrator if something requires action

### Output

```markdown
# Maintenance Report — 2026-03-14

## ⚠️ Action Required
- pdf-parse: DEPRECATED, 0 commits in 2 years. Replace with pdf2json.
- lodash: CVE-2025-XXXXX (prototype pollution). Upgrade to 4.17.22+.

## ✅ All Clear
- jose, zod, drizzle-orm, multer: healthy, no issues.

## 📊 Stats
- 45 packages tracked
- 2 need action
- Last full audit: 2026-03-01
```

### Trigger

Runs automatically at project start if last audit is > 30 days old.

---

## 9. Token Estimator

Integrated in the Orchestrator. At the start of a project, estimates tokens and requests a single approval.

### Approval Flow

```
╔══════════════════════════════════════════════════╗
║  USDAF v2.0 — Token Estimate                    ║
║                                                  ║
║  Project: kiwi-api auth module                   ║
║  Team: 8 agents active                           ║
║  Complexity: Medium (API + DB + Auth)            ║
║                                                  ║
║  Estimated range: 150K - 250K tokens             ║
║                                                  ║
║  Breakdown:                                      ║
║  · Discovery + Scout:     20-35K                 ║
║  · Architecture + Specs:  25-40K                 ║
║  · Security Review:       15-25K                 ║
║  · Implementation:        50-80K                 ║
║  · QA + Tests:            25-40K                 ║
║  · Operations + Docs:     15-30K                 ║
║                                                  ║
║  Memory savings (est.):   -30K (cached learnings)║
║  Scout savings (est.):    -20K (reused packages)  ║
║                                                  ║
║  Proceed? [Y/n]                                  ║
╚══════════════════════════════════════════════════╝
```

The phase breakdown is **informational only**. The user approves once for the entire project. No per-phase approvals.

### Estimation Factors

- Number of active agents × phase complexity
- Number of specs to generate
- Stack size (more deps = more scout work)
- Available memory (more memory = less re-discovery)
- History of similar projects

---

## 10. File Structure

```
.usdaf/
├── config.yml                    # USDAF project configuration
├── memory/
│   ├── agents/
│   │   ├── 00-orchestrator.md
│   │   ├── 08-security-architect.md
│   │   └── ...
│   ├── archive/                  # Compacted memories
│   └── evaluations.md            # OSS evaluation cache
├── toolkits/
│   ├── 08-security-architect.index.yml
│   ├── 17-test-architect.index.yml
│   ├── ...
│   └── tools/
│       ├── stride-analysis.tool.yml
│       ├── npm-audit.tool.yml
│       ├── coverage-matrix.tool.yml
│       └── ...
├── runtime/
│   ├── agent-registry.js         # Agent → prompt + memory + toolkit
│   ├── agent-dispatch.js         # Spawn subagents, collect results
│   ├── memory-manager.js         # Load/save/compact/graduate
│   ├── toolkit-loader.js         # Index + on-demand loading
│   ├── scout-service.js          # npm/GitHub search + eval cache
│   ├── token-estimator.js        # Estimate + track + report
│   └── maintenance.js            # Audit tools/deps
└── skills/
    ├── usdaf-discovery.md
    ├── usdaf-architecture.md
    ├── usdaf-security.md
    ├── usdaf-implementation.md
    ├── usdaf-qa.md
    └── usdaf-operations.md
```

---

## 11. Quickstart

```bash
# 1. Init USDAF in a project
npx usdaf init

# 2. Select team preset
? Team preset: Full Stack Application

# 3. In Claude Code, invoke
> "Build a REST API for user management with JWT auth,
>  PostgreSQL, and role-based access control"

# USDAF automatically:
# → Shows token estimate → user approves once
# → Discovery: requirements + OSS Scout (jose, drizzle, zod...)
# → Architecture: API contract, ERD, C4 diagrams
# → Security: STRIDE, controls matrix, veto check
# → Implementation: TDD, code gen, reactive scout
# → QA: tests, coverage, code review
# → Output: functional MVP with tests
```

---

## 12. Runtime Invocation & Init

### 12a. What `npx usdaf init` does

USDAF v2 ships as an npm package (`usdaf`). The init command:

1. Creates the `.usdaf/` directory structure (memory, toolkits, runtime, skills)
2. Generates `.usdaf/config.yml` from user prompts (team preset, project name)
3. Copies phase skill files into `.usdaf/skills/`
4. Copies toolkit indices for the selected team preset agents
5. Adds `.usdaf/memory/` to `.gitignore` (personal learnings, not shared)
6. Adds `.usdaf/toolkits/` and `.usdaf/skills/` to git (shared team knowledge)
7. Injects a `CLAUDE.md` section that tells Claude Code how to load the USDAF runtime

### 12b. How it hooks into Claude Code

The USDAF runtime is **prompt-driven, not code-driven**. The `.usdaf/` files are consumed by Claude Code through:

- **CLAUDE.md injection**: `npx usdaf init` adds instructions to CLAUDE.md that tell Claude to read `.usdaf/config.yml` and follow the phase skills
- **Skills**: phase skills (`.usdaf/skills/usdaf-*.md`) are registered as Claude Code skills via the superpowers plugin system
- **Subagent dispatch**: uses Claude Code's native `Agent` tool with `subagent_type` parameter — no custom process spawning
- **Worktree isolation**: uses Claude Code's native `isolation: "worktree"` parameter on the Agent tool

The runtime `.js` files are **helper scripts** that Claude Code calls via Bash, not a standalone server:

```bash
# Claude Code runs these as needed:
node .usdaf/runtime/memory-manager.js load 08-security-architect
node .usdaf/runtime/toolkit-loader.js load stride-analysis
node .usdaf/runtime/scout-service.js search "jwt library node"
node .usdaf/runtime/token-estimator.js estimate --preset fullstack --complexity medium
node .usdaf/runtime/maintenance.js audit
```

### 12c. Config Schema

```yaml
# .usdaf/config.yml
project:
  name: "kiwi-api"
  description: "IAM platform API"
  stack: [node, fastify, postgresql, docker]

team:
  preset: "fullstack"          # from team-presets.md
  agents_override: []          # add/remove specific agents

memory:
  injection_budget: 500        # default tokens per agent, configurable
  compaction_threshold: 8000   # tokens before compaction triggers
  graduation: auto             # auto | manual | disabled

scout:
  cache_ttl_days: 90           # re-evaluate packages older than this
  registries: [npm, github]    # where to search
  license_whitelist: [MIT, Apache-2.0, BSD-3-Clause, ISC]

maintenance:
  auto_trigger_days: 30        # audit if last run > N days ago
  cve_sources: [npm-audit, github-advisories]

tokens:
  show_estimate: true          # show estimate before starting
  track_actual: true           # track actual usage per phase
```

---

## 13. Subagent Spawn Mechanism

Subagents are spawned using **Claude Code's native Agent tool**. No custom process management.

### How it works

When the Orchestrator (or any main agent) needs to dispatch a subagent:

1. **Build prompt**: `agent-registry.js` assembles the subagent prompt by combining:
   - Agent definition from `agents/{id}.md`
   - Memory from `.usdaf/memory/agents/{id}.md` (last N entries)
   - Toolkit index from `.usdaf/toolkits/{id}.index.yml`
   - Task-specific context (specs, artifacts from prior phases)

2. **Dispatch**: Claude Code's Agent tool is invoked:
   ```
   Agent({
     description: "Security review of auth module",
     prompt: [assembled prompt from step 1],
     subagent_type: "general-purpose",
     isolation: "worktree",  // when agent writes code
     run_in_background: true // when parallel
   })
   ```

3. **Collect**: the Agent tool returns a result string. The Orchestrator parses it for:
   - Artifacts produced (files created/modified)
   - Learnings to potentially graduate
   - Issues or vetoes raised

### Worktree isolation

- `isolation: "worktree"` creates a temporary git worktree — the subagent gets its own copy of the repo
- Used when the subagent writes code (Implementation, Test, Frontend agents)
- NOT used for analysis-only agents (Security review, Compliance, Scout)
- Changes from worktree are merged back after the subagent completes

### Parallel dispatch

Multiple Agent tool calls in a single message = parallel execution:

```
// Orchestrator sends one message with 3 Agent calls:
Agent({ prompt: "Requirements analysis...", run_in_background: true })
Agent({ prompt: "OSS Scout mapping...", run_in_background: true })
Agent({ prompt: "Compliance framework check...", run_in_background: true })
// All 3 run concurrently, Orchestrator is notified as each completes
```

---

## 14. Error Handling & Failure Modes

### 14a. Subagent Failures

| Failure | Detection | Response |
|---------|-----------|----------|
| Subagent returns no artifacts | Result parsing finds no files/JSON | Retry once with simplified prompt. If fails again, escalate to user: "Agent X couldn't complete task Y. Proceed manually?" |
| Subagent exceeds token budget | Token tracking in result metadata | Kill subagent, use partial results if available, log as [ERROR] in memory |
| Subagent returns incoherent output | Orchestrator validates result format | Discard result, retry with explicit output format instructions |
| Subagent timeout (>10 min) | Claude Code's built-in timeout | Log timeout, proceed without that agent's output, flag to user |

### 14b. Memory Failures

| Failure | Detection | Response |
|---------|-----------|----------|
| Memory file corrupted/unparseable | YAML parse error on load | Log warning, start agent with empty memory, rebuild from archive if available |
| Memory file missing | File not found on load | Create fresh memory file, agent starts without learnings |
| Compaction produces bad summary | N/A (detected on next load) | Keep original file as `.bak`, retry compaction next session |
| Write failure (permissions/disk) | OS error on save | Log error, keep learnings in session only, warn user |

### 14c. Scout Failures

| Failure | Detection | Response |
|---------|-----------|----------|
| npm registry unreachable | HTTP error / timeout | Fall back to evaluation cache only. If cache empty, log and let agent decide manually |
| GitHub API rate limited | 403 response | Use cached evaluations, skip new searches, note in report |
| Package evaluation returns no results | Empty search results | Log as "no package found", agent writes custom code |
| License incompatible | License check fails | Mark package as REJECT in evaluation, suggest alternatives |

### 14d. Toolkit Failures

| Failure | Detection | Response |
|---------|-----------|----------|
| Tool definition file missing | File not found on load | Agent proceeds without that tool, logs warning |
| Template has unresolved variables | Mustache parse error | Return raw template to agent, let it fill manually |
| Tool action fails (e.g., npm audit crash) | Non-zero exit code | Log error, agent proceeds with manual analysis |

### 14e. General Principle

**Degrade gracefully, never block**. Every failure mode has a fallback that lets the project continue. The system logs what went wrong so memory captures the issue for next time.

---

## 15. Phase Mapping (v1.0 → v2.0)

USDAF v1.0 has 8 phases (0-7). v2.0 consolidates into 6 phase skills for simplicity, mapping as follows:

| v1.0 Phase | v2.0 Phase Skill | Notes |
|------------|------------------|-------|
| 0 - Kickoff | (handled by Orchestrator) | Config, team selection, token estimate — not a separate skill |
| 1 - Discovery | `usdaf-discovery` | Requirements + OSS Scout |
| 2 - Architecture | `usdaf-architecture` | C4, DDD, API contracts, ERD |
| 3 - Security | `usdaf-security` | STRIDE, controls, veto gate |
| 4 - Implementation | `usdaf-implementation` | TDD, code gen, reactive scout |
| 5 - QA | `usdaf-qa` | Tests, coverage, code review |
| 6 - Operations | `usdaf-operations` | CI/CD, observability, deploy |
| 7 - Governance | (merged into operations) | Ongoing governance handled by Maintenance Agent |

Phase 0 (Kickoff) becomes the Orchestrator's init sequence. Phase 7 (Governance) merges into operations + Maintenance Agent for ongoing health.

---

## 16. Runtime Module Interfaces

### 16a. agent-registry.js

```javascript
// Load agent definition with memory and toolkit
function loadAgent(agentId, projectConfig) → {
  prompt: string,         // full agent prompt from agents/{id}.md
  memory: string,         // last N learnings formatted as markdown section
  toolkitIndex: string,   // toolkit index YAML as string
  config: {               // agent-specific config
    memoryBudget: number, // tokens for memory injection
    isMainAgent: boolean, // stays in context vs subagent
  }
}

// List agents for a team preset
function getTeamAgents(preset) → string[]  // ["00", "02", "05", "08", ...]

// Build complete prompt for dispatch
function buildPrompt(agentId, task, context, projectConfig) → string
```

### 16b. memory-manager.js

```javascript
// Load agent memory (returns formatted markdown, truncated to budget)
function load(agentId, tokenBudget?) → string

// Save a learning entry
function appendLearning(agentId, entry: { type, content, project, reusable }) → void

// Graduate session learnings to persistent storage
function graduate(agentId, sessionMemory: { decisions, errors, discoveries }) → {
  graduated: number,  // count of entries promoted
  discarded: number   // count of entries dropped
}

// Check and run compaction if needed
function compactIfNeeded(agentId) → { compacted: boolean, beforeTokens, afterTokens }
```

### 16c. toolkit-loader.js

```javascript
// Load lightweight index for an agent
function loadIndex(agentId) → string  // YAML string, ~200 tokens

// Load full tool definition on demand
function loadTool(toolId) → string  // YAML string with template, ~500 tokens

// List available tools for an agent
function listTools(agentId) → Array<{ id, description }>
```

### 16d. scout-service.js

```javascript
// Search for packages matching a requirement
function search(query, options?: { registry, licenseWhitelist }) → Array<{
  name: string,
  registry: "npm" | "github",
  rating: number,        // 1-5
  downloads: number,
  lastCommit: string,
  license: string,
  vulnerabilities: number,
  cached: boolean,       // from evaluation cache?
  verdict: "USE" | "EVALUATE" | "REJECT"
}>

// Load evaluation cache
function loadCache() → Map<string, Evaluation>

// Save evaluation to cache
function saveEvaluation(packageName, evaluation) → void
```

### 16e. token-estimator.js

```javascript
// Estimate tokens for a project
function estimate(projectConfig) → {
  total: { min: number, max: number },
  phases: Array<{ name, min, max }>,
  savings: { memory: number, scout: number },
  factors: string[]  // human-readable explanation of estimate basis
}

// Estimation algorithm:
// Base cost per agent per phase: ~3-5K tokens (prompt + reasoning + output)
// Multiply by complexity factor: simple=0.7, medium=1.0, complex=1.5
// Add spec generation overhead: ~2K per spec document
// Add scout overhead: ~1K per requirement to evaluate
// Subtract memory savings: ~500 per cached learning applied
// Subtract scout savings: ~2K per package reused from cache
// Apply parallel discount: subagents don't compound context, ~20% savings
// Range = [base * 0.8, base * 1.3] to account for variance
```

### 16f. maintenance.js

```javascript
// Run full audit of tracked packages and toolkits
function audit() → {
  report: string,          // formatted markdown report
  actionRequired: Array<{ package, issue, severity, recommendation }>,
  allClear: string[],      // healthy packages
  stats: { tracked, needsAction, lastAudit }
}

// Trigger check: should audit run?
function shouldRun(config) → boolean  // true if last audit > config.maintenance.auto_trigger_days
```

---

## 17. Versioning & Git Strategy

### What gets committed (shared team knowledge)

- `.usdaf/config.yml` — project configuration
- `.usdaf/toolkits/` — toolkit indices and tool definitions
- `.usdaf/skills/` — phase and tool skill definitions

### What gets gitignored (personal learnings)

- `.usdaf/memory/` — agent memories are per-developer, not shared
- `.usdaf/memory/archive/` — compacted memories

**Rationale**: memory contains learnings specific to an individual's interaction style and mistakes. Sharing it would inject irrelevant context into other developers' agents. Toolkits and skills are universal — everyone benefits from the same tools.

**Exception**: `.usdaf/memory/evaluations.md` IS committed — package evaluations are project knowledge, not personal.

### Migration from v1.0

No automated migration tool needed. v2.0 is additive:

1. Run `npx usdaf init` in existing USDAF project
2. Existing `agents/*.md` files are untouched — v2.0 reads them as-is
3. Existing `Arch standard/` files are untouched — v2.0 references them
4. New `.usdaf/` directory is created alongside existing structure
5. Phase skills reference existing agent definitions by ID

---

## 18. Concurrency Control

When multiple subagents run in parallel:

- **File writes**: parallel subagents that write code MUST use `isolation: "worktree"` — each gets its own copy, changes merge sequentially after completion
- **Memory writes**: memory-manager uses append-only writes with timestamps — no conflicts possible (each entry is a new section)
- **Scout searches**: multiple scouts can search simultaneously — evaluation cache uses last-write-wins (newer evaluation always supersedes)
- **Toolkit loads**: read-only, no contention

**Nested scout limit**: maximum 2 concurrent Scout subagents to avoid npm/GitHub rate limits.

---

## 19. Estimated Development Cost

Implementing USDAF v2.0 complete (runtime + toolkits + skills + memory + scout + maintenance):

| Component | Estimated Tokens |
|-----------|-----------------|
| Runtime modules (6 .js files) | 80-120K |
| Toolkit definitions (~25 tools) | 40-60K |
| Phase skills (6 skills) | 50-70K |
| Agent prompt updates (48 agents) | 30-50K |
| Config, init, CLAUDE.md integration | 20-30K |
| Testing & validation | 50-80K |
| Documentation & quickstart | 30-40K |
| **Total** | **300K - 450K** |
