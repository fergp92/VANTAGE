# Agent Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 7 verified gap-filling changes across 6 agent prompt files as a single PR contribution to VANTAGE.

**Architecture:** Each task edits one agent's Markdown prompt file with precise text insertions. No build system exists — changes are Markdown only. Each task ends with a commit so the PR history is clean and reviewable.

**Tech Stack:** Markdown, git, GitHub CLI (`gh`)

---

### Task 1: Agent 22 — Observability — Runbook content mandate + proactive response

**Files:**
- Modify: `agents/22-observability.md`

**Step 1: Open and read the current file**

Read `agents/22-observability.md` and locate the `## Rules` section (lines 25–28).

**Step 2: Replace the Rules section**

Replace:
```
## Rules
- Audit logs are IMMUTABLE (append-only)
- Every alert has a runbook
- False positives must be tuned
```

With:
```
## Rules
- Audit logs are IMMUTABLE (append-only)
- Every alert has a runbook; every runbook MUST include: (1) immediate mitigation steps, (2) root cause investigation steps, (3) remediation and recovery actions
- False positives must be tuned
- Threshold breaches MUST trigger automated responses — not just alerts. Required actions: auto-scaling, circuit breaker activation, on-call page with pre-selected runbook, or rollback signal. Alerting alone is insufficient.
```

**Step 3: Verify**

Re-read `agents/22-observability.md` and confirm both new lines appear under `## Rules`.

**Step 4: Commit**

```bash
git add agents/22-observability.md
git commit -m "feat(observability): mandate runbook remediation content and proactive threshold response"
```

---

### Task 2: Agent 07 — Infrastructure Architect — FinOps responsibility + IaC fallback hierarchy

**Files:**
- Modify: `agents/07-infrastructure-architect.md`

**Step 1: Open and read the current file**

Read `agents/07-infrastructure-architect.md` and locate `## Core Responsibilities` (lines 10–16) and `## Principles` (lines 18–25).

**Step 2: Add FinOps as Core Responsibility #6**

In `## Core Responsibilities`, after line 5 (`5. PLAN disaster recovery`), add:
```
6. MONITOR operational costs: compute, storage, data transfer, and observability tooling. Define cost budgets per environment, alert on anomalies, and report cost impact of architecture decisions.
```

**Step 3: Replace Principle #1 with the IaC fallback hierarchy**

Replace:
```
1. Infrastructure as Code: EVERYTHING codified and versioned
```

With:
```
1. Infrastructure as Code — tiered mandate:
   (1) ALL infrastructure MUST be codified as IaC (Terraform preferred)
   (2) Where IaC tooling cannot manage a resource, it MUST be scripted (shell, CLI, or automation script)
   (3) Where scripting is not possible, it MUST be documented as a step-by-step manual runbook
   Nothing is exempt from traceability. "It was done manually" is never acceptable.
```

**Step 4: Verify**

Re-read `agents/07-infrastructure-architect.md` and confirm:
- Core Responsibility #6 exists with cost monitoring language
- Principle #1 shows the three-tier hierarchy

**Step 5: Commit**

```bash
git add agents/07-infrastructure-architect.md
git commit -m "feat(infrastructure): add FinOps as core responsibility and IaC fallback hierarchy"
```

---

### Task 3: Agent 26 — Product Owner — Change traceability + release sign-off

**Files:**
- Modify: `agents/26-product-owner.md`

**Step 1: Open and read the current file**

Read `agents/26-product-owner.md` and locate `### 2. Story Acceptance` (around lines 24–28) and `## Decision Authority` (around lines 72–76).

**Step 2: Add traceability to Story Acceptance**

In `### 2. Story Acceptance`, after the existing bullet points, add:
```
- Traceability: every PR, commit, and deployment MUST be linked to a backlog item. No change proceeds without an originating request (user story, bug report, or recorded stakeholder decision).
```

**Step 3: Add release sign-off as a new subsection**

After `### 2. Story Acceptance`, add a new subsection:
```
### 2a. Release Sign-Off
- The PO MUST explicitly approve every release before it proceeds to production
- Sprint review acceptance and release sign-off are separate gates — completing a sprint does not authorise a release
- Release sign-off confirms: scope is correct, version is accurate, release notes are complete, and no must-have items are outstanding
```

**Step 4: Verify**

Re-read `agents/26-product-owner.md` and confirm both additions are present and correctly placed.

**Step 5: Commit**

```bash
git add agents/26-product-owner.md
git commit -m "feat(product-owner): add change traceability requirement and release sign-off gate"
```

---

### Task 4: Agent 10 — Secrets & Crypto — Mandatory review gate for PII/secrets changes

**Files:**
- Modify: `agents/10-secrets-crypto.md`

**Step 1: Open and read the current file**

Read `agents/10-secrets-crypto.md` and locate the `## FORBIDDEN (VETO immediately)` section (around lines 38–44).

**Step 2: Add a new Review Gate section before FORBIDDEN**

