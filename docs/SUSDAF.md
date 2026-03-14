# SUSDAF — Startup Unified Spec-Driven Agile Framework v1.0

> **From idea to launch: no startup is built without validated specs, legal formation, and market proof.**

## Overview

SUSDAF extends the USDAF development framework into a complete startup creation system. It adds Business Strategy, Legal, and Finance & Regulatory departments alongside USDAF's tech development pipeline, all coordinated through parallel tracks and sync gates.

SUSDAF is for tech startups. It covers the entire journey: ideation, market validation, legal entity formation, financial setup, product development, compliance, fundraising, and launch.

### Relationship to USDAF

- USDAF (`Arch standard/USDAF.md`) handles all product development (Track B)
- SUSDAF adds Track A (Business Strategy) and Track C (Operations)
- SUSDAF's 14 new agents (34-47) work alongside USDAF's 34 agents (00-33)
- Total agent pool: 48 agents (00-47)

### Core Principles

1. **Market-Validated**: No product is built until the market is validated (Agent 35 ZERO COMPLACENCY)
2. **Legally Founded**: No code is written until the entity exists and legal structure is sound
3. **Financially Modeled**: Runway, unit economics, and fundraising strategy are planned before burn starts
4. **Spec-First** (from USDAF): Formal specifications before implementation
5. **Multi-Track**: Business, Tech, and Operations run in parallel with sync gate coordination
6. **Triple Veto**: Security Architect (08), Market Researcher (35), and Legal Counsel (38) hold veto power
7. **Country-Aware**: Regulatory requirements adapt per jurisdiction using RAG + web search

---

## Full Agent Registry (48 Agents: 00-47)

### USDAF Agents (00-33) — Reference

These agents are defined in full in `Arch standard/USDAF.md`. Summary table for cross-reference:

#### CAPA META — Orchestration & Management

| # | Agent | Role |
|---|-------|------|
| 00 | Orchestrator | Conductor / Entry Point — coordinates all agents, team selection, phase routing |
| 24 | Project Manager | PM / Phase Manager — phase transitions, gate approvals, conflict resolution |
| 25 | Innovation Scout | Market Intelligence — Gartner MQ analysis, vendor comparison |
| 26 | Product Owner | Product Manager — backlog ownership, story acceptance, priority (MoSCoW) |
| 28 | Backlog Manager | Scrum Master — sprint planning, backlog grooming, velocity, DoD enforcement |

#### CAPA 0 — Governance & Discovery

| # | Agent | Role |
|---|-------|------|
| 01 | Architecture Board | Chief Architect — ADR review, veto power, dependency enforcement |
| 02 | Requirements Architect | Business Analyst — FR/NFR elicitation, acceptance criteria |
| 03 | Compliance & Regulatory | Compliance Officer — GDPR, ISO, TPN, regulation mapping |
| 32 | UX Researcher | User Researcher — personas, journey maps, usability testing |

#### CAPA 1 — Architecture & Specifications

| # | Agent | Role |
|---|-------|------|
| 04 | Enterprise Architect | Solution Architect — C4 diagrams, tech stack, DDD bounded contexts |
| 05 | Data Architect | Domain/Data Architect — domain model, ERD, data classification |
| 06 | Integration Architect | API Architect — OpenAPI/AsyncAPI contracts, versioning |
| 07 | Infrastructure Architect | Cloud/Platform Architect — IaC, networking, DR planning |
| 27 | Spec Writer | Technical Spec Author — formal specs (OpenAPI, DB schema, wireframes) |
| 33 | Data Engineer | ETL / Pipeline Engineer — data pipelines, migrations, seeding |

#### CAPA 2 — Security

| # | Agent | Role |
|---|-------|------|
| 08 | Security Architect | **VETO POWER** — STRIDE, defense in depth, controls matrix |
| 09 | IAM Agent | Identity & Access — OAuth 2.1, OIDC, RBAC, MFA |
| 10 | Secrets & Crypto | Cryptography Specialist — AES-256-GCM, vault, key rotation |
| 11 | Threat Intelligence | Red Team / Offensive — abuse cases, OWASP, attack surface |

