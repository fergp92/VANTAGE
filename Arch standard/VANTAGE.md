# VANTAGE — Unified Spec-Driven Agile Framework

> **No code is written until specs exist and are approved. Specs are the source of truth.**
> **No code stays in the codebase if it duplicates a canonical implementation. CANONICAL.md is the structural source of truth.**

## Overview

VANTAGE merges the Multi-Agent Framework (25 agents, 7 phases, security gates) with spec-driven development and Backlog.md-style markdown-native task management into a single unified framework. Every development project passes through required phases with a project-specific agent team.

VANTAGE has three layers built incrementally:

- **v1.0 — Spec-Driven Foundation**: 34 agents (00-33), 8 phases, gates G-1 through G5, security veto.
- **v2.0 — Intelligent Runtime (Pillar A)**: agent memory, subagent dispatch, adaptive toolkits, OSS scout, drift detection (spec→implementation alignment).
- **v2.0 — Structural Defense (Pillar B)**: Agent 34 (Structural Coherence), CANONICAL.md, Forced-Context Preamble, Gate G3.5, Consolidation Sprint cadence.

Pillar B is mandatory for projects starting after 2026-05-03. Existing v1.0 / v2.0-Pillar-A projects can adopt Pillar B incrementally — see `docs/superpowers/specs/2026-05-03-vantage-v2-pillar-b-structural-defense.md` for the retrofit path.

### Core Principles

1. **Spec-First**: Formal specifications (OpenAPI, DB schema, wireframes, event contracts) are produced and approved BEFORE any implementation begins
2. **PRD Before Spec**: A Product Requirements Document anchors the project on a real user problem and one core feature BEFORE technical specs begin (Gate G0a)
3. **Canonical-First**: Each cross-cutting concern has ONE canonical implementation declared in `CANONICAL.md`. Alternatives require an ADR.
4. **Phase-Gated**: 8 phases (0-7) with explicit gates; no phase proceeds without gate approval
5. **Team-Based**: Each project selects its agent team at kickoff — mandatory core + optional specialists
6. **Backlog-Driven**: All work tracked as markdown task files in `backlog/` directory, git-versioned
7. **Security Veto**: Agent 08 (Security Architect) retains veto power at any phase
8. **Structural Veto**: Agent 34 (Structural Coherence) holds veto on sprint close (Gate G3.5)
9. **Backward Compatible**: Existing Prompts A-D continue to work unchanged

---

## Agent Registry (35 Agents: 00-34)

### CAPA META — Orchestration & Management

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 00 | Orchestrator | Conductor / Entry Point | Coordinates all agents, team selection, phase routing |
| 24 | Project Manager | PM / Phase Manager | Phase transitions, gate approvals, conflict resolution |
| 25 | Innovation Scout | Market Intelligence | Gartner MQ analysis, vendor comparison, competitive intel |
| 26 | Product Owner | Product Manager | Backlog ownership, story acceptance, priority (MoSCoW), ROI |
| 28 | Backlog Manager | Scrum Master | Sprint planning, backlog grooming, velocity, ceremonies, DoD enforcement |
| 34 | Structural Coherence | Anti-Drift Auditor | **VETO POWER on Gate G3.5**, owns CANONICAL.md, blocks sprint close on duplication, dead code, doc-vs-reality drift, or canonical bypass |

### CAPA 0 — Governance & Discovery

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 01 | Architecture Board | Chief Architect | ADR review, veto power, dependency enforcement |
| 02 | Requirements Architect | Business Analyst | FR/NFR elicitation, acceptance criteria, feeds into Spec Writer |
| 03 | Compliance & Regulatory | Compliance Officer | GDPR, ISO, TPN, regulation mapping, data classification |
| 32 | UX Researcher | User Researcher | Personas, journey maps, usability testing, accessibility audits |

