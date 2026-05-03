# VANTAGE v2.0 — Pillar B: Structural Defense

**Date**: 2026-05-03
**Status**: Approved
**Pillar**: B (Structural Defense)
**Companion to**: `docs/superpowers/specs/2026-03-14-vantage-v2-idea-to-mvp-design.md` (Pillar A — Intelligent Runtime)
**Source framework**: `Arch standard/VANTAGE.md`

---

## 1. Problem Statement

VANTAGE v1.0 prevents the wrong product from being built (spec-driven, with PRD-first
locked at Gate G0a as of v1.5). VANTAGE v2.0 Pillar A makes the framework run as an
intelligent runtime (memory, subagent dispatch, adaptive toolkits, spec→implementation
drift detection via `drift-detector.js`).

Neither pillar prevents the SAME product from being built in three incompatible
ways over six months of feature work. The Reddit post that triggered this addendum
(r/vibecoding, "vibe coded for 6 months. my codebase is a disaster") describes the
exact failure mode: every feature shipped works, users are happy, revenue is real,
but the codebase is unreadable and a new contributor goes silent for two minutes
when they open it.

The three causal mechanisms:

1. **Cold-session amnesia**: AI coding agents start every session without memory of
   prior architectural commitments. They re-derive "how do we handle auth?" from
   nothing and pick whatever approach is convenient in the current task. After 50
   sessions, there are 5 ways to handle auth.

2. **Feature-driven drift**: Every PR optimizes for shipping the next feature. No
   PR optimizes for collapsing duplication introduced by the previous 4 features.
   Drift compounds.

3. **Doc-vs-reality gap**: ARCHITECTURE.md was written at sprint 1 and never updated.
   By sprint 12 it describes a system that no longer exists. New contributors trust
   the doc, get lost, give up, ask the original author. The original author becomes
   the bottleneck.

Pillar B targets all three.

---

## 2. Solution Overview

Four mechanisms, all mandatory for projects starting after 2026-05-03:

1. **Agent 34 — Structural Coherence** (META layer, veto power on Gate G3.5)
2. **CANONICAL.md** (mandatory artifact at project root, populated in Phase 1)
3. **Forced-Context Preamble** (rule for every code-writing agent in Phase 4)
4. **Consolidation Sprint** (1 of every 4 sprints, hard cadence)

Each mechanism on its own would be 30-50% effective. The four together compound
because they target the failure mode at different layers:

- PRD prevents WHAT-drift (Phase 1, Gate G0a)
- CANONICAL.md prevents HOW-drift (continuous)
- Preamble prevents WHO-knows-what amnesia (every commit)
- Agent 34 catches what slips through (Gate G3.5)
- Consolidation Sprint reverses what accumulated (every 4 sprints)

---

## 3. Detailed Mechanisms

### 3.1 Agent 34 — Structural Coherence

Full prompt: `agents/34-structural-coherence.md`.
Runtime module: `.vantage/runtime/structural-coherence.js`.
Unit tests: `.vantage/runtime/__tests__/structural-coherence.test.js`.

**Position in registry**: META layer. Promoted to MAIN_AGENTS in `agent-registry.js`
(stays in context across the whole session, like 00, 08, 24). Veto power on Gate
G3.5 only — not on PR merge directly (advisory at that level).

**Three operating modes**:
- Mode A — Per-PR advisory (fast, non-blocking, comment-only)
- Mode B — Sprint close audit (slow, blocking, produces structural drift report at
  `.vantage/memory/drift-reports/structural-<sprint>-<timestamp>.md`)
- Mode C — Consolidation Sprint driver (every 4th sprint, leads remediation)

**Tooling baseline** (invoked from CI; the runtime module is pure-logic and consumes
the CI tool outputs as inputs):
- Duplication: jscpd / pmd-cpd / dupl / simian (language-appropriate)
- Dead code: ts-prune / vulture / unimport / deadcode
- Import graph: madge / dependency-cruiser / pydeps / arch-unit
- Pattern queries: ast-grep / semgrep
- Doc diff: custom (compare ARCHITECTURE.md text claims to actual import graph)

**Public API of `structural-coherence.js`**:

```js
// Pure-logic functions (no side effects):
parseCanonical(content)                   // → Array<Concern>
verifyCanonicalPaths(concerns, root)      // → missing[]
detectAlternativeImplementations(files, concerns)
auditPreambleMarkers(commits)
categorizeFinding(finding, mode)          // → 'BLOCKER'|'WARNING'|'INFO'

// Orchestrating entry point:
runStructuralAudit({ canonicalContent, projectRoot, newFiles, commits,
                     duplicationDeltaPct, newDeadCode, mode, sprintName, config })
                                          // → { verdict, findings, summary, report }

// Persistence:
saveStructuralReport(report, sprintName)  // → file path

// Trigger gate:
shouldRunStructuralCheck(trigger)         // 'pr' | 'sprint-close' | 'consolidation'
```

