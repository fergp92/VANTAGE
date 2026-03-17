---
name: vantage-qa
description: "VANTAGE Phase 5: QA — test strategy, integration tests, code review, SAST scan"
---

# VANTAGE QA Phase

## Agents

Activate these agents for this phase:
- **17-Test Architect** (subagent): Design test strategy and coverage goals
- **18-Test Implementation** (subagent, worktree): Write integration/E2E tests
- **19-Code Review** (subagent): Peer review of implementation
- **20-SAST** (subagent): Static analysis and security scanning
- **28-Backlog Manager** (main context): Track issues and rework tasks

## Process

1. **Test strategy**: Dispatch 17-Test Architect as subagent:
   - Input: requirements.md, implementation artifacts
   - Output: test strategy document
   - Define: unit test coverage targets (>80%), integration test scenarios, E2E test flows
   - Prioritize test paths by risk/value
   - Identify performance/load test requirements

2. **Integration/E2E tests**: Dispatch 18-Test Implementation as subagent (worktree):
   - Input: test strategy, API contracts, implementation code
   - Output: integration tests, E2E tests (Cypress, Playwright, etc.)
   - Test data setup (fixtures, factories)
   - Test coverage: happy path, error paths, edge cases
   - TDD approach: data-driven tests from requirements

3. **Code review**: Dispatch 19-Code Review as subagent:
   - Input: implementation code from Phase 4
   - Output: code review report with findings categorized:
     - [CRITICAL] — blocks release
     - [IMPORTANT] — should fix before release
     - [SUGGESTION] — nice-to-have improvements
   - Check: Clean Architecture compliance, security gate compliance, test coverage
   - Require rework for CRITICAL issues

4. **SAST scan**: Dispatch 20-SAST as subagent:
   - Input: complete source code
   - Output: SAST findings (OWASP Top 10, CVE checks, secrets scanning)
   - Suppress false positives with justification
   - Prioritize findings by severity
   - Generate remediation plan for non-critical findings

5. **Rework backlog**: 28-Backlog Manager:
   - Create issues for all CRITICAL code review findings
   - Create issues for CRITICAL/HIGH SAST findings
   - Track resolution, gate on completion

## Artifacts

- Test strategy document
- Test execution results (unit + integration + E2E)
- Code coverage report (target >80%)
- Code review report
- SAST scan results + remediation plan
- Rework task list

## Gate Criteria

- [ ] All Phase 4 unit tests still passing (>80% coverage)
- [ ] Integration tests pass (happy path + error scenarios)
- [ ] E2E tests pass for critical user flows
- [ ] Code review complete (no outstanding CRITICAL issues)
- [ ] SAST scan complete (no CRITICAL findings unaddressed)
- [ ] Coverage report reviewed and approved
- [ ] Rework issues resolved or scheduled for backlog
- [ ] All tests documented and repeatable

## Context Strategy

- Test Architect gets: requirements.md, implementation file list, coverage goals
- Test Implementation gets: test strategy, API contracts, relevant source files (NOT full codebase)
- Code Review gets: diff/changed files only, architecture spec for compliance checking
- SAST agent gets: full source paths but processes files incrementally, not all at once
- Keep review findings in structured format (not prose) to minimize context consumption

## Token Budget

Estimated: 25-40K tokens

## Memory

After phase completion, graduate learnings:
- Test patterns discovered (mocking, fixtures, data setup) → persistent memory
- Coverage gaps and patterns → persistent memory
- Code review patterns and common issues → persistent memory
- SAST false positive patterns → SAST suppression rules
- Testing tools and library insights → evaluations.md
- Performance bottlenecks identified → persistent memory for optimization phase

## Reassessment

After gate approval:
1. Review remaining Operations phase scope
2. Identify documentation gaps based on QA findings
3. Flag performance issues for Operations phase attention
4. Update PROJECT-STATE.md with QA outcomes and coverage metrics