### CAPA 1 — Architecture & Specifications

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 04 | Enterprise Architect | Solution Architect | C4 diagrams, tech stack, DDD bounded contexts |
| 05 | Data Architect | Domain/Data Architect | Domain model (DDD), ERD, data classification, UUIDs |
| 06 | Integration Architect | API Architect | OpenAPI/AsyncAPI contracts, versioning strategy |
| 07 | Infrastructure Architect | Cloud/Platform Architect | IaC, networking, Kubernetes, DR planning |
| 27 | Spec Writer | Technical Spec Author | Produces formal specs: OpenAPI, JSON Schema, AsyncAPI, DB schema, wireframes |
| 33 | Data Engineer | ETL / Pipeline Engineer | Data pipelines, migrations, seeding, backup, CDC patterns |

### CAPA 2 — Security

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 08 | Security Architect | Security Architect / CISO | **VETO POWER**, STRIDE, defense in depth, controls matrix |
| 09 | IAM Agent | Identity & Access | OAuth 2.1, OIDC, RBAC, MFA, token strategy |
| 10 | Secrets & Crypto | Cryptography Specialist | AES-256-GCM, vault, key rotation, TLS |
| 11 | Threat Intelligence | Red Team / Offensive | Abuse cases, OWASP, attack surface, supply chain |

### CAPA 3 — Implementation

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 12 | Domain Logic | Domain Engineer | Pure business logic (DDD), entities, use cases, zero deps |
| 13 | App Services | Application Layer Dev | Orchestration, DTOs, authorization, transactions |
| 14 | Adapters | Infrastructure/Adapter Dev | Repos, parameterized queries, secure DB access |
| 15 | Frontend Architect | UI/UX Architect | CSP, state management, token storage (httpOnly) |
| 16 | UI Builder | Frontend Developer | Components, accessibility (WCAG 2.1 AA) |

### CAPA 4 — Quality Assurance

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 17 | Test Architect | QA Architect | Test strategy, pyramid (70/20/10), coverage targets |
| 18 | Test Implementation | QA Engineer | Unit/integration/E2E/security tests |
| 19 | Code Review | Senior Developer | Architecture compliance, SOLID, dependency validation |
| 20 | SAST | AppSec Engineer | OWASP Top 10, CVE scanning, blocking gates |
| 31 | Performance Engineer | Performance QA | Load testing (k6), benchmarks, SLA validation |

### CAPA 5 — Operations & Delivery

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 21 | CI/CD | DevOps Engineer | Pipeline, Docker, SBOM, signing, security gates |
| 22 | Observability | SRE / Monitoring | JSON logs, metrics, OpenTelemetry, alerts |
| 23 | Documentation | Technical Writer | API docs, runbooks, ADRs, README |
| 29 | Release Manager | Release Engineer | Semantic versioning, changelogs, release notes, rollback plans |
| 30 | DevEx Engineer | DX Specialist | Local dev setup, onboarding, tooling, seed data |

---

## Phase System (8 Phases + Continuous)

### Phase 0: PROJECT KICKOFF

**Purpose**: Initialize project, select team, create backlog structure.

**Activities**:
1. User describes project scope and goals
2. Orchestrator (00) presents team presets (see `team-presets.md`)
3. User selects/customizes agent team
4. Backlog Manager (28) initializes `backlog/` directory structure
5. Product Owner (26) creates initial epic backlog from project scope

**Gate G-1**: Team confirmed, `backlog/config.yml` created, initial epics logged.

**Artifacts**:
- `backlog/config.yml` — Project configuration
- `backlog/tasks/` — Initial epic task files
- Team roster document

---

### Phase 1: DISCOVERY & SPECS

**Purpose**: Define the product (PRD), elicit requirements, map compliance, produce formal specifications, populate the canonical implementations registry.

