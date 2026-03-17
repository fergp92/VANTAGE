---
name: vantage-operations
description: "VANTAGE Phase 6: Operations — CI/CD, observability, documentation, deployment"
---

# VANTAGE Operations Phase

## Agents

Activate these agents for this phase:
- **21-CI/CD** (subagent): Pipeline design, Docker containerization
- **22-Observability** (subagent): Logging, metrics, alerting, health checks
- **23-Documentation** (subagent): README, API docs, runbooks, deployment guide
- **28-Backlog Manager** (main context): Task tracking and completion gates

## Process

1. **CI/CD pipeline**: Dispatch 21-CI/CD as subagent:
   - Input: implementation code, test suite, security scan procedures
   - Output: CI/CD pipeline configuration (GitHub Actions / GitLab CI)
   - Define stages: lint → build → test → security scan → deploy
   - Create Docker image(s) and docker-compose.yml if needed
   - Implement: automated testing on PR, build artifacts, registry push
   - Smoke test on staging/production

2. **Observability setup**: Dispatch 22-Observability as subagent:
   - Input: implementation code, architecture (C4 containers)
   - Output: observability configuration
   - Define: log aggregation (ELK, CloudWatch, etc.), metrics (Prometheus, StatsD), tracing (Jaeger, DataDog)
   - Implement health check endpoints
   - Alert rules for critical thresholds
   - Dashboards (Grafana or equivalent)

3. **Documentation**: Dispatch 23-Documentation as subagent:
   - Input: all implementation artifacts, API contracts, architecture specs
   - Output: complete documentation suite:
     - README.md (setup, quickstart, architecture overview)
     - API documentation (OpenAPI rendered, examples)
     - Deployment guide (prerequisites, steps, troubleshooting)
     - Runbook (operations, scaling, backup/recovery)
     - Contributing guide (development workflow)
     - Architecture decision log (reference ADRs from Phase 2)

4. **Deployment readiness**: 21-CI/CD validates:
   - Build passes all stages
   - Smoke tests pass on staging
   - Docker image builds and runs correctly
   - Secrets handled via environment variables or vault (NO hardcoded secrets)

5. **Backlog completion**: 28-Backlog Manager:
   - Confirm all artifacts produced
   - Mark Phase 6 complete
   - Initialize Phase 7 (optimization/hardening) backlog if applicable

## Git Strategy

### Release Process
1. Create release branch from main: `release/vN.N.N`
2. Run full CI/CD pipeline on release branch
3. Tag release: `vN.N.N`
4. Generate changelog from conventional commits
5. Deploy from tagged release

## Artifacts

- Dockerfile(s) / docker-compose.yml
- CI/CD pipeline configuration (.github/workflows/*.yml or .gitlab-ci.yml)
- Logging, metrics, and alerting configuration
- Health check implementation
- README.md
- API documentation (OpenAPI rendered)
- Deployment guide
- Operations runbook
- Contributing guide

## Gate Criteria

- [ ] CI/CD pipeline builds and passes all stages
- [ ] Docker image builds and runs successfully
- [ ] Smoke tests pass on staging environment
- [ ] Secrets are NOT hardcoded; all stored in env/vault
- [ ] Logging configured and verified
- [ ] Metrics/alerting configured and verified
- [ ] README complete with setup and quickstart
- [ ] API documentation complete and current
- [ ] Deployment guide tested and verified
- [ ] Runbook covers common operational tasks
- [ ] Contributing guide clear for new developers

## Context Strategy

- CI/CD agent gets: implementation structure, test commands, Docker requirements
- Observability agent gets: architecture diagram, API endpoints, SLA requirements
- Documentation agent gets: all finalized artifacts but processes them one doc at a time
- Each operations subagent works independently in a fresh session
- Final artifacts are file-based (committed to repo), not held in context

## Token Budget

Estimated: 15-30K tokens

## Memory

After phase completion, graduate learnings:
- Docker image optimization patterns → persistent memory
- CI/CD pipeline patterns → persistent memory
- Observability tool configurations → persistent memory
- Logging/metric key patterns → persistent memory
- Documentation structure and templates → persistent memory
- Deployment procedures and gotchas → persistent memory
- Runbook common tasks → persistent memory for future projects

## Reassessment

After gate approval:
1. Review Governance phase readiness
2. Compile full project metrics for Architecture Board review
3. Identify operational risks for monitoring
4. Final PROJECT-STATE.md update before governance review
