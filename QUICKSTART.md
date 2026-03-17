# Quick Start Guide — VANTAGE

> **VANTAGE** — Verified Agent Network for Trusted, Governed Engineering

## Option A: Using the v2.0 Runtime (Recommended)

```bash
# 1. Initialize VANTAGE in your project
cd your-project
npx vantage init

# 2. This creates:
#    .vantage/runtime/    — 7 runtime modules (memory, toolkits, tokens, scout, registry, maintenance, session-lock)
#    .vantage/skills/     — 6 phase skill definitions (with context strategy + wave execution)
#    .vantage/toolkits/   — Agent tool indices + definitions
#    .vantage/config.yml  — Project configuration (ceremony levels, git strategy)
#    Updates CLAUDE.md and .gitignore

# 3. Estimate token cost before starting
node .vantage/runtime/token-estimator.js estimate --complexity medium

# 4. Check for crash recovery (on session resume)
node .vantage/runtime/session-lock.js check

# 5. Start with Agent 00 (Orchestrator) — it will guide the rest
```

### v2.0 Runtime Commands

```bash
# Token estimation
node .vantage/runtime/token-estimator.js estimate --complexity simple
node .vantage/runtime/token-estimator.js estimate --complexity complex --agents 00,02,04,08,12,15,17

# Agent memory
node .vantage/runtime/memory-manager.js load 08-security-architect
node .vantage/runtime/memory-manager.js compact 08-security-architect

# Toolkit inspection
node .vantage/runtime/toolkit-loader.js list 08-security-architect
node .vantage/runtime/toolkit-loader.js load stride-analysis

# Scout cache
node .vantage/runtime/scout-service.js search jwt --cache-only
node .vantage/runtime/scout-service.js cache

# Maintenance
node .vantage/runtime/maintenance.js audit
node .vantage/runtime/maintenance.js check

# Session recovery
node .vantage/runtime/session-lock.js check
node .vantage/runtime/session-lock.js clear

# Cost dashboard
node .vantage/runtime/token-estimator.js dashboard
```

### Ceremony Levels

Choose ceremony based on task scope:

```bash
# Quick — bug fixes, config changes, one-file edits (1 agent, ~20K tokens)
vantage quick

# Standard — features within existing architecture (core team, ~80K tokens)
vantage standard

# Full — new features requiring spec changes (full team, ~200K tokens)
vantage full

# Enterprise — regulated industries, compliance required (~400K tokens)
vantage enterprise
```

## Option B: Manual Agent Loading (Any LLM)

1. Pick a team preset from `docs/team-presets.md`
2. Load the relevant agent prompts from `agents/`
3. Append the certification context from `docs/agent-certification-map.md`
4. Start with Phase 0 (Kickoff)

### Agent Quick Reference

| I need to... | Use Agent |
|---|---|
| Define what to build | 02-Requirements Architect |
| Design the database/domain model | 05-Data Architect |
| Design APIs | 06-Integration Architect |
| Set up auth/permissions | 09-IAM Agent |
| Write business logic | 12-Domain Logic Agent |
| Build the frontend | 15-Frontend Architect + 16-UI Builder |
| Write tests | 17-Test Architect + 18-Test Implementation |
| Review code for security | 08-Security Architect + 20-SAST Agent |
| Set up CI/CD | 21-CI/CD Agent |

## Option C: Security Review Only

For existing code, use agents 08 + 11 + 19 + 20 in sequence:
1. Security Architect — threat model your system
2. Threat Intelligence — find attack surfaces
3. Code Review — check architecture compliance
4. SAST — scan for OWASP Top 10

## Tips for Best Results

1. **Choose the right ceremony level** — Quick for bug fixes, Full for new features. Don't over-engineer small tasks.
2. **Start with requirements** — Even for fast projects, 5 minutes on requirements saves hours of rework
3. **Always include the Security agent** — Auth is where most projects get compromised
4. **Use the Security Architect early** — Designing security in is cheaper than bolting it on
5. **Feed artifacts forward** — Each agent's output is the next agent's input
6. **Don't skip gates** — If a gate fails, fix it before moving on
7. **Check memory** — Agent learnings from past sessions prevent repeating mistakes
8. **Read PROJECT-STATE.md first** — At every session start, read the state dashboard for rapid orientation
9. **Keep context fresh** — Subagents always get clean sessions with focused context injection

## Example Prompt to Start

```
I want to build a task management API with:
- User registration and login
- Teams with multiple users
- Tasks assigned to users within teams
- Role-based access (admin, member, viewer)
- REST API with PostgreSQL
- Docker deployment

Use VANTAGE phases 0-7 and start with Phase 0 (Kickoff).
```

The Orchestrator will invoke each agent in order, building the complete system.