**Activities**:
1. **Product Owner (26) + Requirements Architect (02) produce the PRD** (`specs/prd.md`) — problem, user stories, ONE core feature, non-goals, success metrics. Approved BEFORE technical specs begin.
2. Requirements Architect (02) elicits FR/NFR and acceptance criteria, derived from the PRD
3. Compliance (03) maps regulatory requirements
4. UX Researcher (32) produces personas and journey maps (if on team)
5. **Spec Writer (27) produces ALL technical specifications** (see Spec Types below) — only after PRD approval
6. **Architecture Board (01) populates `CANONICAL.md`** with the canonical implementation path for every cross-cutting concern (auth, errors, logging, validation, DB access, config, secrets, feature flags, etc.). Paths can be `(to be created at <path>)` if Phase 4 has not started.
7. Product Owner (26) breaks PRD core feature + specs into epics → stories → tasks in backlog
8. Architecture Board (01) reviews spec completeness

**Gate G0a — PRD Approval (v1.5+)**: PRD signed off by Product Owner (26), Requirements Architect (02), and at least one persona-validating stakeholder. Status moves Draft → Approved → Locked. NO technical spec is started before this gate.

**Gate G0**: All technical specs approved, `CANONICAL.md` populated, backlog populated with stories, compliance matrix complete.

**PRD-first rationale**: The PRD is VANTAGE's first line of defense against structural drift. It prevents three failure modes:

1. **Interesting-code drift**: Without a PRD, technical specs are written against the most fun problem in the room, not the one users have. Six months later the codebase has three half-built capabilities and zero shipped value.
2. **Feature sprawl**: A PRD locks the project to ONE core feature. Every later "while we're at it" addition must either fit that feature or trigger a new PRD. This is the structural counterpart to CANONICAL.md: PRD constrains WHAT is built, CANONICAL.md constrains HOW it is built.
3. **Cold-session amnesia**: Each AI coding session starts without memory of why decisions were made. The PRD is the durable memory the agent reads before touching code (see "Forced-Context Preamble" in Phase 4).

If a PRD requires a 4th user story, the project is a platform not a product — split it into multiple PRDs.

**Spec Types Produced**:

| Spec | Format | File | Order |
|------|--------|------|-------|
| **Product Requirements Document** | Markdown | `specs/prd.md` | **0 (must be first, locked at G0a)** |
| **Canonical Implementations Registry** | Markdown | `CANONICAL.md` (project root) | **0.5 (after PRD lock, before any technical spec)** |
| API Specification | OpenAPI 3.1 YAML | `specs/openapi.yaml` | 1 |
| WebSocket Events | AsyncAPI / JSON | `specs/ws-events.json` | 1 |
| Database Schema | SQL + ERD (Mermaid) | `specs/db-schema.sql`, `specs/erd.md` | 1 |
| Domain Model | Mermaid class diagram | `specs/domain-model.md` | 1 |
| UI Wireframes | Markdown + Mermaid | `specs/wireframes.md` | 1 |
| UI Component Spec | Markdown | `specs/ui-components.md` | 1 |
| State Machines | Mermaid stateDiagram | `specs/state-machines.md` | 1 |
| Environment Config | YAML template | `specs/env-template.yaml` | 1 |
| Test Plan | Markdown | `specs/test-plan.md` | 1 |

`CANONICAL.md` is owned by Architecture Board (01) and enforced by Structural Coherence (34). Template at `docs/CANONICAL-TEMPLATE.md`. PRs that introduce alternative implementations of any listed concern require an ADR; otherwise Agent 34 blocks the sprint close at Gate G3.5.

---

### Phase 2: ARCHITECTURE

**Purpose**: Define solution architecture validated against specs.

**Activities**:
1. Enterprise Architect (04): Solution architecture, C4 diagrams, tech stack
2. Data Architect (05): Domain model, ERD validated against `specs/db-schema.sql`
3. Integration Architect (06): API contracts validated against `specs/openapi.yaml`
4. Infrastructure Architect (07): IaC, networking, container strategy
5. Data Engineer (33): Migration strategy, pipeline design (if on team)

**Gate G1**: Architecture Board approval, architecture consistent with specs.

---

### Phase 3: SECURITY

