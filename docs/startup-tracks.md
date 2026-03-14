# SUSDAF — Startup Tracks (Parallel Track System)

> **Three parallel tracks — Business Strategy, Tech, and Operations — synchronized through gates. Build the company while you build the product.**

---

## Overview

SUSDAF (Startup Unified Spec-Driven Agile Framework) introduces a parallel track system on top of USDAF's existing phase structure. Instead of a single linear pipeline, startup projects run up to **3 independent tracks** that synchronize at defined **Sync Gates (SG)**.

| Track | Focus | Phases | Lead Agents |
|-------|-------|--------|-------------|
| **Track A** | Business Strategy | A0–A6 | 34 (Startup Strategist), 35 (Market Researcher), 36 (Growth Hacker), 37 (Pitch Architect), 42 (CFO) |
| **Track B** | Tech | Phases 0–7 | Existing USDAF agents (00–33) |
| **Track C** | Operations (Legal + Finance + Regulatory) | C0–C5 | 38 (Legal Counsel), 39 (Privacy & Data Officer), 40 (IP Strategist), 41 (Contract Architect), 42 (CFO), 43 (Tax Strategist), 44 (Accountant), 45 (Regulatory Navigator), 46 (Permit & License), 47 (Entity Formation) |

### Key Properties

1. **Tracks run independently** — each track advances through its own phases at its own pace
2. **Sync Gates enforce coordination** — no track can proceed past a gate until all required tracks are ready
3. **Track B is unchanged** — the existing USDAF phases 0–7 are Track B; no modifications needed
4. **Track activation depends on preset** — existing presets only activate Track B; the `startup` preset activates all three

```
Track A: [A0]─[A1]─────[A2]─────[A3]─────────[A4]──[A5]──[A6]
                  │           │                 │         │
              ════SG-1════ ═══SG-2═══ ════════SG-3══ ══SG-4══
                  │           │                 │         │
Track B: [B0]─[B1]─[B2]─[B3]─[B4]────[B5]─[B6]─[B7]────│
                  │           │                 │         │
Track C: [C0]────[C1]─[C2]───[C3]──────────[C4]─────[C5]─│
```

---

## Track A: Business Strategy

Track A validates the business idea, designs the business model, and prepares for growth. It runs from initial ideation through to scale.

---

### A0: Ideation

**Purpose**: Crystallize the startup idea into a structured hypothesis.

**Agents**: 34 (Startup Strategist)

**Activities**:
1. Lean Canvas creation (problem, solution, key metrics, unfair advantage, channels, customer segments, cost structure, revenue streams)
2. Core assumption identification and ranking by risk
3. Problem-solution fit hypothesis formulation

**Artifacts**:
- `specs/lean-canvas.md` — Lean Canvas
- `specs/assumptions.md` — Ranked assumption list

**Gate**: None (internal phase, flows directly into A1).

---

### A1: Market Validation

**Purpose**: Validate or kill the idea based on market evidence. This is the single most critical business phase — a KILL verdict here saves months of wasted effort.

**Agents**: 35 (Market Researcher), 34 (Startup Strategist)

**Activities**:
1. TAM / SAM / SOM analysis with methodology documentation
2. Competitor deep-dive (direct, indirect, substitute competitors)
3. Customer interview plan and synthesis
4. **ZERO COMPLACENCY market verdict** — Agent 35 issues one of:
   - **VIABLE**: Market evidence supports proceeding
   - **PIVOT**: Market exists but approach must change
   - **KILL**: No viable market; recommend stopping

**Artifacts**:
- `specs/market-research.md` — Market Research Report (TAM/SAM/SOM, competitor matrix, customer insights)
- `backlog/decisions/MARKET-VERDICT.md` — MARKET VERDICT with evidence and reasoning

**Gate**: Feeds **SG-1** (GO/NO-GO). Agent 35's verdict is an input to the gate decision.

---

### A2: Business Model

**Purpose**: Design the revenue engine and validate unit economics before building.

**Agents**: 34 (Startup Strategist), 42 (CFO)

**Activities**:
1. Revenue model design (subscription, transactional, freemium, marketplace, etc.)
2. Pricing strategy with competitive positioning
3. Unit economics calculation (CAC, LTV, LTV:CAC ratio, payback period)
4. Break-even analysis

