# Graft

**A portable, deterministic, verifiable capability that attaches to an application which
does not have it — and does not know it exists.**

Traditional apps have a closed feature surface. The AI can compute the answer, but there
is no socket to plug it into. Graft is that socket, plus the format for what goes in it.

The model is the Excel macro: the AI is a **compiler at design time**, not an interpreter
at runtime. You state the intent once, you get back a deterministic artifact, and the
artifact runs forever — offline, free and auditable.

## Vocabulary

| Term | Meaning |
|------|---------|
| **Graft** | The unit. A packaged capability. |
| **Rootstock** | The host application it attaches to. |
| **Rootstock runtime** | The software that loads and sandboxes Grafts. |
| **Orchard** | A registry that distributes Grafts. |
| **Quarantine** | The verification pipeline before publication. |

The metaphor is horticultural and load-bearing: you graft living tissue onto a plant that
stays itself, the graft keeps its own genetics, and it only takes if there is a compatible
interface. That interface is the extension ladder.

## Documents

| Document | Status |
|----------|--------|
| [`GRAFT-FORMAT.md`](./GRAFT-FORMAT.md) — package format, manifest, trust model | v0.1 draft |
| Rootstock runtime spec | not started |
| Orchard registry spec | not started |

## Why the format comes first

Whoever defines the format defines the category. The runtime and the registry are
implementations; the format is the asset.

Build order:

1. **Freeze the format** (this directory).
2. **Three reference Grafts** at different rungs of the ladder — one level 0, one level 2
   (MCP over a documented CLI), one level 4 (a mask over a web app). If the format holds
   for those three, it holds.
3. **Then** the universal host.

## Where this goes wrong

Stated up front so it stays visible:

- **Terms of service.** Level 4–6 Grafts can violate host ToS. Registry policy is required
  from day one, not later.
- **Supply chain.** AI-authored code, shared between strangers, running in people's
  browsers. The sandbox and the contract model are load-bearing; treating them as phase 2
  ends the project at the first incident.
- **The real competitor is MCP plus the vendors themselves.** Graft wins precisely where a
  vendor will never go: the long tail of knobs that never close a business case. That has
  to be the explicit position, not an accident.