**Purpose**: Threat modeling, security architecture, controls matrix.

**Activities**:
1. Security Architect (08): STRIDE threat model, controls matrix
2. IAM Agent (09): AuthN/AuthZ design, OAuth 2.1/OIDC flows
3. Secrets & Crypto (10): Encryption plan, vault strategy
4. Threat Intelligence (11): Abuse cases, OWASP validation

**Gate G2**: Security Architect approval. **VETO POWER** — unresolved critical risks block all progress.

---

### Phase 4: IMPLEMENTATION (Sprint-Driven)

**Purpose**: Build the system in sprints, validated against specs and canonical implementations.

**Sprint Structure** (managed by Backlog Manager 28):
1. Sprint Planning: Pull stories from backlog, assign to agents
2. Implementation: Domain (12) → App (13) → Adapters (14) → Frontend (15/16)
3. Sprint Review: Demo completed work against specs
4. Retrospective: Process improvements

**Validation Rule**: Every implemented endpoint/component MUST reference its spec. Code that doesn't match specs is rejected.

**Forced-Context Preamble (v2.0 Pillar B)**: Before any code-writing agent (12-16) writes a single line, it MUST execute the following preamble in order. This is non-negotiable and enforced by Orchestrator (00):

1. Read `specs/prd.md` — confirm the change serves the locked core feature
2. Read `CANONICAL.md` — find which canonical implementation handles this concern
3. Read the last 5 ADRs in `backlog/decisions/` — surface recent architectural commitments
4. Search the codebase for the capability being added: "does this already exist somewhere?"
   - If YES: edit the existing implementation, do not create a parallel one
   - If NO: document in the commit body why the new artifact is needed

Each commit produced by a code-writing agent must include the line `Preamble executed: yes` (or `Preamble executed: skipped — <reason>` for trivial bypass like comment typos). Agent 34 audits this marker at sprint close.

**Rationale**: The "vibe-coded codebase becomes unreadable in 6 months" failure mode is caused by cold-session amnesia. The preamble forces the model to re-load architectural memory before every write. It costs ~30-60 seconds per task and prevents the multi-week refactors that result from skipping it.

**Gate G3**: Code review (19) passes, all implemented items match specs.

**Gate G3.5 — Structural Coherence (v2.0 Pillar B)**: Before the sprint can close, Structural Coherence Agent (34) runs the structural drift report and BLOCKS sprint closure if any of the following are true:

- Duplicate code detector reports >5% new duplication versus the previous sprint baseline
- Any new file implements a concern already covered by a `CANONICAL.md` entry without an accompanying ADR
- Dead code detector flags orphaned exports or unreachable modules introduced in this sprint
- `ARCHITECTURE.md` was not updated when a new module, layer, or boundary was added
- `CANONICAL.md` was not updated when a new cross-cutting concern was introduced

Agent 34 has VETO POWER on sprint closure. Architecture Board (01) is the only escalation path; Architecture Board can override only by approving an ADR that explicitly accepts the drift cost and adds the alternative path to `CANONICAL.md`'s Divergence Log.

---

### Dev-QA Loop (Within Phase 4)

Every implementation task follows a build-test loop with a hard retry cap to prevent infinite rework:

```
Task Assigned -> Agent Builds (12-16) -> QA Reviews (17-20) -> PASS/FAIL
                                                                  |
                                                          PASS -> Task Complete
                                                          FAIL -> Retry (max 3)
                                                                  |
                                                          3 FAILs -> ESCALATE
```

**Rules:**
1. Retry counter is per-task, tracked in backlog item metadata (`retries: 0|1|2|3`)
2. QA feedback on each FAIL must be specific and actionable -- no vague "needs work"
3. On FAIL: QA agent returns the task to the implementing agent with concrete feedback
4. On ESCALATE (3 failures): Architecture Board (01) decides:
   - **Reassign** to a different implementing agent
   - **Redesign** the approach (return to spec)
   - **Descope** from current sprint (move to backlog)
   - **Block** as needing human input
