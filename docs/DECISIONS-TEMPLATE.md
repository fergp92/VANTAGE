# Architecture Decision Register

> Append-only record of architectural decisions. Referenced by all agents.
> Location: `backlog/decisions/DECISIONS.md`

## Format

Each decision follows this template:

---

### ADR-[NNN]: [Title]

- **Date**: YYYY-MM-DD
- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-[NNN]
- **Context**: [What is the issue or situation that motivated this decision?]
- **Decision**: [What was decided and why?]
- **Consequences**: [What are the positive and negative effects?]
- **Deciding Agent**: [Which agent(s) made or influenced this decision]
- **Phase**: [Which phase was this decided in]

---

## Rules

1. Decisions are **append-only** — never edit or delete past entries
2. To change a decision, add a new ADR with status "Superseded by ADR-[NNN]"
3. Agents that MUST record decisions here:
   - 01-Architecture Board (architectural decisions)
   - 04-Enterprise Architect (technology choices)
   - 08-Security Architect (security decisions, vetoes)
   - 26-Product Owner (scope decisions)
4. Memory graduation can reference decision IDs instead of duplicating content
5. The Orchestrator reads recent decisions at session start via PROJECT-STATE.md

## Example

### ADR-001: Use PostgreSQL for primary data store

- **Date**: 2026-03-15
- **Status**: Accepted
- **Context**: Need a relational database with strong ACID compliance, JSON support, and mature ecosystem.
- **Decision**: Use PostgreSQL 16 with pgvector extension for future vector search capabilities.
- **Consequences**: (+) Mature, well-supported, team familiarity. (-) Heavier than SQLite for local dev.
- **Deciding Agent**: 05-Data Architect, approved by 01-Architecture Board
- **Phase**: Phase 2 — Architecture