#### CAPA 3 — Implementation

| # | Agent | Role |
|---|-------|------|
| 12 | Domain Logic | Domain Engineer — pure business logic (DDD), entities, use cases |
| 13 | App Services | Application Layer Dev — orchestration, DTOs, authorization |
| 14 | Adapters | Infrastructure/Adapter Dev — repos, parameterized queries |
| 15 | Frontend Architect | UI/UX Architect — CSP, state management, token storage |
| 16 | UI Builder | Frontend Developer — components, accessibility (WCAG 2.1 AA) |

#### CAPA 4 — Quality Assurance

| # | Agent | Role |
|---|-------|------|
| 17 | Test Architect | QA Architect — test strategy, pyramid (70/20/10) |
| 18 | Test Implementation | QA Engineer — unit/integration/E2E/security tests |
| 19 | Code Review | Senior Developer — architecture compliance, SOLID |
| 20 | SAST | AppSec Engineer — OWASP Top 10, CVE scanning |
| 31 | Performance Engineer | Performance QA — load testing (k6), SLA validation |

#### CAPA 5 — Operations & Delivery

| # | Agent | Role |
|---|-------|------|
| 21 | CI/CD | DevOps Engineer — pipeline, Docker, SBOM, signing |
| 22 | Observability | SRE / Monitoring — JSON logs, metrics, OpenTelemetry |
| 23 | Documentation | Technical Writer — API docs, runbooks, ADRs |
| 29 | Release Manager | Release Engineer — semantic versioning, changelogs |
| 30 | DevEx Engineer | DX Specialist — local dev setup, onboarding, tooling |

---

### DEPARTMENT: BUSINESS STRATEGY (Track A)

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 34 | Startup Strategist | Chief Strategy | Lean Canvas, business model, pivot analysis, competitive positioning |
| 35 | Market Researcher | Market Analyst | TAM/SAM/SOM, competitor deep-dive. **REALITY CHECK VETO at SG-1** |
| 36 | Growth Hacker | Growth Lead | GTM strategy, distribution channels, AARRR metrics, pricing |
| 37 | Pitch Architect | Fundraising | Pitch deck, cap table, SAFE/convertible notes, investor targeting |

**Certification References**: See `Arch standard/agent-certification-map.md` (Agents 34-37).

---

### DEPARTMENT: LEGAL (Track C)

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 38 | Legal Counsel | General Counsel | Legal strategy, contract review. **VETO POWER on legal matters** |
| 39 | Privacy & Data Officer | DPO | GDPR, CCPA, LGPD, privacy policies, DPIAs, DPAs |
| 40 | IP Strategist | IP Specialist | Trademarks, patents, copyright, trade secrets, SPDX licensing |
| 41 | Contract Architect | Contracts | Founder agreements, vesting, employment, NDAs, ToS, SaaS |

**Certification References**: See `Arch standard/agent-certification-map.md` (Agents 38-41).

---

### DEPARTMENT: FINANCE & REGULATORY (Track C)

| # | Agent | Role | Key Responsibility |
|---|-------|------|-------------------|
| 42 | CFO Agent | CFO | Financial modeling, runway, burn rate, unit economics, board reporting |
| 43 | Tax Strategist | Tax Planning | Jurisdiction optimization, R&D credits, VAT/GST, transfer pricing |
| 44 | Accountant | Bookkeeping | Chart of accounts, invoicing, fiscal reports, payroll, audit prep |
| 45 | Regulatory Navigator | Country Specialist | **KEY AGENT**: Country roadmap (0-10), RAG + web search |
| 46 | Permit & License | Industry Compliance | Sector licenses, regulatory sandboxes, certifications |
| 47 | Entity Formation | Company Registration | Entity type, articles of incorporation, tax ID |

**Certification References**: See `Arch standard/agent-certification-map.md` (Agents 42-47).

---

## Parallel Track System

### Track Diagram

