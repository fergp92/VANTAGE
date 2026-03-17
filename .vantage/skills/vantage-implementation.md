---
name: vantage-implementation
description: "VANTAGE Phase 4: Implementation — TDD, component coding, worktree-based development"
---

# VANTAGE Implementation Phase

## Agents

Activate these agents for this phase:
- **12-Domain Logic** (subagent, worktree): Implement Clean Arch core (entities, use cases)
- **13-App Services** (subagent, worktree): Implement orchestration layer (DTOs, transactions, audit)
- **14-Adapters** (subagent, worktree): Implement repository layer and external clients
- **15-Frontend Architect** (subagent, worktree): Design frontend architecture, state management
- **16-UI Builder** (subagent, worktree): Build UI components, CSS, accessibility
- **25-Innovation Scout** (subagent, reactive): Spawned on-demand for library/pattern questions
- **28-Backlog Manager** (main context): Task assignment and backlog progression

## Process

1. **Initialize worktrees**: Create isolated git worktrees for concurrent development:
   - `domain-logic/` — Agent 12
   - `app-services/` — Agent 13
   - `adapters/` — Agent 14
   - `frontend/` — Agent 15
   - `ui-components/` — Agent 16

2. **Domain logic implementation**: Dispatch 12-Domain Logic as subagent (worktree):
   - Input: requirements.md, ERD, architecture spec, security requirements
   - Output: Clean Arch core layer (entities, use cases, business rules)
   - TDD: Write tests first, then implementation
   - No external dependencies; pure business logic

3. **Application services**: Dispatch 13-App Services as subagent (worktree):
   - Input: domain logic, API contracts
   - Output: service layer (orchestration, DTOs, transaction management, audit trail)
   - TDD: Unit tests for each service
   - Integrate with domain layer

4. **Adapters and repositories**: Dispatch 14-Adapters as subagent (worktree):
   - Input: application services, ERD, external API contracts
   - Output: repository implementations (DB access), external client adapters
   - TDD: Unit tests with mocked dependencies
   - Parameterized queries (NO string concatenation for SQL)

5. **Frontend architecture**: Dispatch 15-Frontend Architect as subagent (worktree):
   - Input: API contracts, wireframes/UI specs, requirements
   - Output: frontend architecture (state management, routing, folder structure)
   - Define: component hierarchy, data flow, auth flow
   - TDD: Mock APIs, test state transitions

6. **UI components**: Dispatch 16-UI Builder as subagent (worktree):
   - Input: frontend architecture, design system (if available), accessibility standards
   - Output: reusable UI components (buttons, forms, modals, etc.)
   - TDD: Component tests (render, interaction, accessibility)
   - Follow shadcn/ui or equivalent design system patterns

7. **Reactive scouting**: 25-Innovation Scout available on-demand:
   - Triggered by any subagent question about libraries, patterns, or alternatives
   - Rapid research + cache check
   - Response time: 2-5 min

8. **Backlog progression**: 28-Backlog Manager:
   - Assign tasks from Phase 4 backlog to available subagents
   - Track completion, report blockers
   - Maintain task dependency graph

## Wave Execution

Within each architectural layer, independent tasks run in parallel as "waves."
The next wave waits for all tasks in the current wave to complete.

### Wave Grouping Rules
1. Tasks declare dependencies in their backlog entry
2. Independent tasks within the same layer form a wave
3. Waves execute in dependency order; tasks within a wave execute in parallel
4. Cross-layer dependencies enforce layer ordering (Domain → App → Adapters → Frontend)

### Example Wave Plan
```
Wave 1 (Domain — parallel):
  ├── Task: User entity + use cases          → Agent 12 (worktree)
  ├── Task: Product entity + use cases       → Agent 12 (worktree)
  └── Task: Order entity + use cases         → Agent 12 (worktree)

Wave 2 (App Services — parallel, depends on Wave 1):
  ├── Task: UserService                      → Agent 13 (worktree)
  ├── Task: ProductService                   → Agent 13 (worktree)
  └── Task: OrderService                     → Agent 13 (worktree)

Wave 3 (Adapters — parallel, depends on Wave 2):
  ├── Task: UserRepository + DB adapter      → Agent 14 (worktree)
  ├── Task: ProductRepository + DB adapter   → Agent 14 (worktree)
  └── Task: PaymentGateway adapter           → Agent 14 (worktree)

Wave 4 (Frontend — parallel, depends on Wave 2):
  ├── Task: Auth pages + state               → Agent 15 (worktree)
  ├── Task: Product catalog pages            → Agent 15 (worktree)
  └── Task: Checkout flow                    → Agent 16 (worktree)
```

### Wave Completion Protocol
- All tasks in a wave must pass their verification criteria before next wave starts
- Failed tasks block only dependent waves, not independent ones
- Backlog Manager tracks wave progress and reports to Orchestrator

## Git Strategy

Follow the project's configured git strategy (see `.vantage/config.yml`):

### Atomic (Default)
- One commit per completed backlog item
- Commit message format: `[PROJ-NNN] type: description`
  - Types: feat, fix, refactor, test, docs, chore, security
- Feature branch per sprint: `sprint-NNN/phase-4-implementation`
- Squash merge to main at phase gate

### Commit Rules
1. Every commit references a backlog item ID
2. Commits are atomic and revertible (one logical change per commit)
3. No commits with failing tests
4. Security-sensitive commits require Agent 08 review before push
5. Worktree branches merge to sprint branch via squash merge

### Branch Naming
- Sprint branches: `sprint-NNN/phase-N-name`
- Worktree branches: `sprint-NNN/agent-NN-task-description`
- Release branches: `release/vN.N.N`

## Artifacts

- Source code (domain, services, adapters, frontend, UI components)
- Unit tests (>80% coverage target)
- Component documentation (Storybook or similar)
- API integration examples
- Migration scripts (if schema changes)

## Gate Criteria

- [ ] All domain logic tests pass (TDD completion)
- [ ] All service layer tests pass
- [ ] All adapter tests pass (mocked external dependencies)
- [ ] All component tests pass and accessible
- [ ] Code review clean (Agent 19) — no CRITICAL issues
- [ ] No Security Architect veto (Agent 08 approval for auth/crypto implementation)
- [ ] Backlog refine tasks for Phase 5

## Context Strategy

- CRITICAL: Each implementation subagent MUST get a fresh session with clean context
- Include only: agent prompt, memory, relevant specs (OpenAPI, ERD), security requirements, and task description
- Domain Logic agent gets the leanest context (specs + requirements only, no infrastructure details)
- Each worktree subagent works independently; results merged at Orchestrator level
- If a single agent task exceeds 50K tokens, split into smaller domain-bounded subtasks
- Innovation Scout gets minimal context: just the specific question + technology constraints

## Token Budget

Estimated: 50-80K tokens

## Memory

After phase completion, graduate learnings:
- Domain entity patterns discovered → persistent memory
- Business logic edge cases → persistent memory
- Service orchestration patterns → persistent memory
- ORM/repository patterns → persistent memory
- Frontend state management decisions → persistent memory
- UI component patterns and accessibility solutions → persistent memory
- Library evaluations and quirks → update evaluations.md

## Reassessment

After gate approval:
1. Orchestrator + Product Owner review QA and Operations phases
2. Identify areas needing extra testing based on implementation complexity
3. Flag any deferred technical debt for future sprints
4. Update velocity data and re-estimate remaining phases
5. Update PROJECT-STATE.md with implementation outcomes