5. Architecture Board has 24h to respond to escalations
6. Escalation does NOT reset the retry counter
7. This loop applies in all deployment modes except MICRO (which skips formal QA loop)


### Phase 5: QUALITY ASSURANCE

**Purpose**: Comprehensive testing and security scanning.

**Activities**:
1. Test Architect (17): Test strategy mapped to specs
2. Test Implementation (18): Unit/integration/E2E tests per test plan
3. SAST (20): OWASP Top 10 scan, CVE detection
4. Performance Engineer (31): Load tests, SLA validation (if on team)

**Gate G4**: Tests pass (90%+ domain coverage), SAST clean (no CVSS >= 9.0), performance SLAs met.

---

### Phase 6: OPERATIONS

**Purpose**: Pipeline, observability, documentation, release preparation.

**Activities**:
1. CI/CD (21): Pipeline with security gates, Docker builds
2. Observability (22): Structured logging, metrics, tracing
3. Documentation (23): API docs, runbooks, README
4. DevEx Engineer (30): Onboarding guide, local dev setup (if on team)
5. Release Manager (29): Changelog, release notes, versioning (if on team)

**Gate G5**: Pipeline green, docs complete, release notes ready.

---

### Phase 7: GOVERNANCE & LAUNCH

**Purpose**: Final review and deployment.

**Activities**:
1. Architecture Board (01): Final compliance review
2. Product Owner (26): Acceptance sign-off
3. Release Manager (29): Deployment coordination
4. Backlog Manager (28): Sprint closure, retrospective

**Artifacts**: Release notes, deployment record, retrospective summary.

---

### Continuous Activities (Throughout All Phases)

| Activity | Agent | Frequency |
|----------|-------|-----------|
| Backlog grooming | 28 - Backlog Manager | Weekly |
| Sprint ceremonies | 28 - Backlog Manager | Per sprint cycle |
| Security monitoring | 08 - Security Architect | Continuous (veto anytime) |
| Structural drift monitoring | 34 - Structural Coherence | Per PR (advisory) + per sprint close (G3.5 blocking) |
| Spec evolution | 27 - Spec Writer | As requirements change |
| Innovation watch | 25 - Innovation Scout | Monthly |
| **Consolidation Sprint** | **34 - Structural Coherence + 19 - Code Review** | **1 of every 4 sprints** |

**Consolidation Sprint (v2.0 Pillar B)**: Every 4th sprint is dedicated to consolidation, NOT new features. Hard rule enforced by Backlog Manager (28). During a Consolidation Sprint:

1. Agent 34 produces a structural drift report aggregating findings from the trailing 3 sprints
2. The team collapses duplicate implementations into the canonical paths declared in `CANONICAL.md`
3. Dead code is deleted (no "keep just in case" — git history is the archive)
4. `ARCHITECTURE.md` and `CANONICAL.md` are reconciled with the actual codebase
5. The PRD is reviewed for drift: are we still building the locked core feature, or did 4 sprints of "while we're at it" mutate the product? If mutated → trigger PRD change request, do not paper over.

Skipping a Consolidation Sprint requires Architecture Board (01) sign-off and creates an ADR documenting the technical debt incurred. Skipping two consecutive Consolidation Sprints is a structural emergency.

---

## Spec-Driven Workflow

### Spec Lifecycle

```
Draft → Review (team) → Approved → Locked (implementation starts)
                                       ↓
                              Change Request → Re-review → Approved v2
```

### Rules

1. **No implementation without a spec**: Every endpoint, table, component, and event MUST have a spec before code is written
2. **Spec versioning**: Specs are versioned (v1, v2) — changes after lock require a Change Request
3. **Spec-to-backlog**: Each spec section generates backlog items automatically:
   - OpenAPI endpoints → one task per endpoint group
   - DB tables → one task per migration
   - UI wireframes → one task per screen/component