```
TRACK A: BUSINESS          TRACK B: TECH              TRACK C: OPERATIONS
(Startup Strategy)         (= USDAF Phases 0-7)      (Legal + Finance + Regulatory)

A0: Ideation               —                          —
A1: Market Validation       —                          C0: Jurisdiction Research
       |                                                      |
  ================ SYNC GATE SG-1: GO/NO-GO ===================
       |                                                      |
A2: Business Model          —                          C1: Entity Formation
A3: Go-to-Market Plan       B0: Kickoff                C2: Financial Setup
       |                       |                              |
  ================ SYNC GATE SG-2: BUILD READY ================
       |                       |                              |
A4: Fundraising             B1-B3: Specs/Arch/Sec      C3: Compliance Setup
       |                       |                              |
  ================ SYNC GATE SG-3: MVP READY ==================
       |                       |                              |
A5: Growth Strategy         B4-B6: Impl/QA/Ops        C4: Ongoing Compliance
       |                       |                              |
  ================ SYNC GATE SG-4: LAUNCH ======================
       |                       |                              |
A6: Scale                   B7: Governance/Launch      C5: Scale Operations
```

### Phase Descriptions

#### Track A: Business Strategy

| Phase | Name | Activities |
|-------|------|-----------|
| A0 | Ideation | Problem definition, Lean Canvas draft, initial hypothesis framing |
| A1 | Market Validation | TAM/SAM/SOM analysis, competitor deep-dive, customer interviews, MARKET VERDICT |
| A2 | Business Model | Lean Canvas finalization, Value Proposition Canvas, pricing strategy, revenue model |
| A3 | Go-to-Market Plan | Channel strategy (Bullseye), AARRR funnel design, positioning, launch messaging |
| A4 | Fundraising | Pitch deck, financial projections, cap table modeling, investor targeting, data room |
| A5 | Growth Strategy | Growth loops, referral mechanics, paid acquisition plan, retention strategy |
| A6 | Scale | Growth optimization, Series A preparation, international expansion plan |

#### Track B: Tech (= USDAF Phases 0-7)

| Phase | Name | Activities |
|-------|------|-----------|
| B0 | Kickoff | Team selection, backlog initialization (USDAF Phase 0) |
| B1 | Discovery & Specs | Requirements, compliance mapping, formal specifications (USDAF Phase 1) |
| B2 | Architecture | Solution architecture, C4 diagrams, tech stack (USDAF Phase 2) |
| B3 | Security | Threat modeling, controls matrix, AuthN/AuthZ design (USDAF Phase 3) |
| B4 | Implementation | Sprint-driven development against specs (USDAF Phase 4) |
| B5 | Quality Assurance | Testing, SAST, performance validation (USDAF Phase 5) |
| B6 | Operations | Pipeline, observability, documentation (USDAF Phase 6) |
| B7 | Governance & Launch | Final review, deployment coordination (USDAF Phase 7) |

#### Track C: Operations (Legal + Finance + Regulatory)

| Phase | Name | Activities |
|-------|------|-----------|
| C0 | Jurisdiction Research | Regulatory Navigator country assessment, entity type analysis, tax treaty review |
| C1 | Entity Formation | Company registration, articles of incorporation, founder equity, bank accounts |
| C2 | Financial Setup | Chart of accounts, financial model, runway projections, accounting setup |
| C3 | Compliance Setup | Privacy policies, DPIAs, IP filings, employment contracts, ToS/SaaS agreements |
| C4 | Ongoing Compliance | License renewals, regulatory filings, tax returns, audit preparation |
| C5 | Scale Operations | Multi-jurisdiction expansion, transfer pricing, international employment |

**Full phase details**: See `Arch standard/startup-tracks.md`.

---

## Sync Gates

Sync gates are cross-track coordination points. All three tracks must produce their required signals before the gate opens.

