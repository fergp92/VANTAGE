# Graft Format Specification

**Version:** 0.1 (draft)
**Status:** Design draft — not yet implemented
**Date:** 2026-08-21

> A **Graft** is a portable, deterministic, verifiable capability that attaches to a host
> application which does not have it — and does not know it exists.

---

## 0. Scope and Motivation

Traditional applications expose a **closed feature surface**. A password manager offers
length, digits and symbols; it will never offer "optimised for typing with a TV remote",
because nobody anticipated that knob and the space of useful knobs is unbounded.

The intuition this format encodes is the **Excel macro**: you do not ask the AI on every
recalculation. You ask once, it writes the macro, and the macro then runs forever —
offline, deterministic, free and auditable.

Graft generalises that. The AI operates at **design time as a compiler**, never at runtime
as an interpreter:

```
intent (natural language, once)
  → deterministic artifact (core + contract)
  → attached at an existing extension point
  → host application unchanged
```

This specification defines the package format, the manifest, the trust model and the
verification pipeline. It does **not** define the runtime implementation (`Rootstock`) or
the registry implementation (`Orchard`); those are separate documents.

### 0.1 Requirements language

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, MAY and OPTIONAL are to be
interpreted as described in RFC 2119.

---

## 1. Terminology

| Term | Definition |
|------|------------|
| **Graft** | The packaged unit defined by this spec. |
| **Rootstock** | The host application the Graft attaches to (e.g. Proton Pass, Jira, Excel). |
| **Rootstock runtime** | The software that loads, sandboxes and executes Grafts. |
| **Orchard** | A registry that distributes Grafts (public or private). |
| **Quarantine** | The verification pipeline a Graft passes before publication. |
| **Intent** | The natural-language statement of purpose. Normatively, the *source*. |
| **Core** | The deterministic executable implementing the capability. |
| **Surface** | The typed input/output contract of the core. |
| **Contract** | Machine-checkable claims about the core's behaviour. |
| **Attachment** | A binding that delivers the core into a specific host at a specific level. |

---

## 2. Core Design Principles

These four principles are normative. A format change that violates one is a different
format, not a new version of this one.

### 2.1 Intent is the source; code is the compiled output

A Graft MUST carry the intent that produced it. The core is *derivable* from the intent
plus the surface and contract. This is the property that separates a Graft from a script
in a gist, and it yields three capabilities:

- **Retargeting** — the same intent recompiled for a different host.
- **Self-healing** — when a host changes and an attachment breaks, the Graft is
  regenerated from intent rather than patched by hand (§10).
- **Intent-level forking** — "the same, but for a PlayStation keyboard" is a one-line diff
  against the intent, not a code fork.

### 2.2 Core and attachment are separate

The logic is independent of the delivery mechanism. One core MUST be bindable to N
attachments (clipboard, MCP tool, injected UI, CLI). This is what lets a single Graft
serve several rootstocks without being rewritten.

### 2.3 The contract is the trust layer

Grafts are AI-authored and shared between strangers. Trust is therefore *the* product
problem, not a later concern. Every Graft MUST ship executable claims about its own
behaviour, which the Orchard verifies in a sandbox before publication (§9).

### 2.4 Deny by default

A Graft MUST declare every capability it needs. The runtime MUST deny anything not
declared. Most Grafts are pure or seeded functions and need nothing, which makes them
safe by construction — the exception should be loud, not silent.

---

## 3. The Extension Ladder

Every Graft MUST declare the level at which it attaches to each host. The level determines
fragility, permission requirements and Terms-of-Service exposure.

| Level | Mechanism | Requires from host | Fragility | ToS risk |
|-------|-----------|--------------------|-----------|----------|
| **0** | Out-of-band — user carries the result in (clipboard, manual paste) | nothing | none | none |
| **1** | Config-level — the host already has the knob; the Graft chooses values | nothing | none | none |
| **2** | Documented API / CLI, typically surfaced as an MCP tool | public API | low | low |
| **3** | Official plugin SDK | plugin SDK | low | low |
| **4** | **Mask** — injected UI over a web host (userscript / extension) | web UI | high | **review required** |
| **5** | Fork or repackaging of an open-source client | OSS licence | high | licence-dependent |
| **6** | GUI automation (accessibility APIs, computer use) | nothing | very high | **review required** |