**Artifacts**:
- `specs/business-model.md` — Business Model Document
- `specs/unit-economics.md` — Unit Economics Model with sensitivity analysis

**Gate**: Feeds **SG-2** (BUILD READY). Business model must be approved before implementation begins.

---

### A3: Go-to-Market Plan

**Purpose**: Define how the product reaches customers and how success is measured.

**Agents**: 36 (Growth Hacker), 34 (Startup Strategist)

**Activities**:
1. Distribution channel selection and prioritization
2. Launch plan (pre-launch, launch day, post-launch weeks)
3. AARRR metrics definition (Acquisition, Activation, Retention, Referral, Revenue)
4. Growth experiment backlog (minimum 10 experiments ranked by ICE score)

**Artifacts**:
- `specs/gtm-plan.md` — Go-to-Market Plan
- `specs/metrics-dashboard.md` — Metrics Dashboard Specification

**Gate**: None (internal phase). GTM Plan reviewed at SG-3 as part of launch readiness.

---

### A4: Fundraising

**Purpose**: Prepare all materials needed to raise capital if applicable.

**Agents**: 37 (Pitch Architect), 42 (CFO)

**Activities**:
1. Financial projections (3-year P&L, cash flow, balance sheet)
2. Pitch deck creation (12-slide standard: problem, solution, market, product, traction, team, model, competition, financials, ask, use of funds, vision)
3. Cap table modeling (founders, ESOP, angel round, seed round)
4. Due diligence document preparation

**Artifacts**:
- `specs/pitch-deck.md` — Pitch Deck content and structure
- `specs/financial-model.md` — Financial Model (projections, scenarios)
- `specs/cap-table.md` — Cap Table

**Gate**: None (internal phase). Clean cap table required for SG-3.

---

### A5: Growth Strategy

**Purpose**: Post-launch growth execution and optimization.

**Agents**: 36 (Growth Hacker), 34 (Startup Strategist)