4. **Spec validation**: In Gate G3, implementation is validated against specs (contract testing)

### Spec Templates

See `Arch standard/spec-templates.md` for complete templates for each spec type.

---

## Project Team Configuration

### Core Team (Mandatory for ALL Projects)

| # | Agent | Why Mandatory |
|---|-------|--------------|
| 00 | Orchestrator | Coordinates everything |
| 08 | Security Architect | Veto power, security-by-design |
| 27 | Spec Writer | Specs are non-negotiable |
| 28 | Backlog Manager | Task tracking is non-negotiable |

### Team Presets

See `Arch standard/team-presets.md` for complete preset definitions.

### Team Selection Flow

```
User describes project
    ↓
Orchestrator (00) analyzes scope
    ↓
Presents matching preset(s) + recommendation
    ↓
User confirms or customizes team
    ↓
Team roster saved to backlog/config.yml
```

---

## Backlog Integration

### Directory Structure

```
<project-root>/
├── backlog/
│   ├── config.yml          # Project config (team, statuses, DoD)
│   ├── tasks/              # Active task files (YAML frontmatter + MD)
│   ├── completed/          # Archived completed tasks
│   ├── archive/            # Obsolete items
│   ├── decisions/          # Architecture Decision Records
│   ├── docs/               # Project documentation
│   ├── milestones/         # Release markers
│   └── sprints/            # Sprint records
├── specs/                  # Formal specifications
│   ├── openapi.yaml
│   ├── ws-events.json
│   ├── db-schema.sql
│   ├── domain-model.md
│   ├── wireframes.md
│   ├── state-machines.md
│   ├── env-template.yaml
│   └── test-plan.md
└── [source code]
```

### Task File Format

```yaml
---
id: 42
title: Implement OAuth 2.1 login flow
status: In Progress       # Backlog | To Do | In Progress | In Review | Done
assignee: 09-iam          # Agent ID or human name
reporter: 26-product-owner
created_date: 2026-02-16 10:00
completed_date: null
labels: [security, auth, backend]
milestone: v1.0
priority: high            # critical | high | medium | low
phase: 4-implementation   # VANTAGE phase reference
spec_ref: specs/openapi.yaml#/paths/~1auth~1login
depends_on: [38, 39]
sprint: sprint-003
---

## Description
[Clear problem statement and context]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Spec Reference
- [Which spec file and section this implements]

## Definition of Done
- [ ] Code implements spec exactly
- [ ] Tests pass
- [ ] Security review complete
- [ ] Documentation updated
```

### Backlog Config

```yaml
project_name: "Project Name"
task_prefix: "PROJ"
framework: VANTAGE
statuses: [Backlog, To Do, In Progress, In Review, Done]
default_status: Backlog
labels: [frontend, backend, security, infra, docs, spec, test]
phases: [0-kickoff, 1-discovery, 2-architecture, 3-security, 4-implementation, 5-qa, 6-operations, 7-governance]
team:
  core: [00, 08, 27, 28]
  active: []              # Filled at kickoff
definition_of_done:
  - Spec reference validated
  - Tests pass
  - Security review complete
  - Documentation updated
sprint_length_days: 14
```

---

## Invocation

### PROMPT E: New VANTAGE Project

```
Read `Arch standard/VANTAGE.md`.
I want to start a new project: [describe project].
Follow the VANTAGE phases starting from Phase 0 (Kickoff).
Ask me which agents should be on the team.
```

### PROMPT F: Apply VANTAGE to Existing Project

```
Read `Arch standard/VANTAGE.md` and `Arch standard/transformation-plan.md`.
I want to apply VANTAGE to an existing project at [path].
Assess current state, initialize backlog, and generate specs for what exists.
```

---

## Relationship to Existing Framework