Levels 4 and 6 MUST set `tos_risk` and MUST pass human review in Quarantine.
Level 5 MUST declare the upstream licence and its compatibility.

---

## 4. Package Layout

A Graft is a directory (distributed as a signed tarball, content-addressed):

```
tv-friendly-password/
├── graft.yml              # manifest — REQUIRED
├── intent.md              # long-form intent and rationale — REQUIRED
├── core/
│   └── core.wasm          # or core.js — REQUIRED
├── contract/
│   └── properties.js      # executable property checks — REQUIRED
├── attachments/
│   ├── mcp.yml
│   ├── userscript.js
│   └── cli.yml
├── LICENSE                # REQUIRED
└── README.md              # OPTIONAL, human-facing
```

`graft.yml` is the only file whose name and location are fixed. All other paths are
referenced from the manifest.

---

## 5. Manifest — `graft.yml`

### 5.1 Complete field reference

| Field | Type | Req. | Notes |
|-------|------|------|-------|
| `graft` | string | ✅ | Format version. `"0.1"` for this spec. |
| `id` | slug | ✅ | `[a-z0-9-]{3,64}`. Registry scope is applied at publish time. |
| `version` | semver | ✅ | See §8. |
| `title` | string | ✅ | ≤ 80 chars. |
| `description` | string | ✅ | ≤ 200 chars. |
| `license` | SPDX id | ✅ | |
| `authors` | list | ✅ | `{ name, contact? }` |
| `intent` | object | ✅ | §5.2 |
| `hosts` | list | ✅ | §5.3 |
| `surface` | object | ✅ | §5.4 |
| `core` | object | ✅ | §5.5 |
| `contract` | object | ✅ | §5.6 |
| `attachments` | list | ✅ | §5.7 — MUST contain ≥ 1 |
| `regeneration` | object | ➖ | §10 |
| `provenance` | object | ✅ | §5.8 |

### 5.2 `intent`

```yaml
intent:
  statement: >
    One paragraph, in the user's own terms, stating what the capability does
    and why the host cannot do it.
  constraints:
    - Hard requirements the implementation must respect.
  non_goals:
    - Explicit exclusions. Prevents scope drift on regeneration.
  source: intent.md
```

`statement` MUST be non-empty and MUST be written as a *goal*, not as an implementation.
`non_goals` is strongly RECOMMENDED: it is the primary guard against a regenerated core
silently widening behaviour.

### 5.3 `hosts`

```yaml
hosts:
  - id: proton-pass
    level: 0
  - id: bitwarden
    level: 2
    min_version: "2024.6"
  - id: standalone
    level: 0
```

`standalone` is a reserved host id meaning "no host; runs on its own".

For level ≥ 4 a `fingerprint` block is REQUIRED, so breakage is *detectable* rather than
silent:

```yaml
  - id: proton-pass-web
    level: 4
    tos_risk: review-required
    fingerprint:
      anchors: ["[data-testid='password-generator']"]
      structure_hash: "sha256:…"
```

### 5.4 `surface`

The typed I/O contract of the core, expressed as JSON Schema (inline or `$ref`).
The surface is the **compatibility boundary**: §8 versioning rules are defined over it.

```yaml
surface:
  input:
    type: object
    properties:
      layout: { enum: [netflix-grid, playstation, google-tv, apple-tv-linear] }
      bits:   { type: integer, minimum: 40, maximum: 256, default: 72 }
    required: [layout]
  output:
    type: object
    properties:
      password:      { type: string }
      entropy_bits:  { type: number }
      keystrokes:    { type: integer }
    required: [password, entropy_bits]
```

### 5.5 `core`

```yaml
core:
  runtime: wasm            # wasm | js | cli
  entry: core/core.wasm
  determinism: seeded      # §5.5.1
  permissions: [entropy]   # §5.5.2
  limits:
    memory_mb: 16
    timeout_ms: 500
```