**Override path**: Architecture Board (01) ADR. The ADR must explicitly accept the
drift cost and add the alternative path to CANONICAL.md's Divergence Log. There is
no other override.

### 3.2 CANONICAL.md

Full template: `docs/CANONICAL-TEMPLATE.md`.

**Location**: project root (NOT under `specs/` — it is a structural manifest, not
a behavioral spec).

**Lifecycle**:
- Created in Phase 1, populated by Architecture Board (01) with concerns the
  project will have (paths can be `(to be created at <path>)` if Phase 4 has not
  started — `verifyCanonicalPaths` skips placeholder rows).
- Updated whenever a new cross-cutting concern is introduced. Update happens in
  the same PR that introduces the implementation.
- Validated at every Gate G3.5 by Agent 34 via `runStructuralAudit`.
- Renames/moves of canonical paths are reflected in the same commit that performs
  the rename. CI should fail if a row points to a non-existent file.

**Default concerns to include** (remove rows that don't apply, add rows for
domain-specific concerns):
Authentication, Authorization, HTTP Client (outbound), HTTP Server (inbound),
Error Types, Error Handling Middleware, Logging, Validation (input), DB Access,
DB Migrations, Config Loader, Secrets Access, Feature Flags, Background Jobs,
Cache, Metrics / Observability, Frontend State, Frontend HTTP, Frontend Routing,
i18n.

**Divergence Log**: empty by default. Only filled when an ADR-approved alternative
exists. Each row references the ADR. The runtime parser explicitly excludes
Divergence Log rows from the active concerns set.

### 3.3 Forced-Context Preamble

Applies to: all code-writing agents (12 — Domain Logic, 13 — App Services, 14 —
Adapters, 15 — Frontend Architect, 16 — UI Builder).

**Required steps before ANY write**:

1. Read `specs/prd.md`. Confirm the change serves the locked core feature. If it
   does not, halt and surface the misalignment to Product Owner (26).
2. Read `CANONICAL.md`. Identify which canonical implementation handles this
   concern. If one exists, use it — never create a parallel.
3. Read the last 5 ADRs in `backlog/decisions/`. Surface any recent commitment
   that affects this change.
4. Run a search: "does this capability already exist somewhere in the codebase?".
   If YES, edit the existing implementation. If NO, document in the commit body
   why the new artifact is needed and reference the closest existing patterns.

**Marker in commit body**: every commit produced by a code-writing agent must
contain the line `Preamble executed: yes` (or `Preamble executed: skipped — <reason>`
for trivial bypass like comment typos). Agent 34 audits this marker via
`auditPreambleMarkers()` at sprint close. Missing marker = WARNING. Frequent skips
= BLOCKER for the agent's pattern, not the individual commit.

**Cost**: 30-60 seconds per task. **Benefit**: prevents the multi-week refactors
that follow from skipping it.

### 3.4 Consolidation Sprint

**Cadence**: 1 of every 4 sprints. Pre-marked in `backlog/sprints/` at project
kickoff. Backlog Manager (28) enforces. Configurable via
`config.yml :: structural.consolidation_sprint_cadence`.

**Activities** (all required):
1. Agent 34 produces a structural drift report aggregating findings from the
   trailing 3 sprints
2. Team collapses duplicate implementations into the canonical paths declared in
   CANONICAL.md
3. Dead code is deleted (no "keep just in case" — git history is the archive)
4. ARCHITECTURE.md and CANONICAL.md are reconciled with actual codebase state
5. PRD drift review: are we still building the locked core feature, or did 4
   sprints of "while we're at it" mutate the product? If mutated → trigger PRD
   change request, do not paper over.

**Skipping**: requires Architecture Board (01) sign-off and an ADR documenting the
technical debt incurred. Default answer is "no skip". Skipping two consecutive
Consolidation Sprints is a structural emergency and triggers Architecture Board
intervention.

---

## 4. Gate Changes

| Gate | v1.0 | v1.5 (PRD-first) | v2.0 Pillar B |
|------|------|------|------|
| G-1 | Kickoff (team confirmed) | unchanged | unchanged |
| G0a | — | PRD locked (NEW) | unchanged |
| G0 | All technical specs approved | unchanged | unchanged + CANONICAL.md populated |
| G1 | Architecture board approval | unchanged | unchanged |
| G2 | Security architect approval | unchanged | unchanged |
| G3 | Code review pass | unchanged | unchanged |
| G3.5 | — | — | Structural Coherence pass (NEW, blocking) |
| G4 | QA pass | unchanged | unchanged |
| G5 | Operations ready | unchanged | unchanged |