| Gate | Name | Track A Signal | Track B Signal | Track C Signal | Blocking Conditions |
|------|------|---------------|---------------|---------------|-------------------|
| SG-1 | GO/NO-GO | MARKET VERDICT: VIABLE (Agent 35) | — | Jurisdiction report complete (Agent 45) | Agent 35 KILL verdict, Agent 38 legal veto |
| SG-2 | BUILD READY | Business model validated, GTM plan approved | Team selected, backlog initialized (B0 gate) | Entity formed, bank account open, founder equity structured | No legal entity, no financial runway |
| SG-3 | MVP READY | Fundraising strategy defined (deck + model) | Specs approved, security review passed (B1-B3 gates) | Privacy policies drafted, IP strategy defined, compliance checklist started | Security Architect (08) veto, unresolved legal blockers |
| SG-4 | LAUNCH | Growth strategy approved, channels tested | Pipeline green, tests pass, docs complete (B4-B6 gates) | ToS/SaaS agreement finalized, regulatory filings current, data processing compliant | Any veto holder blocks, critical compliance gaps |

### Gate Protocol

1. **Orchestrator (00)** initiates gate review when all tracks signal readiness
2. Each track lead presents their deliverables
3. Veto holders (08, 35, 38) review for blocking issues
4. Gate result: **PASS** (all signals green, no vetoes) or **BLOCK** (missing signals or active veto)
5. On BLOCK: specific remediation items assigned with deadline
6. Gate review repeats until PASS

### Override Rules

- Security Architect (08) veto: **NO OVERRIDE** — unresolved critical security risks block all progress
- Market Researcher (35) veto: **OVERRIDE WITH JUSTIFICATION** — founders may proceed with written justification documenting the market risk and mitigation plan. Justification is logged as an ADR
- Legal Counsel (38) veto: **NO OVERRIDE** — unresolved legal risks (entity, IP, regulatory) block all progress

---

## Veto Power Matrix

| Agent | Veto Scope | Gates | Override? |
|-------|-----------|-------|-----------|
| 08 - Security Architect | Technical decisions, security risks, data protection | SG-2, SG-3, SG-4 | **NO** |
| 35 - Market Researcher | Market viability, competitive feasibility, TAM realism | SG-1 | **YES** (written justification required, logged as ADR) |
| 38 - Legal Counsel | Legal structure, regulatory compliance, IP protection | SG-1, SG-2, SG-4 | **NO** |

### Conflict Resolution

When veto holders disagree:

1. Security (08) trumps all on technical matters
2. Legal (38) trumps all on legal matters
3. Market (35) verdict is advisory but overridable with documented risk acceptance
4. Orchestrator (00) mediates cross-domain conflicts using the priority: **legal > security > market > business**

---

## Agent 35 — ZERO COMPLACENCY Mandate

Agent 35 (Market Researcher) operates under a strict anti-validation mandate. This directive is critical to the framework's integrity.

### Directive

```
You are the MARKET RESEARCHER. Your job is NOT to validate ideas — it is to EVALUATE them.

Core behavior:
1. You look for reasons the idea WILL FAIL, not reasons it will succeed
2. You are the founder's reality check, not their cheerleader
3. You present data and analysis, not encouragement
4. Your MARKET VERDICT determines whether the project proceeds at SG-1

MARKET VERDICT (mandatory at SG-1):
- VIABLE: Market exists, is large enough, timing is right, defensible position possible
- PIVOT NEEDED: Market exists but current approach has fatal flaws. Specify pivot direction
- KILL: No viable market, saturated beyond entry, regulatory impossibility, or timing wrong

KILL at SG-1 blocks the entire project. Founders may override with written justification
(see Override Rules), but the KILL is logged permanently.

Anti-patterns (NEVER do these):
- "With the right execution, this could work" — vague, non-actionable
- "The market is growing, so there's opportunity" — correlation is not causation
- "If they can capture just 1% of the market..." — the 1% fallacy
- Softening a KILL verdict to PIVOT NEEDED to be nice
- Omitting competitor analysis because it's uncomfortable
- Assuming the founder's TAM estimate is correct without validation
- Using vanity metrics (downloads, page views) as market proof

Required analysis at SG-1:
1. TAM/SAM/SOM with methodology (top-down AND bottom-up)
2. Competitor landscape: direct, indirect, substitute, and "do nothing"
3. Porter's Five Forces assessment
4. Technology adoption lifecycle positioning
5. Market timing analysis: why NOW (not 2 years ago, not 2 years from now)
6. Customer willingness to pay: evidence, not assumptions
7. Competitive moat assessment: network effects, switching costs, data advantages
```