| Existing | VANTAGE |
|----------|-------|
| Prompts A-D | Still work unchanged (backward compatible) |
| 7 Phases (1-7) | Extended to 8 phases (0-7) with Phase 0 Kickoff |
| Gates G0-G5 | Extended to G-1 through G5 (added G-1 for kickoff) |
| 25 Agents (00-25) | Extended to 34 agents (00-33) |
| Transformation Waves 0-5 | Still work — VANTAGE adds spec/backlog layer on top |
| Artifact Registry | Extended with spec artifacts and backlog task files |
| Security Veto | Preserved exactly as-is |
| Clean Architecture | Preserved exactly as-is |
| Certification Map | Extended with certs for agents 26-33 |
| (new) UI Kit Standard | `Arch standard/ui-kit-standard.md` — Standard frontend toolkit (shadcn/ui + Magic UI + Framer Motion + CVA + Tailwind) |

---

## VANTAGE v2.0 — Pillar A: Intelligent Runtime

Pillar A transforms the framework from static prompts into an intelligent runtime:

### Key Additions
- **Agent Memory**: Session + persistent memory with graduation rules and automatic compaction
- **Subagent Dispatch**: Main agents (00, 08, 24, 34) stay in context; all others dispatched as subagents (~75% token reduction)
- **Adaptive Toolkits**: Two-level loading — lightweight index (~200 tokens) always loaded + on-demand full definitions (~500 tokens)
- **OSS Scout**: Proactive during Discovery, reactive during Implementation, with evaluation cache
- **Token Estimator**: Per-phase breakdown with single approval gate before project starts
- **Maintenance Agent**: Audits tracked packages and toolkits for staleness, vulnerabilities, and missing definitions
- **Drift Detector** (`drift-detector.js`): Detects spec→implementation alignment drift (missing spec refs, orphaned specs, scope creep, naming drift) — runs on task completion
- **6 Phase Skills**: Discovery → Architecture → Security → Implementation → QA → Operations

### Phase Mapping (v1.0 → v2.0)
| v1.0 Phase | v2.0 Phase Skill | Notes |
|------------|------------------|-------|
| Phase 0: Governance | Absorbed into Orchestrator | Pre-flight checks automatic |
| Phase 1: Requirements | `vantage-discovery` | Combined with OSS scout |
| Phase 2: Architecture | `vantage-architecture` | C4, ERD, API contracts |
| Phase 3: Security | `vantage-security` | STRIDE, controls matrix |
| Phase 4-5: Implementation | `vantage-implementation` | TDD with worktrees |
| Phase 6: Testing | `vantage-qa` | Coverage + SAST |
| Phase 7: Operations | `vantage-operations` | CI/CD + docs |

### Quick Start
```bash
npx vantage init
# Edit .vantage/config.yml
# Start with your idea — VANTAGE handles the rest
```

### Full Spec
See `docs/superpowers/specs/2026-03-14-vantage-v2-idea-to-mvp-design.md`

---

## VANTAGE v2.0 — Pillar B: Structural Defense

Pillar B exists because spec-driven development (v1.0) and intelligent runtime (Pillar A) do not prevent the "vibe-coded codebase that works but is unreadable in 6 months" failure mode. Spec-driven prevents the WRONG product from being built. Pillar A makes building it efficient. Pillar B prevents the right product from being built in three incompatible ways.

### Three failure modes Pillar B targets

1. **Cold-session amnesia**: Each session forgets prior architectural commitments and adds parallel implementations
2. **Feature-driven drift**: PRs optimize for shipping the next feature, never for collapsing the resulting duplication
3. **Doc-vs-reality gap**: ARCHITECTURE.md describes the codebase as it was 4 sprints ago; new contributors can't navigate it

### The four mechanisms (each is mandatory)

#### 1. Agent 34 — Structural Coherence (META layer, VETO POWER on Gate G3.5)

Anti-drift auditor. Owns `CANONICAL.md`. Three operating modes:

