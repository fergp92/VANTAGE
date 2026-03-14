# USDAF — Team Presets

> Project-specific agent team configurations. Used by Agent 00 (Orchestrator) during Phase 0 (Kickoff).

---

## How Team Selection Works

1. User describes their project scope
2. Orchestrator (00) recommends a preset based on project type
3. User confirms or customizes the team
4. Team roster is saved to `backlog/config.yml`
5. Only active team agents participate in the project

---

## Core Team (Always Active)

These agents are **mandatory for every project**, regardless of preset:

| # | Agent | Why |
|---|-------|-----|
| 00 | Orchestrator | Coordinates all phases and agents |
| 08 | Security Architect | Veto power, security-by-design is non-negotiable |
| 27 | Spec Writer | Spec-driven development is the foundation of USDAF |
| 28 | Backlog Manager | Task lifecycle tracking is non-negotiable |

---

## Preset: Full Stack Application

**Use when**: Building a web/mobile app with API backend, database, and frontend.

**UI Kit**: When frontend is included, use `Arch standard/ui-kit-standard.md`. Init from `usdaf-ui-boilerplate/`.

```yaml
preset: full-stack-app
description: "Complete web/mobile application with API and frontend"
ui_kit: usdaf-ui-boilerplate  # When agents 15/16 are active — shadcn/ui + Magic UI + Framer Motion + CVA

mandatory:
  - 00-orchestrator
  - 01-architecture-board
  - 02-requirements-architect
  - 04-enterprise-architect
  - 06-integration-architect
  - 08-security-architect
  - 12-domain-logic
  - 13-app-services
  - 14-adapters
  - 15-frontend-architect
  - 17-test-architect
  - 18-test-implementation
  - 19-code-review
  - 21-cicd
  - 23-documentation
  - 26-product-owner
  - 27-spec-writer
  - 28-backlog-manager

recommended:
  - 05-data-architect         # If complex data model
  - 07-infrastructure         # If deploying to cloud
  - 09-iam                    # If auth beyond basic OAuth
  - 10-secrets-crypto         # If handling sensitive data
  - 16-ui-builder             # If complex UI components
  - 20-sast                   # If security-critical
  - 22-observability          # If production monitoring needed
  - 29-release-manager        # If formal release process
  - 30-devex-engineer         # If team onboarding needed
  - 31-performance-engineer   # If performance SLAs exist
  - 32-ux-researcher          # If user-facing product
  - 33-data-engineer          # If migrations/seeding needed
```

---

## Preset: API Service / Microservice

**Use when**: Building a backend API or microservice without a frontend.

```yaml
preset: api-service
description: "Backend API or microservice"

mandatory:
  - 00-orchestrator
  - 01-architecture-board
  - 02-requirements-architect
  - 04-enterprise-architect
  - 06-integration-architect
  - 08-security-architect
  - 12-domain-logic
  - 13-app-services
  - 14-adapters
  - 17-test-architect
  - 18-test-implementation
  - 19-code-review
  - 21-cicd
  - 23-documentation
  - 27-spec-writer
  - 28-backlog-manager

recommended:
  - 05-data-architect
  - 07-infrastructure
  - 09-iam
  - 10-secrets-crypto
  - 20-sast
  - 22-observability
  - 29-release-manager
  - 31-performance-engineer
  - 33-data-engineer
```

---

## Preset: Security Hardening

**Use when**: Hardening an existing application's security posture.

```yaml
preset: security-hardening
description: "Security hardening of existing application"

mandatory:
  - 00-orchestrator
  - 08-security-architect
  - 09-iam
  - 10-secrets-crypto
  - 11-threat-intelligence
  - 17-test-architect
  - 18-test-implementation
  - 20-sast
  - 27-spec-writer
  - 28-backlog-manager

recommended:
  - 01-architecture-board
  - 19-code-review
  - 21-cicd
  - 22-observability
```

---

## Preset: Documentation Project

**Use when**: Creating policies, standards, SOPs, or technical documentation.

```yaml
preset: documentation
description: "Policy, standard, and documentation creation"

mandatory:
  - 00-orchestrator
  - 02-requirements-architect
  - 03-compliance
  - 23-documentation
  - 26-product-owner
  - 27-spec-writer
  - 28-backlog-manager

recommended:
  - writer                    # IAM-specific doc writer
  - iam-architect             # IAM technical reviewer
  - ceo-reviewer              # Executive reviewer
  - compliance                # Compliance validator
```

---

## Preset: Data Pipeline

**Use when**: Building ETL, data pipelines, analytics, or data processing systems.

```yaml
preset: data-pipeline
description: "ETL, data pipeline, or analytics system"

mandatory:
  - 00-orchestrator
  - 01-architecture-board
  - 02-requirements-architect
  - 05-data-architect
  - 07-infrastructure
  - 08-security-architect
  - 14-adapters
  - 17-test-architect
  - 18-test-implementation
  - 21-cicd
  - 27-spec-writer
  - 28-backlog-manager
  - 33-data-engineer

recommended:
  - 10-secrets-crypto
  - 20-sast
  - 22-observability
  - 29-release-manager
```

---

## Preset: Frontend Application

**Use when**: Building a SPA, mobile app, or UI-heavy application.

**UI Kit**: MANDATORY — Init from `usdaf-ui-boilerplate/`, reference `Arch standard/ui-kit-standard.md`.