Before `## FORBIDDEN (VETO immediately)`, insert:
```
## Mandatory Review Gate
Any PR or change that touches the following REQUIRES review and approval by Agent 10 before merge:
- Handling, storing, transmitting, or transforming PII or sensitive personal data
- Reading or writing system secrets, API keys, tokens, or credentials
- Cryptographic operations: encryption, decryption, hashing, signing, key generation
- Changes to vault configuration, secret rotation schedules, or key management
This applies regardless of how small the change appears. One line touching PII handling requires review.
```

**Step 3: Verify**

Re-read `agents/10-secrets-crypto.md` and confirm the new section appears before `## FORBIDDEN`.

**Step 4: Commit**

```bash
git add agents/10-secrets-crypto.md
git commit -m "feat(secrets): add mandatory review gate for PII, secrets, and cryptographic changes"
```

---

### Task 5: Agent 21 — CI/CD — Rollback as a hard requirement

**Files:**
- Modify: `agents/21-cicd.md`

**Step 1: Open and read the current file**

Read `agents/21-cicd.md` and locate the `## Rules` section (around lines 28–31).

**Step 2: Add rollback mandate to Rules**

In `## Rules`, after the existing rules, add:
```
- Every deployment MUST be rollback-capable: (1) use blue-green or canary strategy, (2) database migrations must be backward-compatible with the previous release, (3) auto-rollback triggers automatically on failed health checks within 5 minutes of deployment, (4) rollback procedure must be tested in staging before production promotion
```

**Step 3: Verify**

Re-read `agents/21-cicd.md` and confirm the rollback rule is present in the Rules section.

**Step 4: Commit**

```bash
git add agents/21-cicd.md
git commit -m "feat(cicd): mandate rollback capability with explicit mechanisms for every deployment"
```

---

### Task 6: Agent 19 — Code Review — Readability as an explicit mandate

**Files:**
- Modify: `agents/19-code-review.md`

**Step 1: Open and read the current file**

Read `agents/19-code-review.md` and locate `## Review Checklist` (around lines 16–23).

**Step 2: Add readability as the first checklist item**

In `## Review Checklist`, prepend as the first bullet:
```
- Code must be readable: prefer clarity over cleverness, use meaningful names, avoid unexplained complexity. A future developer must be able to understand intent without asking the author.
```

**Step 3: Verify**

Re-read `agents/19-code-review.md` and confirm the readability line is the first item in the checklist.

**Step 4: Commit**

```bash
git add agents/19-code-review.md
git commit -m "feat(code-review): add readability as an explicit review mandate"
```

---

### Task 7: Create branch, open PR

**Step 1: Check current branch**

```bash
git branch
```

If on `master`, create a feature branch:

```bash
git checkout -b feat/agent-enhancements-observability-infra-po-secrets-cicd
```

Note: if commits in Tasks 1–6 were made on master, cherry-pick or reset to branch first. Ideally, create the branch BEFORE Task 1 and commit all changes there.

**Step 2: Push the branch**

```bash
git push -u origin feat/agent-enhancements-observability-infra-po-secrets-cicd
```

**Step 3: Open the PR**

```bash
gh pr create \
  --title "feat: strengthen agents — observability, infra, PO, secrets, CI/CD, code review" \
  --body "$(cat <<'EOF'
## Summary

Seven targeted additions filling verified gaps across six agent files. Changes already present in agents were excluded after reading each file.

### Changes

**Agent 22 — Observability**
- Runbooks now mandated to include mitigation, root cause investigation, and remediation steps
- Threshold breaches must trigger automated responses (auto-scale, circuit break, rollback signal) — not just alerts

**Agent 07 — Infrastructure Architect**
- FinOps promoted from certification footnote to Core Responsibility #6: monitor compute, storage, data transfer, and observability costs
- IaC Principle #1 now has an explicit fallback hierarchy: IaC → scripted → documented. Nothing is exempt from traceability.

**Agent 26 — Product Owner**
- Traceability: every PR/commit/deployment must be linked to an originating backlog item
- Release sign-off added as a gate separate from sprint review acceptance

**Agent 10 — Secrets & Crypto**
- Added Mandatory Review Gate: any change touching PII, secrets, or cryptographic operations requires Agent 10 approval before merge

**Agent 21 — CI/CD**
- Rollback capability is now a hard rule with four required mechanisms: blue-green/canary, backward-compatible migrations, auto-rollback on health check failure, and staging rollback test

**Agent 19 — Code Review**
- Readability added as the first explicit review criterion

### Excluded (already present)
- Infrastructure DR plan ownership (Core Responsibility #5)
- PO feature prioritization (MoSCoW already mandated)
- Code must be tested (Agent 17 has explicit coverage targets)

## Test plan
- [ ] Read each modified agent file and verify new content is present and well-placed
- [ ] Confirm no existing content was removed or broken
- [ ] Confirm all new rules are consistent with the agent's existing certification context

🤖 Generated with [Claude Code](https://claude.ai/claude-code)
EOF
)"
```

**Step 4: Confirm PR URL is returned and share it**

---

## Important Note on Branch Timing

Create the feature branch **before Task 1**, not after. Run:

```bash
git checkout -b feat/agent-enhancements-observability-infra-po-secrets-cicd
```

Then proceed with Tasks 1–6. This keeps all commits cleanly on the feature branch.