#### 5.5.1 Determinism classes

| Class | Meaning |
|-------|---------|
| `pure` | Same input → same output. No state, no entropy, no clock. |
| `seeded` | Deterministic given an explicit seed. When no seed is supplied the runtime MUST provide a CSPRNG; the core MUST NOT implement its own generator. |
| `stateful` | Requires persistent storage. MUST declare an `fs:` or `store:` permission. |
| `effectful` | Performs external side effects. MUST declare them. |

A Graft that generates secrets MUST be `seeded`, never `pure`, and MUST NOT be
`effectful`. Note this makes the security claim explicit and checkable: *the model
designed the algorithm; the CSPRNG produces the value*. A core MUST NOT embed an LLM call.

#### 5.5.2 Permission vocabulary

Deny by default. Declared as a flat list:

```
entropy                 CSPRNG access
clipboard:write
net:<hostname>          exact host, no wildcards at v0.1
fs:read:<path>
fs:write:<path>
store:<namespace>       runtime-managed key/value
dom:<origin>            level ≥4 only
host-api:<name>         level 2/3 only
```

A core with `permissions: []` and `determinism: pure` is a **pure Graft** and MAY be
executed by the runtime without user prompt.

### 5.6 `contract`

Three clause kinds, distinguished by how they are verified. The distinction is normative,
because pretending that everything is machine-checkable is how trust systems fail.

| Kind | Verified by | Example |
|------|-------------|---------|
| `static` | inspection, without executing | declared permissions match wasm imports; no dynamic code evaluation |
| `property` | randomised execution, N ≥ 1000 runs | `entropy_bits >= input.bits - 6` |
| `attested` | **human review only** | "the layout cost model reflects the real Netflix keyboard" |

```yaml
contract:
  properties: contract/properties.js
  static:
    - no_dynamic_eval
    - imports_subset_of_permissions
  attested:
    - text: Layout cost models were derived from the real on-screen keyboards.
      reviewer_required: true
```

```js
// contract/properties.js
export const properties = [
  {
    id: 'entropy-floor',
    forAll: 'input',
    assert: (input, output) => output.entropy_bits >= input.bits - 6,
    rationale: 'Selecting the cheapest of 64 uniform candidates costs at most 6 bits.',
  },
  {
    id: 'charset-typeable',
    forAll: 'input',
    assert: (_, output) => /^[a-z0-9]+$/.test(output.password)
                        && !/[lo01]/.test(output.password),
  },
  {
    id: 'seed-determinism',
    forAll: 'input+seed',
    assert: (a, b) => a.password === b.password,
  },
]
```

Every `property` clause MUST carry a `rationale`. It is the human-readable justification
that survives regeneration.

### 5.7 `attachments`

```yaml
attachments:
  - type: clipboard
    level: 0
  - type: mcp-tool
    level: 2
    tool_name: generate_tv_password
  - type: userscript
    level: 4
    entry: attachments/userscript.js
    matches: ["https://pass.proton.me/*"]
  - type: cli
    level: 0
    command: tv-password
```

An attachment MUST NOT contain capability logic. It is a binding only: marshal input,
call the core, deliver output. Quarantine SHOULD reject attachments whose complexity
suggests logic has leaked out of the core, because such logic escapes the contract.

### 5.8 `provenance`

```yaml
provenance:
  authored_by: "fergp92"
  generated_at: "2026-08-21T00:00:00Z"
  intent_hash: "sha256:…"     # over intent.statement + constraints + non_goals
  surface_hash: "sha256:…"
  core_hash: "sha256:…"
  signatures:
    - key_id: "…"
      sig: "…"
```

`intent_hash` is what regeneration pins against (§10). The authoring toolchain MAY be
recorded, but a Graft MUST be judged by its contract, not by what wrote it.

---

## 6. Execution Model

1. The runtime resolves the Graft and verifies signature and hashes.
2. It instantiates the core in a sandbox with **only** the declared permissions.
3. Input is validated against `surface.input`; invalid input is rejected before entry.
4. The core runs under the declared `limits`.
5. Output is validated against `surface.output`; a violation is a runtime error, never a
   passthrough.