```yaml
preset: frontend-app
description: "Single-page application or mobile UI"
ui_kit: usdaf-ui-boilerplate  # MANDATORY — shadcn/ui + Magic UI + Framer Motion + CVA

mandatory:
  - 00-orchestrator
  - 02-requirements-architect
  - 08-security-architect
  - 15-frontend-architect
  - 16-ui-builder
  - 17-test-architect
  - 18-test-implementation
  - 27-spec-writer
  - 28-backlog-manager
  - 32-ux-researcher

recommended:
  - 01-architecture-board
  - 06-integration-architect
  - 19-code-review
  - 20-sast
  - 30-devex-engineer
```

---

## Preset: Minimum Viable / Prototype

**Use when**: Building a quick prototype or MVP with minimal ceremony.

```yaml
preset: minimum-viable
description: "Quick prototype or MVP"

mandatory:
  - 00-orchestrator
  - 02-requirements-architect
  - 12-domain-logic
  - 13-app-services
  - 14-adapters
  - 17-test-architect
  - 27-spec-writer
  - 28-backlog-manager

recommended:
  - 08-security-architect     # Light-touch security review
  - 19-code-review
  - 21-cicd
```

**Note**: Even for MVPs, Agent 08 is in the core team and provides at minimum a security checklist review before launch.

---

## Preset: Creative & Innovation (Game Development)

**Use when**: Designing new game features, modes, quest content, UX improvements, and creative direction. Sprint-based creative cycle with spec-driven handoff to implementation.

**UI Kit**: MANDATORY — Init from `usdaf-ui-boilerplate/`, reference `Arch standard/ui-kit-standard.md`.

```yaml
preset: creative-innovation
description: "Game design, UX research, quest writing, and creative direction"
ui_kit: usdaf-ui-boilerplate  # Agents 15/16 active — shadcn/ui + Magic UI + Framer Motion + CVA

mandatory:
  - 00-orchestrator             # Coordinates creative sprints
  - 02-requirements-architect   # Player stories, acceptance criteria
  - 12-domain-logic             # Game mechanics, rules, state machines
  - 15-frontend-architect       # UI/UX architecture, interaction patterns
  - 16-ui-builder               # Component design, accessibility, visual polish
  - 23-documentation            # Game design docs, quest descriptions, mode guides
  - 25-innovation-scout         # Benchmarking competitors, gaming trends, inspiration
  - 26-product-owner            # Creative vision, feature prioritization, final approval proxy
  - 27-spec-writer              # Specs for new modes, wireframes, API contracts
  - 28-backlog-manager          # Sprint planning, velocity, backlog grooming
  - 32-ux-researcher            # Player personas, journey maps, usability, playtesting

recommended:
  - 05-data-architect           # If new data models needed (e.g. achievements, leaderboards)
  - 06-integration-architect    # If new API endpoints needed
  - 08-security-architect       # If feature touches auth or user data
  - 13-app-services             # If backend orchestration needed
```

**Creative Sprint Cycle** (2 weeks):
1. **Discovery** (Day 1-3): UX Researcher (32) + Innovation Scout (25) research trends, player feedback, competitor analysis
2. **Ideation** (Day 4-5): Product Owner (26) + Requirements Architect (02) define player stories, prioritize ideas
3. **Specification** (Day 6-8): Spec Writer (27) + Domain Logic (12) write game mechanics specs, quest structures
4. **Design** (Day 9-11): Frontend Architect (15) + UI Builder (16) create wireframes, interaction patterns
5. **Review** (Day 12-14): Documentation (23) writes game design docs → **Human approver** gives final go/no-go
6. **Handoff**: Approved specs move to the Full Stack team backlog for implementation

---

## Preset: Startup (Full Lifecycle) — SUSDAF

**Use when**: Creating a tech startup from scratch — from ideation and market validation through legal formation, fundraising, and product development. Activates all three parallel tracks (Business, Tech, Operations). This preset uses the **SUSDAF** (Startup Unified Spec-Driven Agile Framework) — see `Arch standard/SUSDAF.md`.

**Tracks**: All three tracks active (A: Business Strategy, B: Tech, C: Operations). See `Arch standard/startup-tracks.md`.

**UI Kit**: When frontend is included, use `Arch standard/ui-kit-standard.md`. Init from `usdaf-ui-boilerplate/`.

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

**Startup Sprint Cycle** (parallel across tracks):
1. **Track A Sprint** (weeks 1-2): Startup Strategist (34) + Market Researcher (35) → Lean Canvas, market validation, MARKET VERDICT
2. **Track C Sprint** (weeks 1-4): Regulatory Navigator (45) + Entity Formation (47) → Country roadmap, entity selection, formation
3. **Track B Sprint** (after SG-2): Standard USDAF sprint cycle for product development
4. **Cross-Track Sync**: Orchestrator (00) coordinates sync gates SG-1 through SG-4

---

## Custom Team Configuration

Users can always customize by adding/removing agents:

```
Orchestrator: "I recommend the Full Stack App preset for this project.
This includes 18 mandatory agents. Would you like to:
1. Use this preset as-is
2. Add agents from the recommended list
3. Start from scratch and pick individual agents
4. Use a different preset

Which agents from the recommended list would you like to add?"
```

---

## Team Roster in config.yml

```yaml
team:
  core: [00, 08, 27, 28]           # Always active
  active: [00, 01, 02, 04, ...]    # Full active team for this project
  preset: full-stack-app             # Which preset was used
  customizations:                    # Any additions/removals from preset
    added: [32-ux-researcher]
    removed: []
```