### Why This Matters

Most startup frameworks validate. SUSDAF evaluates. The difference:
- **Validation**: "Let's find evidence this will work" (confirmation bias)
- **Evaluation**: "Let's find evidence this will fail, and if we can't, it might work" (falsification)

Agent 35's KILL verdict has saved more resources than any other agent decision in the framework.

---

## Agent 45 — Regulatory Navigator

Agent 45 is the country specialist. It combines a local knowledge base (RAG) with real-time web search to produce jurisdiction-specific startup roadmaps.

### RAG + Web Search Flow

```
1. Ask for target country
         ↓
2. Check regulatory-kb/{country-code}.yaml
   - If exists: load as context
   - If missing: rely on web search + general knowledge
         ↓
3. Supplement with web search
   - Company registration portals
   - Tax authority requirements
   - Data protection authority guidance
   - Industry-specific regulators
         ↓
4. Generate 11-phase roadmap:
   Phase 0:  Jurisdiction Assessment (Doing Business score, ease of formation)
   Phase 1:  Entity Type Selection (C-Corp, LLC, Ltd, GmbH, SAS, etc.)
   Phase 2:  Company Registration (articles, bylaws, registered agent)
   Phase 3:  Tax Registration (tax ID, VAT/GST, employer registration)
   Phase 4:  Bank Account Opening (requirements, documents, timeline)
   Phase 5:  Founder Equity & Vesting (share issuance, restricted stock, 83(b))
   Phase 6:  Employment Setup (labor law, contracts, payroll, benefits)
   Phase 7:  Data Protection Compliance (DPA registration, privacy policy, DPIA)
   Phase 8:  Industry-Specific Licenses (permits, certifications, sandboxes)
   Phase 9:  IP Protection (trademark filing, patent strategy, copyright)
   Phase 10: Ongoing Compliance (annual filings, tax returns, audits)
         ↓
5. Output: docs/plans/startup-roadmap-{country-code}.md
```

### Countries in KB

| Code | Country | Key Characteristics |
|------|---------|-------------------|
| US | United States | Delaware C-Corp, QSBS, Reg D, 50-state nexus |
| ES | Spain | SL/SA, autónomo, Hacienda, LOPD/GDPR |
| AR | Argentina | SAS, monotributo, AFIP, BCRA restrictions |
| GB | United Kingdom | Ltd, Companies House, SEIS/EIS, ICO |
| DE | Germany | GmbH/UG, Handelsregister, GewO, BaFin |
| MX | Mexico | SAPI/SAS, SAT, IMSS, PROFECO |
| CO | Colombia | SAS, DIAN, CCB, SIC |
| CL | Chile | SpA, SII, Start-Up Chile, CMF |
| UY | Uruguay | SAS, DGI, BPS, AGESIC |

New countries can be added by creating `regulatory-kb/{code}.yaml` following the template in the KB directory.

---

## Team Preset: startup

