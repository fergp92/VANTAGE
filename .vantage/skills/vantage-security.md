---
name: vantage-security
description: "VANTAGE Phase 3: Security — STRIDE threat model, controls matrix, security requirements"
---

# VANTAGE Security Phase

## Agents

Activate these agents for this phase:
- **08-Security Architect** (main context, VETO POWER): STRIDE threat modeling and gate approval
- **09-IAM** (subagent): Authentication/authorization requirements
- **10-Secrets Crypto** (subagent): Encryption, secrets management, key rotation
- **11-Threat Intelligence** (subagent): Red team scenarios, abuse cases, OWASP mapping
- **28-Backlog Manager** (main context): Break down security tasks into Phase 4

## Process

1. **STRIDE threat model**: Dispatch 08-Security Architect as subagent:
   - Input: C4 diagrams, ERD, API contracts from Phase 2
   - Output: STRIDE threat model (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
   - Identify threats per data flow and trust boundary
   - Prioritize by risk (probability × impact)

2. **AuthN/AuthZ requirements**: Dispatch 09-IAM as subagent:
   - Input: API contracts, user stories from requirements
   - Output: authentication/authorization specification
   - Identify roles, permissions, delegation patterns
   - Map to OAuth 2.1, OIDC, SAML as appropriate

3. **Secrets and encryption**: Dispatch 10-Secrets Crypto as subagent:
   - Input: threat model, data classification
   - Output: encryption, secrets management, and key rotation strategy
   - Identify sensitive data (PII, credentials, tokens)
   - Specify encryption in-transit and at-rest

4. **Red team / abuse cases**: Dispatch 11-Threat Intelligence as subagent:
   - Input: threat model, OWASP Top 10, abuse case framework
   - Output: abuse case scenarios, red team assumptions, injection/bypass scenarios
   - Map findings back to threat model

5. **Gate decision**: 08-Security Architect consolidates all inputs and makes FINAL gate decision:
   - APPROVE: Security stance acceptable, proceed to Phase 4
   - VETO: Critical issues found, backlog security tasks to Phase 4 (blocks other phases until veto lifted)

6. **Update backlog**: 28-Backlog Manager incorporates security tasks into Phase 4

## Artifacts

- STRIDE threat model (per data flow, per trust boundary)
- Threat prioritization matrix (risk = probability × impact)
- Authentication/Authorization specification
- Secrets and encryption strategy
- Red team / abuse case scenarios
- Security requirements checklist
- Security-focused backlog tasks

## Gate Criteria

- [ ] STRIDE threat model complete (all data flows analyzed)
- [ ] All identified threats mapped to mitigation strategies
- [ ] Authentication/Authorization spec approved by Agent 09
- [ ] Encryption and secrets management strategy defined
- [ ] Red team scenarios documented and reviewed
- [ ] Security Architect (Agent 08) approval obtained (CRITICAL GATE)
- [ ] **VETO CHECK**: If Security Architect flags critical issues:
  - [ ] Critical issues backlogged as Phase 4 blocker tasks
  - [ ] Veto lifted only after issues resolved
  - [ ] All other phases held until veto cleared

## Context Strategy

- Security Architect stays in main context (needs full situational awareness)
- IAM, Secrets/Crypto, and Threat Intelligence run as parallel subagents with fresh sessions
- Each security subagent receives: agent prompt, memory, threat model scope, and relevant architecture artifacts only
- Consolidation happens in main context where Security Architect has full visibility
- Gate decision made with all security artifacts visible but without subagent conversation history

## Token Budget

Estimated: 15-25K tokens

## Memory

After phase completion, graduate learnings:
- Identified threat patterns → persistent memory
- Mitigation strategies → persistent memory
- Security control choices → persistent memory
- AuthN/AuthZ patterns → persistent memory
- Encryption decisions → persistent memory
- Red team assumptions → persistent memory for future phases

## Reassessment

After gate approval (CRITICAL — security findings often change the implementation plan):
1. Orchestrator + Product Owner + Security Architect review remaining phases
2. Re-prioritize backlog: security-critical items move to top of Phase 4
3. Add security-specific implementation tasks (encryption, auth, audit trail)
4. Reassess token budget: security remediation may increase Phase 4 cost
5. If veto was issued and lifted, document remediation in DECISIONS.md
6. Update PROJECT-STATE.md with revised plan and security status
