# VANTAGE Handoff Schemas

JSON Schema definitions (draft-07) for inter-agent handoff artifacts in the VANTAGE multi-agent framework. These schemas define the structure of data passed between agents as work flows through the 8 development phases.

## Schema Overview

| Schema | Phase | Producer(s) | Consumer(s) | Purpose |
|--------|-------|-------------|-------------|---------|
| `base-handoff.schema.json` | All | All agents | All agents | Envelope wrapping every artifact with trace ID, source/target agents, phase, and metadata |
| `requirements.schema.json` | 1 - Discovery | 02-requirements-architect | 04-07 (Architecture agents) | Functional, non-functional, and compliance requirements |
| `architecture.schema.json` | 2 - Architecture | 04-07 (Architecture agents) | 08 (Security), 12-16 (Implementation) | System context, containers, domain model, API contracts, data classification |
| `security-review.schema.json` | 3 - Security | 08-security-architect | 12-16 (Implementation) | Threat model, controls matrix, IAM design, crypto standards, approval/veto |
| `implementation.schema.json` | 4 - Implementation | 12-16 (Implementation agents) | 17-20 (QA agents) | Clean Architecture layer manifests and file inventory |
| `qa-report.schema.json` | 5 - QA | 17-20 (QA agents) | 21-23 (Operations agents) | Test coverage, findings, code review, SAST results |
| `operations.schema.json` | 6 - Operations | 21-23 (Operations agents) | 00 (Orchestrator) | CI/CD pipeline, Docker config, observability, documentation |

## How Agents Use These Schemas

### Producing an Artifact

Every handoff artifact is wrapped in the `base-handoff` envelope. The `content` field contains the phase-specific payload:

```json
{
  "schema_version": "1.0.0",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "source_agent": "08-security-architect",
  "target_agent": "12-domain-architect",
  "phase": "security",
  "timestamp": "2026-03-17T14:30:00Z",
  "artifact_type": "security-review",
  "content": { ... },
  "confidence": 0.95,
  "risks": ["Third-party OAuth provider has no SLA for uptime"]
}
```

### Consuming an Artifact

Downstream agents validate incoming artifacts against the relevant schema before acting on them. If validation fails, the agent should reject the handoff and request a corrected artifact from the source agent.

### Security Veto

The `security-review` schema includes an `approved` boolean. Per VANTAGE invariant, if Agent 08 sets `approved: false`, implementation **must not proceed**. The `veto_reasons` array documents why.

## Validation

These schemas can be validated with any JSON Schema draft-07 compatible validator. Example using `ajv`:

```bash
npx ajv validate -s schemas/base-handoff.schema.json -d artifact.json
```

## ID Conventions

| Artifact | Pattern | Example |
|----------|---------|---------|
| Functional requirement | `FR-NNN` | `FR-001` |
| Non-functional requirement | `NFR-NNN` | `NFR-001` |
| Compliance requirement | `CR-NNN` | `CR-001` |
| Threat | `THREAT-NNN` | `THREAT-001` |
| QA finding | `QA-NNN` | `QA-001` |