Gate hooks live in `.vantage/config.yml :: gates.hooks` and are wired to the
runtime via `gate-hooks.js`:

```yaml
G0a:
  pre: [validate-prd-locked]
  post: [log-gate-result]
G3.5:
  pre: [run-structural-audit]
  post: [persist-structural-report, log-gate-result]
```

---

## 5. Compatibility

- **v1.0 projects**: continue unchanged. No retrofit required.
- **v2.0 Pillar-A projects**: can adopt Pillar B incrementally:
  1. First add `specs/prd.md` reverse-engineered from current product reality
  2. Then add `CANONICAL.md` (initial population from import-graph clustering)
  3. Activate forced-context preamble for new code (existing code grandfathered)
  4. Run Agent 34 in Mode A (advisory) for one sprint to baseline drift metrics
  5. Promote Agent 34 to Mode B (blocking at G3.5)
  6. Schedule the first Consolidation Sprint to collapse pre-existing alternatives
- **v2.0 Full projects** (Pillar A + B): all four mechanisms required from Phase 1.

---

## 6. Anti-Goals (what Pillar B is NOT)

- **Not a code style enforcer**: linters, formatters, and Code Review (19) handle
  style. Agent 34 enforces structural position only.
- **Not a security review**: Security Architect (08) keeps that veto. Agent 34's
  veto is orthogonal — structural drift, not security risk.
- **Not a duplicate of Drift Detector (Pillar A)**: `drift-detector.js` checks
  spec→implementation alignment (does code match spec?). Agent 34's
  `structural-coherence.js` checks code-vs-code coherence (is the code organized
  around canonical paths?). Different inputs, different cadences, different
  consumers, different reports.
- **Not a velocity tax for its own sake**: the goal is to avoid the 6-month
  refactor, not to slow shipping for ceremony. If a project is genuinely simple
  (e.g. a one-page static site), the team may declare CANONICAL.md not applicable
  in `.vantage/config.yml :: structural` and skip Pillar B. This declaration
  requires Architecture Board sign-off.
- **Not a replacement for refactoring**: Agent 34 surfaces what needs refactoring.
  Implementing agents do the refactoring during Consolidation Sprints.

---

## 7. Success Criteria

A project is correctly running Pillar B if, 6 months after kickoff:

1. A new contributor can onboard from `README.md + ARCHITECTURE.md + CANONICAL.md`
   alone, without asking the original author "where is X?"
2. The codebase has ZERO undocumented alternative implementations of any concern
   listed in CANONICAL.md
3. Drift reports for the last 4 sprints all show duplication delta within ±2%
4. Every Consolidation Sprint actually ran and shipped consolidation work
5. PRD drift events were caught and either re-approved (Change Request) or
   descoped, never silently absorbed

If any of these fail, the project has structural debt and Architecture Board
should intervene.

---

## 8. Open Questions / Future Work

- **Auto-generated initial CANONICAL.md**: tool that scans an existing codebase
  and proposes CANONICAL.md rows by clustering import patterns. Useful for
  retrofitting v2.0 onto v1.0 / Pillar-A-only projects.
- **CI hook reference implementation**: a GitHub Actions workflow that wires
  jscpd + ts-prune + the runtime module into PR review. Out of scope for this
  initial PR; can ship as a `.vantage/blueprints/ci/` reference.
- **Cross-project canonical reuse**: should there be an org-wide CANONICAL
  catalog so that all portfolio projects share auth, logging, etc.? Likely yes,
  but out of scope for this addendum.

---

## 9. References

- `Arch standard/VANTAGE.md` (canonical framework doc, sections updated 2026-05-03)
- `agents/34-structural-coherence.md` (agent prompt)
- `docs/CANONICAL-TEMPLATE.md` (CANONICAL.md template)
- `.vantage/runtime/structural-coherence.js` (runtime module)
- `.vantage/runtime/__tests__/structural-coherence.test.js` (unit tests)
- `docs/superpowers/specs/2026-03-14-vantage-v2-idea-to-mvp-design.md` (Pillar A)
- Reddit r/vibecoding "vibe coded for 6 months. my codebase is a disaster" (2026)
- Lehman, M. M. "Programs, life cycles, and laws of software evolution" (1980)
- Cunningham, W. "The WyCash Portfolio Management System" (1992) — debt metaphor
