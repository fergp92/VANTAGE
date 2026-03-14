# USDAF — Unified Spec-Driven Agile Framework v1.0

> **No code is written until specs exist and are approved. Specs are the source of truth.**

## Overview

USDAF merges the Multi-Agent Framework (25 agents, 7 phases, security gates) with spec-driven development and Backlog.md-style markdown-native task management into a single unified framework. Every development project passes through required phases with a project-specific agent team.

### Core Principles

1. **Spec-First**: Formal specifications (OpenAPI, DB schema, wireframes, event contracts) are produced and approved BEFORE any implementation begins
2. **Phase-Gated**: 8 phases (0-7) with explicit gates; no phase proceeds without gate approval
3. **Team-Based**: Each project selects its agent team at kickoff — mandatory core + optional specialists
4. **Backlog-Driven**: All work tracked as markdown task files in `backlog/` directory, git-versioned
5. **Security Veto**: Agent 08 (Security Architect) retains veto power at any phase
6. **Backward Compatible**: Existing Prompts A-D continue to work unchanged

---

## Agent Registry (34 Agents: 00-33)

### CAPA META — Orchestration & Management

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 00 | Orchestrator | Conductor / Entry Point | Coordinates all agents, team selection, phase routing |
| 24 | Project Manager | PM / Phase Manager | Phase transitions, gate approvals, conflict resolution |
| 25 | Innovation Scout | Market Intelligence | Gartner MQ analysis, vendor comparison, competitive intel |
| 26 | Product Owner | Product Manager | Backlog ownership, story acceptance, priority (MoSCoW), ROI |
| 28 | Backlog Manager | Scrum Master | Sprint planning, backlog grooming, velocity, ceremonies, DoD enforcement |

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

**Purpose**: Elicit requirements, map compliance, produce formal specifications.

**Activities**:
1. Requirements Architect (02) elicits FR/NFR, acceptance criteria
2. Compliance (03) maps regulatory requirements
3. UX Researcher (32) produces personas and journey maps (if on team)
4. **Spec Writer (27) produces ALL specifications** (see Spec Types below)
5. Product Owner (26) breaks specs into epics → stories → tasks in backlog
6. Architecture Board (01) reviews spec completeness

**Gate G0**: All specs approved, backlog populated with stories, compliance matrix complete.

**Spec Types Produced**:

| Spec | Format | File |
|------|--------|------|
| API Specification | OpenAPI 3.1 YAML | `specs/openapi.yaml` |
| WebSocket Events | AsyncAPI / JSON | `specs/ws-events.json` |
| Database Schema | SQL + ERD (Mermaid) | `specs/db-schema.sql`, `specs/erd.md` |
| Domain Model | Mermaid class diagram | `specs/domain-model.md` |
| UI Wireframes | Markdown + Mermaid | `specs/wireframes.md` |
| UI Component Spec | Markdown | `specs/ui-components.md` |
| State Machines | Mermaid stateDiagram | `specs/state-machines.md` |
| Environment Config | YAML template | `specs/env-template.yaml` |
| Test Plan | Markdown | `specs/test-plan.md` |

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

**Purpose**: Build the system in sprints, validated against specs.

**Sprint Structure** (managed by Backlog Manager 28):
1. Sprint Planning: Pull stories from backlog, assign to agents
2. Implementation: Domain (12) → App (13) → Adapters (14) → Frontend (15/16)
3. Sprint Review: Demo completed work against specs
4. Retrospective: Process improvements

**Validation Rule**: Every implemented endpoint/component MUST reference its spec. Code that doesn't match specs is rejected.

**Gate G3**: Code review (19) passes, all implemented items match specs.

---

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
| Spec evolution | 27 - Spec Writer | As requirements change |
| Innovation watch | 25 - Innovation Scout | Monthly |

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
phase: 4-implementation   # USDAF phase reference
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
framework: USDAF
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

### PROMPT E: New USDAF Project

```
Read `Arch standard/USDAF.md`.
I want to start a new project: [describe project].
Follow the USDAF phases starting from Phase 0 (Kickoff).
Ask me which agents should be on the team.
```

### PROMPT F: Apply USDAF to Existing Project

```
Read `Arch standard/USDAF.md` and `Arch standard/transformation-plan.md`.
I want to apply USDAF to an existing project at [path].
Assess current state, initialize backlog, and generate specs for what exists.
```

---

## Relationship to Existing Framework

| Existing | USDAF |
|----------|-------|
| Prompts A-D | Still work unchanged (backward compatible) |
| 7 Phases (1-7) | Extended to 8 phases (0-7) with Phase 0 Kickoff |
| Gates G0-G5 | Extended to G-1 through G5 (added G-1 for kickoff) |
| 25 Agents (00-25) | Extended to 34 agents (00-33) |
| Transformation Waves 0-5 | Still work — USDAF adds spec/backlog layer on top |
| Artifact Registry | Extended with spec artifacts and backlog task files |
| Security Veto | Preserved exactly as-is |
| Clean Architecture | Preserved exactly as-is |
| Certification Map | Extended with certs for agents 26-33 |
| (new) UI Kit Standard | `Arch standard/ui-kit-standard.md` — Standard frontend toolkit (shadcn/ui + Magic UI + Framer Motion + CVA + Tailwind) |
