# VANTAGE — Backlog Guide

> How to use markdown-native task management within the VANTAGE framework. Based on Backlog.md patterns, adapted for spec-driven, phase-gated development.

---

## Directory Structure

Every VANTAGE project has a `backlog/` directory at the project root:

```
<project-root>/
├── backlog/
│   ├── config.yml          # Project configuration
│   ├── tasks/              # Active task files
│   ├── completed/          # Archived completed tasks
│   ├── archive/            # Obsolete/cancelled items
│   ├── decisions/          # Architecture Decision Records (ADRs)
│   ├── docs/               # Project documentation
│   ├── milestones/         # Release/version markers
│   └── sprints/            # Sprint records
├── specs/                  # Formal specifications (Phase 1 output)
└── [source code]
```

---

## Task File Format

Every task is a markdown file with YAML frontmatter. Files are named:
```
[PREFIX]-[ID] - [Title].md
```

Example: `PROJ-042 - Implement OAuth login flow.md`

### Full Task Template

```yaml
---
id: 42
title: Implement OAuth 2.1 login flow
status: In Progress
assignee: 09-iam
reporter: 26-product-owner
created_date: 2026-02-16 10:00
completed_date: null
labels: [security, auth, backend]
milestone: v1.0
priority: high
phase: 4-implementation
spec_ref: specs/openapi.yaml#/paths/~1auth~1login
depends_on: [38, 39]
sprint: sprint-003
epic: 5
---

## Description
Clear problem statement and context. What needs to be done and why.

## Acceptance Criteria
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]

## Spec Reference
- OpenAPI: `specs/openapi.yaml` → `/auth/login`, `/auth/callback`
- DB: `specs/db-schema.sql` → `users` table, `oauth_tokens` table
- Security: Threat model → Authentication component

## Implementation Notes
[Technical approach, decisions made during implementation]

## Definition of Done
- [ ] Code implements spec exactly
- [ ] Unit tests pass (90%+ domain coverage)
- [ ] Integration tests pass
- [ ] Security review by Agent 08
- [ ] SAST scan clean
- [ ] API matches OpenAPI spec (contract test)
- [ ] Documentation updated

## Final Summary
[Filled when task is completed — what was done, any deviations from spec]
```

---

## Task Statuses

```
Backlog → To Do → In Progress → In Review → Done
                                              ↓
                                          completed/
```

| Status | Meaning |
|--------|---------|
| **Backlog** | Identified but not yet prioritized for a sprint |
| **To Do** | Committed to current sprint, ready to start |
| **In Progress** | Actively being worked on |
| **In Review** | Implementation complete, under review (code review, security, specs) |
| **Done** | All DoD criteria met, accepted by Product Owner |

When a task reaches **Done**, the Backlog Manager moves it from `tasks/` to `completed/`.

---

## Task Types

### Epic
Large feature that spans multiple sprints. Contains child stories.

```yaml
labels: [epic]
```

### Story
User-facing feature or capability. Implementable in a single sprint.

```yaml
labels: [feature]
epic: [parent-epic-id]
```

### Bug
Defect in existing functionality.

```yaml
labels: [bug]
```

### Spec Task
Task to create or update a specification.

```yaml
labels: [spec]
phase: 1-discovery
```

### Security Task
Security-related work (from Agent 08 reviews or SAST findings).

```yaml
labels: [security]
```

### Tech Debt
Refactoring, performance, or code quality improvements.

```yaml
labels: [tech-debt]
```

---

## Priority Levels

| Priority | Label | Meaning |
|----------|-------|---------|
| **Critical** | `critical` | Blocks release, security vulnerability, production down |
| **High** | `high` | Must-have for current milestone (MoSCoW: Must) |
| **Medium** | `medium` | Should-have (MoSCoW: Should) |
| **Low** | `low` | Could-have / nice-to-have (MoSCoW: Could) |

---

## Sprint Ceremonies

### Sprint Planning (Start of Sprint)