**Activities**:
1. Growth experiment execution from GTM backlog
2. Funnel optimization (conversion rate at each AARRR stage)
3. Retention analysis and churn reduction
4. Channel scaling (double down on what works, cut what doesn't)

**Artifacts**:
- `specs/growth-experiments.md` — Growth Experiment Log (hypothesis, result, decision)
- Updated metrics dashboard

**Gate**: Feeds **SG-4** (LAUNCH). Growth metrics reviewed as part of launch assessment.

---

### A6: Scale

**Purpose**: Prepare the business for scaling beyond initial traction.

**Agents**: 34 (Startup Strategist), 42 (CFO)

**Activities**:
1. Series A preparation (metrics milestones, narrative, data room)
2. Team scaling plan (hiring roadmap, org chart evolution)
3. International expansion analysis (market prioritization, localization needs)
4. Strategic partnership identification

**Artifacts**:
- `specs/scale-plan.md` — Scale Plan
- Updated financial model with growth scenarios

---

## Track B: Tech (Reference)

Track B is the existing USDAF phases 0–7, **completely unchanged**. All phase definitions, gates (G-1 through G5), agent assignments, spec-driven workflow, and backlog integration documented in [`USDAF.md`](USDAF.md) apply as-is.

### Startup-Specific Notes

- Track B **does not begin Phase 4 (Implementation)** until **SG-2 (BUILD READY)** opens
- Phases 0–3 (Kickoff, Discovery, Architecture, Security) can proceed in parallel with Tracks A and C
- All existing team presets, core team requirements, and security veto rules remain in effect

---

## Track C: Operations (Legal + Finance + Regulatory)

Track C handles everything required to operate as a legal entity — from jurisdiction selection through ongoing compliance. This track runs in parallel with business validation and tech development.

---

### C0: Jurisdiction Research

**Purpose**: Select the optimal country/jurisdiction for entity formation based on regulatory, tax, and operational factors.

**Agents**: 45 (Regulatory Navigator), 43 (Tax Strategist)

**Activities**:
1. Target country identification based on founders, market, and investors
2. Regulatory requirements research per candidate jurisdiction
3. Tax comparison analysis (corporate tax, VAT/GST, founder tax, treaty networks)
4. Startup incentive programs and grants identification
5. Country scoring matrix (regulatory burden, tax efficiency, ecosystem, banking access)

**Artifacts**:
- `specs/country-roadmap.md` — Country Roadmap (ranked jurisdictions with reasoning)
- `specs/tax-analysis.md` — Tax Analysis

**Gate**: Feeds **SG-1** (GO/NO-GO). Jurisdiction must be feasible for the business model.

---

### C1: Entity Formation

**Purpose**: Legally form the company and establish the founder relationship.

**Agents**: 47 (Entity Formation), 38 (Legal Counsel), 41 (Contract Architect)

**Activities**:
1. Entity type selection (LLC, C-Corp, Ltd, SAS, etc.) with legal reasoning
2. Articles of incorporation / formation document drafting
3. Founder agreement (equity split, vesting, IP assignment, roles, decision rights)
4. Tax ID / EIN registration
5. Registered agent / domiciliation setup

**Artifacts**:
- `legal/articles-of-incorporation.md` — Articles of Incorporation (template + instructions)
- `legal/founder-agreement.md` — Founder Agreement
- `legal/tax-registration.md` — Tax Registration Documentation

**Gate**: Feeds **SG-2** (BUILD READY). Entity must exist before significant capital expenditure.

---

### C2: Financial Setup

**Purpose**: Establish the financial infrastructure to operate the business.

**Agents**: 42 (CFO), 44 (Accountant)

**Activities**:
1. Business bank account setup (requirements, recommended banks)
2. Accounting system selection and chart of accounts creation
3. Financial controls definition (approval thresholds, expense policies)
4. Invoicing and payment processing setup

**Artifacts**:
- `legal/banking-setup.md` — Banking Setup Guide
- `specs/chart-of-accounts.md` — Chart of Accounts

**Gate**: Feeds **SG-2** (BUILD READY). Financial infrastructure must be in place before implementation spend.

---

### C3: Compliance Setup

**Purpose**: Establish minimum legal compliance before product launch.

**Agents**: 39 (Privacy & Data Officer), 40 (IP Strategist), 46 (Permit & License)

**Activities**:
1. Privacy policy drafting (GDPR, CCPA, or jurisdiction-appropriate)
2. Terms of Service drafting
3. Trademark search and application filing
4. Industry-specific permit and license identification and application
5. Cookie consent / data processing setup

**Artifacts**:
- `legal/privacy-policy.md` — Privacy Policy
- `legal/terms-of-service.md` — Terms of Service
- `legal/trademark-application.md` — Trademark Application
- `legal/permits.md` — Permit & License Register

**Gate**: Feeds **SG-3** (MVP READY). Privacy policy and ToS must be live before any user-facing launch.

---

### C4: Ongoing Compliance

**Purpose**: Maintain regulatory compliance on an ongoing basis post-formation.

**Agents**: 38 (Legal Counsel), 39 (Privacy & Data Officer), 44 (Accountant)

**Activities**:
1. Quarterly tax filing preparation
2. Annual report and corporate maintenance
3. Privacy compliance monitoring (data subject requests, breach procedures)
4. Contract review for customer/vendor agreements
5. Regulatory change monitoring

**Artifacts**:
- `legal/compliance-calendar.md` — Compliance Calendar (recurring obligations)
- Updated permits and license register

---

### C5: Scale Operations

**Purpose**: Prepare operational infrastructure for multi-jurisdiction scaling.

**Agents**: 43 (Tax Strategist), 38 (Legal Counsel), 42 (CFO)

**Activities**:
1. Multi-jurisdiction entity structure planning (subsidiaries, branches)
2. Transfer pricing policy design
3. International employment / contractor compliance
4. Audit preparation (financial audit readiness, tax audit defense)
5. IP holding structure optimization

**Artifacts**:
- `legal/multi-jurisdiction-plan.md` — Multi-Jurisdiction Plan
- `specs/transfer-pricing.md` — Transfer Pricing Policy
- `legal/audit-readiness.md` — Audit Readiness Checklist

---

## Sync Gate Protocol

Sync Gates are the coordination mechanism between tracks. They ensure that no track proceeds into a phase that depends on another track's output without that output being ready and approved.

### Gate Protocol Flow

```
1. Each track works independently through its phases
2. When a track reaches a Sync Gate, it signals "READY" with artifacts
3. Orchestrator (00) collects readiness signals from all active tracks
4. Veto check: agents with veto power (08, 35, 38) can BLOCK
5. Gate opens when: all required tracks report ready + no active vetoes
6. If blocked: resolve the blocker (fix, pivot, or get override)
```

---

### SG-1: GO / NO-GO

**Purpose**: Decide whether the project should proceed at all based on market evidence and legal feasibility.

**Required Signals**:

| Track | Requirement | Agent |
|-------|-------------|-------|
| A | Market Researcher (35) has issued VIABLE verdict, or user has explicitly overridden a PIVOT/KILL verdict with written justification logged to `backlog/decisions/` | 35 |
| C | Jurisdiction feasibility confirmed — no legal blockers for the business model in the selected jurisdiction | 38 |
| C | Country Roadmap generated with at least one viable jurisdiction | 45 |

**Blocks on Failure**: Entire project. No track advances past SG-1 without this gate opening.

**Override Rules**:
- Agent 35 (Market Researcher) KILL verdict **CAN** be overridden with explicit written justification logged to `backlog/decisions/SG1-KILL-OVERRIDE.md`. The justification must address every risk flagged by Agent 35.
- Agent 38 (Legal Counsel) veto: **NO override**. If Legal Counsel identifies a jurisdiction blocker, it must be resolved (change jurisdiction, change business model, or obtain legal clearance).

---

### SG-2: BUILD READY

**Purpose**: Confirm that the business and legal foundations are in place before committing significant resources to implementation.

**Required Signals**:

| Track | Requirement | Phase |
|-------|-------------|-------|
| C | Entity formed — legal entity registered, tax ID obtained | C1 complete |
| C | Financial setup done — bank account open, accounting system active | C2 complete |
| A | Business model approved — revenue model and unit economics validated | A2 complete |
| B | Tech specs ready — OpenAPI, DB schema, and architecture approved | B1 (Phase 1) complete |

**Blocks on Failure**: Track B cannot start Phase 4 (Implementation). Phases 0–3 may continue, but no production code is written until SG-2 opens.

---

### SG-3: MVP READY

**Purpose**: Confirm the MVP is functional and minimum compliance is met before any go-to-market activities begin.

**Required Signals**:

| Track | Requirement | Phase |
|-------|-------------|-------|
| B | MVP functional — core features implemented and passing tests | B4–B5 (Implementation + QA) complete |
| C | Privacy policy live and accessible at a public URL | C3 complete |
| C | Terms of Service live and accessible at a public URL | C3 complete |
| A | Cap table clean — all founder equity documented, no unresolved disputes | A4 complete |
| All | Legal Counsel (38) review of MVP from legal perspective | 38 sign-off |

**Blocks on Failure**: Cannot begin go-to-market activities (A3 execution). Product cannot be shown to users or customers.

---

### SG-4: LAUNCH

**Purpose**: Final gate before public launch. All tracks must report ready.

**Required Signals**:

| Track | Requirement | Agent |
|-------|-------------|-------|
| A | GTM plan ready, growth experiment backlog prepared | 36 |
| B | All quality gates passed (G3, G4, G5 from USDAF) | 08, 17, 19, 20 |
| C | All required permits and licenses obtained, compliance calendar active | 38, 46 |
| All | Legal Counsel (38) final review | 38 |
| All | Security Architect (08) final review | 08 |

**Blocks on Failure**: Cannot launch publicly. Product remains in private/beta state until all signals are green.

---

## Veto Power Matrix

Agents with veto power can **BLOCK** a Sync Gate from opening regardless of other tracks' readiness. Vetoes must include a written explanation with specific remediation requirements.

| Agent | Veto Scope | Gates | Override? |
|-------|-----------|-------|-----------|
| 08 — Security Architect | All technical decisions (architecture, implementation, deployment) | SG-2, SG-3, SG-4 | **NO** |
| 35 — Market Researcher | Market viability (TAM, competition, product-market fit) | SG-1 only | **YES** — with written justification logged to `backlog/decisions/` |
| 38 — Legal Counsel | All legal matters (entity, compliance, contracts, IP, liability) | SG-1, SG-2, SG-4 | **NO** |

### Veto Resolution Process

1. Veto-holding agent issues a **BLOCK** with written explanation and remediation requirements
2. Orchestrator (00) logs the block in `backlog/decisions/BLOCK-{gate}-{date}.md`
3. Affected tracks are notified and paused at the gate
4. Responsible agents work on remediation
5. Veto-holding agent reviews remediation and either **LIFTS** the block or issues updated requirements
6. Gate reopens when all blocks are resolved

---

## Track Activation by Preset

Only the `startup` preset activates all three tracks. All existing presets continue to use Track B only, preserving full backward compatibility.

| Preset | Track A | Track B | Track C |
|--------|---------|---------|---------|
| **startup** | Active | Active | Active |
| full-stack-app | — | Active | — |
| api-service | — | Active | — |
| security-hardening | — | Active | — |
| documentation | — | Active | — |
| data-pipeline | — | Active | — |
| frontend-app | — | Active | — |
| minimum-viable | — | Active | — |
| creative-innovation | — | Active | — |

### Startup Preset Team Activation

When the `startup` preset is selected, Orchestrator (00) activates agents across all three tracks:

```yaml
preset: startup
tracks: [A, B, C]

track_a_agents: [34, 35, 36, 37, 42]
track_b_agents: [standard USDAF team per full-stack-app or api-service preset]
track_c_agents: [38, 39, 40, 41, 42, 43, 44, 45, 46, 47]

# Note: Agent 42 (CFO) participates in both Track A and Track C
```

---

## Orchestrator (00) Multi-Track Routing

When the startup preset is active, the Orchestrator (00) extends its responsibilities to manage coordination across all three tracks.

### Track Status Board

The Orchestrator maintains a status board in `backlog/track-status.md`:

```markdown
# Track Status Board

| Track | Current Phase | Status | Next Gate | Blocker |
|-------|--------------|--------|-----------|---------|
| A     | A1           | Active | SG-1      | None    |
| B     | B1           | Active | SG-1      | None    |
| C     | C0           | Active | SG-1      | None    |

## Sync Gate Status

| Gate | Track A | Track B | Track C | Vetoes | Status |
|------|---------|---------|---------|--------|--------|
| SG-1 | Pending | Ready   | Pending | None   | BLOCKED |
| SG-2 | —       | —       | —       | —      | WAITING |
| SG-3 | —       | —       | —       | —      | WAITING |
| SG-4 | —       | —       | —       | —      | WAITING |
```

### Routing Responsibilities

1. **Task routing** — When a new task arrives, the Orchestrator determines which track owns it based on the task's domain (business, tech, or operations) and routes it to the correct track's backlog
2. **Gate monitoring** — The Orchestrator continuously checks whether all prerequisites for the next Sync Gate are met across all active tracks
3. **Blocker escalation** — When a track is blocked (waiting for another track's output or a veto resolution), the Orchestrator escalates to the relevant agents and tracks resolution
4. **Cross-track dependency management** — Some artifacts feed across tracks (e.g., the business model from Track A informs the tech specs in Track B). The Orchestrator ensures these handoffs happen
5. **Status reporting** — The Orchestrator updates `backlog/track-status.md` after every significant state change

### Cross-Track Dependencies

| From | To | Dependency |
|------|----|-----------|
| A1 (Market Validation) | B1 (Discovery) | Market research informs feature prioritization |
| A2 (Business Model) | B1 (Discovery) | Revenue model informs tech requirements (payments, subscriptions, etc.) |
| C0 (Jurisdiction) | B3 (Security) | Data residency requirements inform security architecture |
| C3 (Compliance) | B6 (Operations) | Privacy policy requirements inform observability and data handling |
| B4 (Implementation) | A3 (GTM) | MVP availability enables go-to-market execution |
| B5 (QA) | C3 (Compliance) | Security scan results inform compliance posture |

---

## Relationship to USDAF

SUSDAF extends USDAF — it does NOT replace it. USDAF remains the software development framework (34 agents, 8 phases). SUSDAF adds startup-specific capabilities around it.

| USDAF (Software Dev) | SUSDAF (Startup Creator) |
|----------------------|------------------------|
| 34 agents (00–33) | 48 agents (00–47) — USDAF agents + 14 new |
| Single-track (phases 0–7) | Multi-track (A, B, C) with Sync Gates |
| Gates G-1 through G5 | Preserved in Track B + 4 new Sync Gates |
| Security veto (Agent 08) | Triple veto: Security (08) + Market (35) + Legal (38) |
| Spec-driven development | Preserved — Track B = USDAF unchanged |
| `Arch standard/USDAF.md` | `Arch standard/SUSDAF.md` |