6. Contract `property` clauses MAY be spot-checked in production; on failure the runtime
   MUST disable the Graft and MAY trigger regeneration (§10).

The runtime MUST NOT grant a core network access on the basis of an attachment's
permissions, or vice versa. The two are sandboxed independently.

---

## 7. Trust Model

| Actor | Trusted for |
|-------|-------------|
| Author | nothing, by default |
| Orchard | verifying static + property clauses; surfacing attested ones unverified |
| Runtime | enforcing sandbox and permissions |
| User | approving non-pure permissions and attested clauses |

Registry badges, which MUST be displayed:

- **contract-verified** — all static and property clauses passed in Quarantine.
- **attested-only** — carries clauses that could not be machine-verified.
- **review-required** — level ≥ 4, or ToS-sensitive.
- **unverified** — failed or skipped Quarantine. MUST be visually distinct and MUST NOT be
  installable without explicit confirmation.

---

## 8. Versioning and Compatibility

Semver, defined **over the surface and the intent** rather than over the code:

| Change | Bump |
|--------|------|
| Breaking `surface` change | MAJOR |
| Change to `intent.statement` or `constraints` beyond editorial | **MAJOR** |
| New optional surface field, or new attachment | MINOR |
| Core reimplemented, surface + contract unchanged | PATCH |
| Contract clause **added** | MINOR |
| Contract clause **removed or weakened** | MAJOR |

The rule that intent changes are breaking is deliberate. Intent is the source: silently
editing it would make every downstream regeneration produce something the consumer never
agreed to.

---

## 9. Quarantine — the verification pipeline

An Orchard MUST run these stages, in order, and MUST refuse publication on any failure:

1. **Manifest validation** — schema, required fields, semver, SPDX licence.
2. **Static analysis** — wasm/js imports are a subset of declared permissions; no dynamic
   code evaluation; attachments contain no capability logic.
3. **Sandboxed property run** — N ≥ 1000 generated inputs against `surface.input`, under
   the declared limits. All `property` clauses MUST hold.
4. **Determinism check** — the class declared in §5.5.1 is exercised and confirmed
   (`pure` and `seeded` are both mechanically testable).
5. **Policy review** — level ≥ 4/6, ToS risk, licence compatibility for level 5. Human.
6. **Sign and publish** — content-addressed, signed, immutable.

Stages 1–4 MUST be automated. Stage 5 MUST NOT be automated at v0.1.

---

## 10. Regeneration (self-healing)

The property that makes masks viable at scale.

```yaml
regeneration:
  policy: on-contract-failure      # on-contract-failure | on-host-change | manual
  gate: human                      # human | auto-if-contract-passes
  pin: "sha256:…"                  # intent_hash this Graft may regenerate from
```

Normative rules:

1. Regeneration MUST use the pinned `intent_hash`. If the intent has changed, this is a
   new version requiring the human gate at §5.2, not a regeneration.
2. A regenerated core MUST re-pass the **full** contract before activation. No exceptions,
   no partial activation.
3. Regeneration MUST NOT alter `surface`, `intent` or `permissions`. If a fix requires
   any of those, it is a MAJOR version and a human decision.
4. `gate: auto-if-contract-passes` MAY be used only for cores whose determinism class is
   `pure` or `seeded` and whose permissions are empty or `[entropy]`.
5. The runtime MUST record every regeneration in provenance, retaining the superseded
   `core_hash`.

Rule 3 is what keeps self-healing from becoming self-mutating.

---

## 11. Worked Example

The reference Graft for the format. Level 0, seeded, one permission.