```yaml
preset: startup
description: "Full tech startup creation: business strategy + product development + legal + finance + regulatory"
tracks: [business, tech, operations]
ui_kit: usdaf-ui-boilerplate  # When agents 15/16 are active

mandatory:
  # Core USDAF (always)
  - 00-orchestrator
  - 08-security-architect          # VETO POWER (technical)
  - 27-spec-writer
  - 28-backlog-manager
  # Track A: Business Strategy
  - 34-startup-strategist
  - 35-market-researcher            # VETO at SG-1 (ZERO COMPLACENCY)
  # Track C: Legal
  - 38-legal-counsel                # VETO POWER (legal matters)
  - 39-privacy-data-officer
  - 41-contract-architect
  # Track C: Finance & Regulatory
  - 42-cfo-agent
  - 45-regulatory-navigator
  - 47-entity-formation

recommended:
  # Track A extras
  - 36-growth-hacker             # If go-to-market planning needed
  - 37-pitch-architect            # If fundraising planned
  # Track B (tech — add as needed based on product scope)
  - 01-architecture-board
  - 02-requirements-architect
  - 04-enterprise-architect
  - 05-data-architect             # If complex data model
  - 06-integration-architect
  - 12-domain-logic
  - 13-app-services
  - 14-adapters
  - 15-frontend-architect
  - 16-ui-builder
  - 17-test-architect
  - 18-test-implementation
  - 19-code-review
  - 21-cicd
  - 23-documentation
  - 26-product-owner
  - 32-ux-researcher              # If user-facing product
  # Track C extras
  - 40-ip-strategist              # If patents/trademarks planned
  - 43-tax-strategist             # If multi-jurisdiction or tax optimization needed
  - 44-accountant                 # If operational accounting needed
  - 46-permit-license             # If industry-specific permits required
```

### Backlog Config for SUSDAF Projects

```yaml
project_name: "Startup Name"
task_prefix: "STARTUP"
framework: SUSDAF
tracks: [business, tech, operations]
statuses: [Backlog, To Do, In Progress, In Review, Done]
default_status: Backlog
labels: [track-a, track-b, track-c, business, legal, finance, regulatory, frontend, backend, security, infra, docs, spec, test]
phases:
  # Track A
  - A0-ideation
  - A1-market-validation
  - A2-business-model
  - A3-go-to-market
  - A4-fundraising
  - A5-growth-strategy
  - A6-scale
  # Track B (USDAF)
  - B0-kickoff
  - B1-discovery
  - B2-architecture
  - B3-security
  - B4-implementation
  - B5-qa
  - B6-operations
  - B7-governance
  # Track C
  - C0-jurisdiction-research
  - C1-entity-formation
  - C2-financial-setup
  - C3-compliance-setup
  - C4-ongoing-compliance
  - C5-scale-operations
sync_gates: [SG-1, SG-2, SG-3, SG-4]
team:
  core: [00, 08, 27, 28]
  active: []              # Filled at kickoff
veto_holders: [08, 35, 38]
definition_of_done:
  - Spec reference validated (if Track B)
  - Deliverable reviewed by track lead
  - No active vetoes
  - Documentation updated
sprint_length_days: 14
target_country: null      # Set during C0
```

---

## Invocation

### PROMPT G: New SUSDAF Project

```
Read `Arch standard/SUSDAF.md`.
I want to create a tech startup. Use SUSDAF to guide me from ideation to launch.
```

**The Orchestrator (00) will:**

1. Activate the `startup` preset from `Arch standard/team-presets.md`
2. Ask for the startup idea (problem statement, target customer, initial solution hypothesis)
3. Ask for the target country (or countries)
4. Activate all 3 tracks in parallel
5. Begin Track A (A0: Ideation) and Track C (C0: Jurisdiction Research) simultaneously
6. Initialize backlog with SUSDAF-specific labels, phases, and sync gates
7. Coordinate toward SG-1 (GO/NO-GO) as the first major decision point

### PROMPT H: Apply SUSDAF to Existing Startup

```
Read `Arch standard/SUSDAF.md` and `Arch standard/startup-tracks.md`.
I have an existing startup at [path/description]. Apply SUSDAF to assess current state
and identify gaps across all three tracks.
```

**The Orchestrator (00) will:**

1. Audit existing assets against SUSDAF track phases
2. Determine which sync gates have been implicitly passed
3. Identify gaps (missing legal docs, no financial model, no market validation, etc.)
4. Generate a remediation backlog with priority items
5. Resume from the earliest incomplete sync gate

---

## Startup Sprint Cycle

All three tracks run sprint cycles in parallel, synchronized at sync gates.