- **Mode A — Per-PR advisory** (non-blocking): comment on PRs with findings categorized [BLOCKER], [WARNING], [INFO]
- **Mode B — Sprint close audit** (blocking, Gate G3.5): produces a drift report at `.vantage/memory/drift-reports/structural-sprint-NNN.md` with PASS/FAIL verdict
- **Mode C — Consolidation Sprint driver** (every 4th sprint): leads remediation, prioritizes consolidation backlog

Tooling baseline: jscpd / pmd-cpd (duplication), ts-prune / vulture (dead code), madge / dependency-cruiser (import graph), ast-grep / semgrep (structural patterns). The runtime module `.vantage/runtime/structural-coherence.js` contains the logic; tools are invoked from CI (see `.vantage/runtime/__tests__/structural-coherence.test.js` for unit tests of the pure logic).

Override path: Architecture Board (01) ADR. The ADR must explicitly accept the drift cost and add the alternative path to `CANONICAL.md`'s Divergence Log. There is no other override.

Agent prompt: `agents/34-structural-coherence.md`.

#### 2. CANONICAL.md (project root, mandatory artifact from Phase 1)

Single source of truth for cross-cutting implementations. Required template at `docs/CANONICAL-TEMPLATE.md`.

Each row declares: concern, canonical path, owner agent, notes. Adding an alternative requires an ADR. Renames/moves of canonical paths are reflected in the same commit that performs the rename. CI fails if a row points to a non-existent file.

Default concerns: Authentication, Authorization, HTTP Client, HTTP Server, Error Types, Error Handling Middleware, Logging, Validation, DB Access, DB Migrations, Config Loader, Secrets Access, Feature Flags, Background Jobs, Cache, Metrics, Frontend State, Frontend HTTP, Frontend Routing, i18n. Domain-specific concerns (payments, file storage, ML invocation, websocket routing, etc.) get added rows.

#### 3. Forced-Context Preamble (Phase 4 rule)

Every code-writing agent (12-16) reads `specs/prd.md` + `CANONICAL.md` + last 5 ADRs + does a "does this exist?" search before any write. Commit body marker `Preamble executed: yes` is audited at sprint close. See Phase 4 above for the full sequence.

#### 4. Consolidation Sprint (1 of every 4)

Hard cadence enforced by Backlog Manager (28). Dedicated to collapsing duplication, deleting dead code, reconciling docs, and reviewing PRD drift. See "Continuous Activities" above for the full activity list.

### Pillar B Quick-Start Checklist

For any new VANTAGE 2.0 project, verify before Phase 4 starts:

- [ ] `specs/prd.md` exists, status = Locked, signed by 26 + 02 + persona stakeholder (Gate G0a)
- [ ] `CANONICAL.md` exists at project root with at least Auth, HTTP, Errors, Logging, Validation, DB, Config rows populated
- [ ] `ARCHITECTURE.md` exists at project root with current C4 + import graph
- [ ] Agent 34 is on the active team (mandatory core for v2.0)
- [ ] CI runs duplication and dead-code detectors on every PR; Agent 34 reads the reports
- [ ] `backlog/decisions/` exists; ADR template is in place at `docs/DECISIONS-TEMPLATE.md`
- [ ] Sprints 4, 8, 12... are pre-marked as Consolidation Sprints in `backlog/sprints/`

### Compatibility

- **v1.0 projects**: continue unchanged. No retrofit required.
- **v2.0 Pillar-A projects**: can adopt Pillar B incrementally:
  1. Add `specs/prd.md` reverse-engineered from current product reality
  2. Add `CANONICAL.md` (initial population from import-graph clustering)
  3. Activate forced-context preamble for new code (existing code grandfathered)
  4. Run Agent 34 in Mode A (advisory) for one sprint to baseline drift metrics
  5. Promote Agent 34 to Mode B (blocking at G3.5)
  6. Schedule the first Consolidation Sprint
- **v2.0 Full projects** (Pillar A + B): all four mechanisms required from Phase 1.

### Full Spec
See `docs/superpowers/specs/2026-05-03-vantage-v2-pillar-b-structural-defense.md`.