```yaml
graft: "0.1"
id: tv-friendly-password
version: 1.0.0
title: TV-friendly password generator
description: Strong passwords optimised for entry with a D-pad on a television.
license: MIT
authors: [{ name: fergp92 }]

intent:
  statement: >
    Generate strong passwords that are cheap to type on a television on-screen
    keyboard using a D-pad, and unambiguous to transcribe by eye from a phone.
    Password managers only expose length and character-class toggles, which is
    the wrong cost model for this situation.
  constraints:
    - No uppercase — the shift toggle is a separate trip on the grid.
    - No symbols — they live on a separate keyboard page.
    - Exclude visually ambiguous characters (l, o, 0, 1).
    - Entropy loss from layout optimisation must be bounded and reported.
  non_goals:
    - Human memorability. The vault remembers; the human does not.
    - Site-specific composition policies. Handled by the caller.
  source: intent.md

hosts:
  - { id: standalone,  level: 0 }
  - { id: proton-pass, level: 0 }
  - { id: bitwarden,   level: 2 }

surface:
  input:
    type: object
    properties:
      layout: { enum: [netflix-grid, playstation, google-tv, apple-tv-linear] }
      bits:   { type: integer, minimum: 40, maximum: 256, default: 72 }
      seed:   { type: string }
    required: [layout]
  output:
    type: object
    properties:
      password:     { type: string }
      entropy_bits: { type: number }
      keystrokes:   { type: integer }
    required: [password, entropy_bits, keystrokes]

core:
  runtime: wasm
  entry: core/core.wasm
  determinism: seeded
  permissions: [entropy]
  limits: { memory_mb: 8, timeout_ms: 200 }

contract:
  properties: contract/properties.js
  static: [no_dynamic_eval, imports_subset_of_permissions, no_network]
  attested:
    - text: Layout cost models match the real on-screen keyboards as of 2026-08.
      reviewer_required: true

attachments:
  - { type: clipboard, level: 0 }
  - { type: cli,       level: 0, command: tv-password }
  - { type: mcp-tool,  level: 2, tool_name: generate_tv_password }

regeneration:
  policy: on-contract-failure
  gate: auto-if-contract-passes

provenance:
  authored_by: fergp92
  generated_at: "2026-08-21T00:00:00Z"
  intent_hash:  "sha256:PLACEHOLDER"
  surface_hash: "sha256:PLACEHOLDER"
  core_hash:    "sha256:PLACEHOLDER"
```

**Why the algorithm is sound**, as a demonstration that the contract carries real claims:
the core samples candidates *uniformly* from the fixed alphabet at fixed length using the
runtime CSPRNG, then selects the lowest D-pad travel cost among 64 candidates. Selecting a
minimum from 64 costs **at most 6 bits** of entropy — a bounded, provable loss — in
exchange for roughly 30–40% fewer keypresses. That bound is the `entropy-floor` property,
and Quarantine checks it by execution rather than trusting the description.

---

## 12. Relationship to VANTAGE

The authoring pipeline is the framework already in this repository:

| Graft stage | VANTAGE phase |
|-------------|---------------|
| Intent capture | Phase 0 — Kickoff / Discovery |
| Host probe and level classification | Phase 1 — Requirements |
| Surface + contract synthesis | Phase 2 — Specification **← human gate** |
| Permission and ToS review | Phase 3 — Security (Agent 08 veto) |
| Core synthesis | Phase 4 — Implementation |
| Quarantine | Phase 5 — QA |
| Publication to an Orchard | Phase 6 — Operations |

The central VANTAGE invariant — *no code until specs are approved* — is exactly the Graft
gate: the human approves the **surface and contract**, and the core follows as a
consequence. The two-tier toolkit model (general + specialised) is the same shape as
core + attachment.

---

## 13. Open Questions for v0.2

1. **Composition** — may a Graft invoke another Graft? Contract implications of chaining.
2. **Stateful Grafts** — storage model, migration, sync across devices.
3. **Private Orchards** — authentication, org policy, allow-lists. The enterprise path.
4. **Licence enforcement** — paid Grafts without breaking content-addressing.
5. **Attachment conflicts** — two Grafts masking the same DOM anchor.
6. **Intent i18n** — intent authored in Spanish, core generated from an English translation:
   which text does `intent_hash` cover?
7. **Fingerprint drift** — how much host change is "broken" versus "cosmetic"?

---

## Changelog

- **0.1** (2026-08-21) — Initial draft. Package layout, manifest, extension ladder,
  determinism classes, permission vocabulary, three-kind contract model, Quarantine
  pipeline, regeneration semantics.