```
Week 1-2:  Track A Sprint (Ideation + Market Validation)
           Track C Sprint (Jurisdiction Research)
           → SG-1 gate review

Week 3-4:  Track A Sprint (Business Model + GTM)
           Track C Sprint (Entity Formation + Financial Setup)
           → SG-2 gate review

Week 5-8:  Track A Sprint (Fundraising)
           Track B Sprint (USDAF Phases 1-3: Specs, Architecture, Security)
           Track C Sprint (Compliance Setup)
           → SG-3 gate review

Week 9-16: Track A Sprint (Growth Strategy)
           Track B Sprint (USDAF Phases 4-6: Implementation, QA, Ops)
           Track C Sprint (Ongoing Compliance)
           → SG-4 gate review → LAUNCH
```

**Cross-Track Sync**: Orchestrator (00) runs a weekly cross-track standup (15 min) to surface dependencies and blockers between tracks.

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `Arch standard/USDAF.md` | Tech development framework (Track B) — phases, gates, specs |
| `Arch standard/startup-tracks.md` | Detailed track phases, sync gate protocol, deliverable checklists |
| `Arch standard/team-presets.md` | Team preset: `startup` (and all other presets) |
| `Arch standard/spec-templates.md` | Spec templates for Track B (OpenAPI, DB schema, wireframes) |
| `Arch standard/agent-certification-map.md` | Professional certifications for all 48 agents (00-47) |
| `Arch standard/ui-kit-standard.md` | Frontend toolkit standard (shadcn/ui + Magic UI + Framer Motion) |
| `Arch standard/backlog-guide.md` | Backlog management methodology |
| `regulatory-kb/` | Country-specific regulatory data (YAML) |
| `agents/34-startup-strategist.md` | Agent 34 prompt definition |
| `agents/35-market-researcher.md` | Agent 35 prompt definition |
| `agents/36-growth-hacker.md` | Agent 36 prompt definition |
| `agents/37-pitch-architect.md` | Agent 37 prompt definition |
| `agents/38-legal-counsel.md` | Agent 38 prompt definition |
| `agents/39-privacy-data-officer.md` | Agent 39 prompt definition |
| `agents/40-ip-strategist.md` | Agent 40 prompt definition |
| `agents/41-contract-architect.md` | Agent 41 prompt definition |
| `agents/42-cfo-agent.md` | Agent 42 prompt definition |
| `agents/43-tax-strategist.md` | Agent 43 prompt definition |
| `agents/44-accountant.md` | Agent 44 prompt definition |
| `agents/45-regulatory-navigator.md` | Agent 45 prompt definition |
| `agents/46-permit-license.md` | Agent 46 prompt definition |
| `agents/47-entity-formation.md` | Agent 47 prompt definition |

---

## Relationship to Existing Framework

| Existing | SUSDAF |
|----------|--------|
| USDAF (34 agents, 8 phases) | Preserved as Track B — unchanged |
| USDAF Gates G-1 through G5 | Still work within Track B |
| USDAF Security Veto (Agent 08) | Extended to Sync Gates SG-2, SG-3, SG-4 |
| USDAF Clean Architecture | Preserved exactly as-is |
| USDAF Spec-First | Preserved — specs still required before code |
| (new) Track A: Business Strategy | 4 agents (34-37), 7 phases (A0-A6) |
| (new) Track C: Operations | 10 agents (38-47), 6 phases (C0-C5) |
| (new) Sync Gates SG-1 through SG-4 | Cross-track coordination points |
| (new) Triple Veto | Agents 08, 35, 38 hold veto power |
| (new) Agent 35 ZERO COMPLACENCY | Market validation with anti-confirmation-bias mandate |
| (new) Agent 45 Regulatory Navigator | Country-aware RAG + web search for jurisdiction roadmaps |
| Prompts A-F | Still work unchanged (backward compatible) |
| (new) Prompt G | Start new SUSDAF project |
| (new) Prompt H | Apply SUSDAF to existing startup |

---

*SUSDAF v1.0 — Companion to USDAF v1.0*
*Total agent pool: 48 agents (00-47) across 3 tracks*
