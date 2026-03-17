---
name: vantage-architecture
description: "VANTAGE Phase 2: Architecture — C4 diagrams, ERD, API contracts, ADRs"
---

# VANTAGE Architecture Phase

## Agents

Activate these agents for this phase:
- **01-Architecture Board** (subagent, gate approval): ADR review and veto authority
- **04-Enterprise Architect** (subagent): Design C4 context and container diagrams
- **05-Data Architect** (subagent): Design ERD and data domain boundaries
- **06-Integration Architect** (subagent): Design API contracts (OpenAPI) and integration patterns
- **27-Spec Writer** (subagent): Formalize architecture specs
- **28-Backlog Manager** (main context): Break down architecture into Phase 3 tasks

## Process

1. **Design C4 diagrams**: Dispatch 04-Enterprise Architect as subagent:
   - Input: requirements.md, dependency-map.md
   - Output: C4 context diagram (system in context), C4 container diagram (services/boundaries)
   - Format: PlantUML or ASCII art in markdown

2. **Design ERD**: Dispatch 05-Data Architect as subagent:
   - Input: requirements (data entities), C4 containers
   - Output: Entity-Relationship Diagram (Mermaid ER or ASCII)
   - Identify domain boundaries using DDD bounded contexts

3. **Design API contracts**: Dispatch 06-Integration Architect as subagent:
   - Input: C4 diagram (integration points), ERD (resources)
   - Output: OpenAPI 3.1 specs for each API boundary
   - Include request/response schemas, error codes, auth requirements

4. **ADR review**: Dispatch 01-Architecture Board as subagent:
   - Input: C4 diagrams, ERD, API contracts
   - Output: ADRs for major architectural decisions
   - Gate: Architecture Board approval required before Phase 3

5. **Formalize specs**: Dispatch 27-Spec Writer as subagent:
   - Input: all architecture artifacts
   - Output: architecture specification document

6. **Update backlog**: 28-Backlog Manager breaks down architecture into Phase 3 implementation tasks

## Artifacts

- C4 context diagram (system + environment)
- C4 container diagram (services, databases, external systems)
- Entity-Relationship Diagram (Mermaid or ASCII)
- OpenAPI specifications (one per API boundary)
- Architectural Decision Records (ADRs) for major decisions
- Architecture specification document

## Gate Criteria

- [ ] Architecture Board (Agent 01) approval obtained
- [ ] All C4 diagrams complete and reviewed
- [ ] ERD includes all entities with clear domain boundaries
- [ ] OpenAPI specs complete with schemas, examples, error codes
- [ ] ADRs address all major architectural decisions
- [ ] No unresolved architectural conflicts or vetos
- [ ] Backlog Phase 3 tasks properly scoped

## Context Strategy

- Each architect subagent gets a fresh session with: agent prompt, memory, requirements.md, and relevant prior artifacts only
- Enterprise Architect runs first (C4 output feeds Data and Integration Architects)
- Data Architect and Integration Architect can run in parallel after C4 is complete
- Spec Writer gets only finalized artifacts, not intermediate drafts
- Keep Architecture Board review focused: ADRs + diagrams only, not full conversation history

## Token Budget

Estimated: 25-40K tokens

## Memory

After phase completion, graduate learnings:
- System context and boundaries → persistent memory
- Domain entities and relationships → persistent memory
- API patterns and integration points → persistent memory
- Architectural decisions and rationale → ADR repository
- Technology choices and justification → persistent memory

## Reassessment

After gate approval:
1. Orchestrator + Product Owner review remaining phases
2. Re-prioritize backlog based on architectural decisions (ADRs)
3. Identify newly discovered integration points or complexity
4. Adjust team composition if architecture requires additional specialists
5. Update PROJECT-STATE.md with revised plan
