---
name: vantage-discovery
description: "VANTAGE Phase 1: Discovery — requirements gathering, OSS scout, stack mapping"
---

# VANTAGE Discovery Phase

## Agents

Activate these agents for this phase:
- **02-Requirements Architect** (subagent): Gather and structure requirements from user input
- **25-Innovation Scout** (subagent, proactive): Map requirements against OSS packages
- **27-Spec Writer** (subagent): Draft requirements spec document
- **28-Backlog Manager** (main context): Initialize backlog with discovered tasks

## Process

1. **Gather requirements**: Ask the user to describe their idea. Use brainstorming skill if needed.
2. **Toolkit preferences** (if not already resolved in Phase 0):
   - Ask the user: *"Would you like to specify particular tools/repos, or should I select the best-rated standards for your stack?"*
   - **User-specified**: Add provided GitHub repos / packages to general or specialized toolkits
   - **Auto-discover**: Scout searches for highest-rated, actively maintained repos matching the stack. Check scout cache first — refresh stale evaluations (>90 days). Update toolkits with discoveries.
   - **Hybrid**: User specifies some, system discovers the rest
   - Store toolkit preferences in `.vantage/config.yml` under `toolkit` section
3. **Structure requirements**: Dispatch 02-Requirements Architect as subagent:
   - Input: user's description
   - Output: `requirements.md` with FR/NFR, user stories, acceptance criteria
4. **Scout OSS packages + toolkit repos**: Dispatch 25-Innovation Scout as subagent (parallel with step 3):
   - Input: identified technology needs from requirements + toolkit preferences
   - First check evaluation cache: `node .vantage/runtime/scout-service.js cache`
   - Search for packages: `npm search`, `gh search repos`
   - For toolkit auto-discovery: search GitHub for best-rated repos by stars, recent activity, and community health. Evaluate against license whitelist and security posture.
   - Output: `dependency-map.md` with package evaluations + toolkit recommendations
5. **Update toolkits**: Based on scout results and user preferences:
   - Add cross-cutting tools to `.vantage/toolkits/general.index.yml`
   - Add role-specific tools to agent specialized indices
   - Create `.tool.yml` definitions for each new tool with `source` field pointing to the repo
6. **Draft spec**: Dispatch 27-Spec Writer as subagent:
   - Input: requirements.md + dependency-map.md
   - Output: project spec document
7. **Initialize backlog**: 28-Backlog Manager creates initial task breakdown

## Artifacts

- `requirements.md` — structured requirements (FR/NFR/user stories)
- `dependency-map.md` — OSS package evaluations and decisions
- Updated `general.index.yml` — general toolkit with user-approved tools
- Updated agent specialized indices — role-specific tool additions
- New `.tool.yml` definitions — for each discovered/specified tool
- Project spec document
- Initial backlog

## Gate Criteria

- [ ] Requirements reviewed and approved by user
- [ ] Dependency map reviewed (no REJECT packages without alternatives)
- [ ] Toolkit preferences resolved (user-specified, auto-discovered, or hybrid)
- [ ] Toolkit updates reviewed — no stale or low-rated repos in toolkits
- [ ] Spec document complete with all sections filled
- [ ] Backlog initialized with at least Phase 2 tasks

## Context Strategy

- Dispatch each subagent with a fresh session containing only: agent prompt, memory, and user's project description
- Requirements Architect and Innovation Scout can run in parallel (independent inputs)
- Keep Orchestrator context lean: only gate criteria results, not full subagent outputs
- If requirements are complex (>20 user stories), split into domain-bounded discovery sessions

## Token Budget

Estimated: 20-35K tokens

## Memory

After phase completion, graduate learnings:
- Decisions about technology choices → persistent memory
- Package evaluations → evaluations.md cache
- Discoveries about project constraints → persistent memory

## Reassessment

After gate approval:
1. Orchestrator + Product Owner review remaining phases
2. Re-estimate token budget based on actual discovery complexity
3. Adjust team composition if project scope changed during discovery
4. Update PROJECT-STATE.md with revised plan