1. Product Owner (26) presents prioritized backlog
2. Team reviews upcoming stories, asks clarifying questions
3. Backlog Manager (28) facilitates commitment based on velocity
4. Selected stories move from `Backlog` → `To Do`
5. Sprint record created: `backlog/sprints/sprint-NNN.md`

### Daily Sync (During Sprint)

Quick status update per active agent:
- What was completed since last sync
- What's being worked on now
- Any blockers

### Sprint Review (End of Sprint)

1. Demo completed stories against acceptance criteria
2. Product Owner (26) accepts or rejects each story
3. Accepted stories → `Done` → moved to `completed/`
4. Rejected stories → back to `Backlog` with feedback

### Sprint Retrospective (After Review)

1. What went well?
2. What could improve?
3. Action items for next sprint
4. Documented in sprint record

---

## Definition of Done (DoD)

### Default DoD (All Projects)

- [ ] Spec reference validated — implementation matches spec
- [ ] Tests pass — unit + integration covering the change
- [ ] Security review — Agent 08 has reviewed (or confirmed not needed)
- [ ] Documentation updated — API docs, README, or relevant docs

### Extended DoD (per project, configured in config.yml)

Projects can add items:
- [ ] Performance budget met
- [ ] Accessibility audit passed
- [ ] E2E test covering this flow
- [ ] SAST scan clean
- [ ] Code review approved by Agent 19

---

## Architecture Decision Records (ADRs)

Store in `backlog/decisions/`. Format:

```markdown
# ADR-NNN: [Decision Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-NNN]

## Context
[What is the issue that we're seeing that is motivating this decision?]

## Decision
[What is the change that we're proposing and/or doing?]

## Consequences
[What becomes easier or more difficult to do because of this change?]

## Alternatives Considered
[What other options were evaluated?]
```

---

## Milestone Format

Store in `backlog/milestones/`. One file per release:

```markdown
# Milestone: v1.0.0

## Target Date
2026-04-01

## Goals
- [Goal 1]
- [Goal 2]

## Stories Included
| ID | Title | Status |
|----|-------|--------|
| PROJ-001 | User authentication | Done |
| PROJ-015 | Dashboard UI | In Progress |

## Release Criteria
- [ ] All Must-have stories complete
- [ ] Security review passed
- [ ] Performance SLAs met
- [ ] Documentation complete
```

---

## Backlog-to-Phase Mapping

Tasks are tagged with their VANTAGE phase:

| Phase | Typical Labels | Agent Owners |
|-------|---------------|-------------|
| 0-kickoff | setup, config | 00, 28 |
| 1-discovery | spec, requirement | 02, 27, 32 |
| 2-architecture | architecture, design | 04, 05, 06, 07 |
| 3-security | security, threat-model | 08, 09, 10, 11 |
| 4-implementation | frontend, backend, feature | 12, 13, 14, 15, 16 |
| 5-qa | test, bug, performance | 17, 18, 19, 20, 31 |
| 6-operations | cicd, docs, release | 21, 22, 23, 29, 30 |
| 7-governance | review, approval | 01, 26 |

---

## Config Reference

### backlog/config.yml

```yaml
# Project identity
project_name: "My Project"
task_prefix: "PROJ"
framework: VANTAGE

# Workflow
statuses:
  - Backlog
  - To Do
  - In Progress
  - In Review
  - Done
default_status: Backlog

# Classification
labels:
  - frontend
  - backend
  - security
  - infra
  - docs
  - spec
  - test
  - bug
  - feature
  - tech-debt
  - epic

# VANTAGE phases
phases:
  - 0-kickoff
  - 1-discovery
  - 2-architecture
  - 3-security
  - 4-implementation
  - 5-qa
  - 6-operations
  - 7-governance

# Team configuration
team:
  core: [00, 08, 27, 28]
  active: []
  preset: full-stack-app
  customizations:
    added: []
    removed: []

# Quality
definition_of_done:
  - Spec reference validated
  - Tests pass
  - Security review complete
  - Documentation updated

# Sprint
sprint_length_days: 14
current_sprint: 1

# Counters
next_task_id: 1
```
