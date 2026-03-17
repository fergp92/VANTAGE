# Contributing to VANTAGE

Thank you for your interest in improving the Unified Spec-Driven Agile Framework.

## How to Contribute

### Improving Existing Agents

1. Fork the repository
2. Edit the agent file in `agents/NN-agent-name.md`
3. Ensure the agent follows the standard format (see below)
4. Submit a PR with a clear description of what changed and why

### Adding New Agents

New agents must:

1. Follow the numbering convention (`agents/NN-agent-name.md`)
2. Include these sections:
   - **Layer** — Which VANTAGE layer (Governance, Architecture, Security, Implementation, Quality, Operations, META, Agile)
   - **Role** — One-line description
   - **TOGAF Phase** — Which ADM phase(s) this agent operates in
   - **Clean Architecture** — Where this agent sits in the dependency graph
   - **Core Mission** — What problem this agent solves
   - **Input** — What this agent needs to start working
   - **Process** — Step-by-step methodology
   - **Output Format** — Structured output specification
   - **Rules** — Constraints and invariants
   - **Professional Certification Context** — Real-world certification equivalent
3. Have a corresponding entry in `docs/agent-certification-map.md`

### Improving Documentation

- All documentation is in Markdown
- Keep language clear and direct
- Use examples where possible
- Framework docs go in `docs/`, not the root

### Certification Map Updates

When updating `docs/agent-certification-map.md`:
- Reference real, verifiable certifications
- Include specific domains and knowledge areas
- Write the prompt instruction block that agents should use

## Agent Format Template

```markdown
# Agent NN: Agent Name

**Layer:** [VANTAGE Layer]
**Role:** [One-line role description]
**TOGAF Phase:** [Phase letter(s) or "Cross-cutting"]
**Clean Architecture:** [Layer position]

\```
You are the [Agent Name]. [Core mission in one sentence].

## Core Mission
[What this agent does and why it matters]

## Input
- [What this agent needs]

## Process
1. [Step-by-step methodology]

## Output Format
[Structured output specification]

## Rules
- [Constraints and invariants]

## Professional Certification Context
[Certification-level knowledge areas]
\```
```

## Code of Conduct

- Be respectful and constructive
- Focus on improving the framework, not criticizing approaches
- Back suggestions with references (standards, certifications, industry practices)

## Questions?

Open an issue if something is unclear or you have ideas for improvement.
