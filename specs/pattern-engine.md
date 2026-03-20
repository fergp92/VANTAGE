# LinguaForge — Cross-Linguistic Pattern Engine

> Spec Reference: Phase 1 — Discovery & Specs
> Agent: 12-Domain Logic + 27-Spec Writer
> Status: APPROVED

## Overview

The Pattern Engine is the core differentiator of LinguaForge. It analyzes and maps structural relationships between language pairs, enabling learners to leverage their native language knowledge as a bridge to the target language.

## Research Foundation

Based on analysis of successful apps (Duolingo, Babbel, Rosetta Stone, Busuu) and cross-linguistic transfer research:

- **Positive Transfer**: L1 patterns that directly help L2 learning (e.g., Spanish SVO → English SVO)
- **Negative Transfer**: L1 patterns that interfere with L2 (e.g., Spanish adjective-after-noun → English adjective-before-noun)
- **Zero Transfer**: L2 patterns with no L1 equivalent (e.g., Mandarin tones for Spanish speakers)

## Pattern Categories

### 1. Word Order Patterns
Maps how sentence elements are arranged differently across languages.

```yaml
pattern_id: WO-ES-EN-001
category: word_order
pair: { source: es, target: en }
name: "Adjective Placement"
difficulty: 2

source_structure:
  template: "[ARTICLE] [NOUN] [ADJECTIVE]"
  example: "El gato negro"
  annotation: "In Spanish, descriptive adjectives typically follow the noun"

target_structure:
  template: "[ARTICLE] [ADJECTIVE] [NOUN]"
  example: "The black cat"
  annotation: "In English, adjectives precede the noun"

transformation_rule:
  type: "reorder"
  description: "Move adjective before the noun when translating ES→EN"
  exceptions:
    - "Quantitative adjectives (mucho, poco) already precede noun in both"
    - "Demonstratives (este, ese) precede noun in both"

common_errors:
  - "The cat black (direct transfer from Spanish order)"
  - "Forgetting that some Spanish adjectives DO precede nouns"

exercises:
  - type: word_order
    prompt: "Arrange: cat / the / big / sleeps"
    answer: "The big cat sleeps"
  - type: structure_comparison
    l1: "Una casa bonita"
    l2: "A beautiful house"
    highlight: [adjective_position]
```

### 2. Conjugation Mapping
Maps verb conjugation systems between languages.

```yaml
pattern_id: CJ-ES-EN-001
category: conjugation
pair: { source: es, target: en }
name: "Present Tense Conjugation Reduction"
difficulty: 1

source_structure:
  template: "[SUBJECT_OPTIONAL] [VERB_CONJUGATED_6_FORMS]"
  paradigm:
    yo: hablo
    tú: hablas
    él/ella: habla
    nosotros: hablamos
    vosotros: habláis
    ellos: hablan
  note: "Spanish has 6 distinct present tense forms; subject often omitted"

target_structure:
  template: "[SUBJECT_REQUIRED] [VERB_2_FORMS]"
  paradigm:
    I: speak
    you: speak
    he/she: speaks
    we: speak
    they: speak
  note: "English has only 2 forms (base + -s for 3rd singular); subject required"

transformation_rule:
  type: "simplification"
  description: "ES→EN: 6 conjugation forms collapse to 2. Subject becomes mandatory."
  key_insight: "Spanish speakers already KNOW the pattern — they just need to always include the subject and only add -s for he/she/it"

mnemonic:
  type: grammar_rhyme
  content: "He, she, it — don't forget the S-bit!"
  explanation: "Only third person singular gets -s in English present tense"
```

### 3. Cognate Networks
Maps vocabulary connections through shared etymological roots.

```yaml
pattern_id: CG-ES-EN-001
category: cognate
pair: { source: es, target: en }
name: "Latin Root Cognates (-ción → -tion)"
difficulty: 1

rule:
  source_suffix: "-ción"
  target_suffix: "-tion"
  transformation: "Replace -ción with -tion"
  reliability: 0.95  # 95% of the time this works

examples:
  - { source: "nación", target: "nation" }
  - { source: "educación", target: "education" }
  - { source: "información", target: "information" }
  - { source: "comunicación", target: "communication" }
  - { source: "revolución", target: "revolution" }

instant_vocabulary: 1200+
note: "Spanish speakers instantly gain ~1200 English words with this single pattern"

related_patterns:
  - "-dad → -ty (universidad → university)"
  - "-mente → -ly (rápidamente → rapidly)"
  - "-oso → -ous (famoso → famous)"
  - "-ble → -ble (posible → possible)"
```

### 4. False Friends Database
Critical warnings for deceptive cross-linguistic similarities.

```yaml
pattern_id: FF-ES-EN-001
category: false_friend
pair: { source: es, target: en }
name: "Embarazada ≠ Embarrassed"
difficulty: 3
danger_level: high

false_friend:
  source_word: "embarazada"
  source_meaning: "pregnant"
  lookalike: "embarrassed"
  actual_translation: "avergonzada"

mnemonic:
  type: false_friend_alert
  content: "🚫 EMBARAZADA = PREGNANT, not embarrassed! Think: 'She has a BABY in her BARAZA (belly)'"
  visual: "Picture a pregnant woman, NOT a blushing face"

common_false_friends_es_en:
  - { source: "actual", seems: "actual", means: "current" }
  - { source: "realizar", seems: "realize", means: "to carry out/accomplish" }
  - { source: "librería", seems: "library", means: "bookstore" }
  - { source: "éxito", seems: "exit", means: "success" }
  - { source: "constipado", seems: "constipated", means: "having a cold" }
  - { source: "sensible", seems: "sensible", means: "sensitive" }
  - { source: "soportar", seems: "support", means: "to tolerate/endure" }
```

### 5. Tense Mapping
How tense systems differ between languages.

```yaml
pattern_id: TM-ES-EN-001
category: tense_mapping
pair: { source: es, target: en }
name: "Ser vs Estar → Single 'To Be'"
difficulty: 4

source_structure:
  description: "Spanish has TWO 'to be' verbs with distinct uses"
  ser:
    uses: ["identity", "origin", "profession", "characteristics", "time", "material"]
    examples: ["Soy profesor", "Es de Madrid", "Son las tres"]
  estar:
    uses: ["location", "temporary state", "emotions", "progressive"]
    examples: ["Estoy en casa", "Estoy cansado", "Está lloviendo"]

target_structure:
  description: "English uses a single 'to be' for all cases"
  to_be:
    forms: ["am", "is", "are", "was", "were"]
    note: "Context determines meaning — no ser/estar distinction"

transformation_rule:
  type: "merge"
  description: "Both 'ser' and 'estar' map to 'to be' in English"
  key_insight: "For ES→EN: easier (fewer choices). For EN→ES: harder (must choose ser or estar)"
  decision_tree:
    permanent_or_inherent: "ser"
    temporary_or_changeable: "estar"
    location: "estar (almost always)"
    time_or_date: "ser"
    progressive_tense: "estar + gerund"

mnemonic:
  type: acronym
  content: |
    For ESTAR, remember: PLACE
    P - Position/Location (Estoy en el parque)
    L - Looks/Appearance that changes (Estás guapo hoy)
    A - Action in progress (Estoy comiendo)
    C - Condition/temporary state (Estoy cansado)
    E - Emotion (Estoy feliz)

    Everything else → SER
```

## Pattern Difficulty Algorithm

```
difficulty(pattern, user) =
  base_difficulty(pattern)
  × language_distance(user.L1, target.L2)
  × (1 - cognate_overlap(user.L1, target.L2))
  × (1 + error_frequency(user, pattern.category))
  ÷ (1 + transfer_bonus(user.L1, pattern))
```

| Factor | Weight | Description |
|--------|--------|-------------|
| `base_difficulty` | 1-5 | Inherent complexity of the pattern |
| `language_distance` | 0.5-2.0 | FSI difficulty scale (Spanish→Portuguese = 0.5, Spanish→Japanese = 2.0) |
| `cognate_overlap` | 0-1 | % shared vocabulary reduces difficulty |
| `error_frequency` | 0-1 | User's personal error rate on this category |
| `transfer_bonus` | 0-1 | Positive transfer from L1 knowledge |

## Pattern Teaching Sequence

```
1. INTRODUCE  → Show pattern with L1↔L2 side-by-side comparison
2. HIGHLIGHT  → Animate the structural difference (word reordering, etc.)
3. EXPLAIN    → Brief rule + mnemonic device
4. EXAMPLE    → 3 progressively harder examples
5. PRACTICE   → 5 exercises targeting the pattern
6. COMPARE    → "In your language: X. In target: Y. The difference: Z."
7. REINFORCE  → Spaced repetition cards enter review queue
```

## Supported Language Pair Matrices (v1)

### Romance Languages (High Cognate Overlap)
| L1\L2 | ES | EN | PT | FR | IT | DE |
|-------|----|----|----|----|----|----|
| ES    | —  | ✅ | ✅ | ✅ | ✅ | ✅ |
| EN    | ✅ | —  | ✅ | ✅ | ⬜ | ✅ |
| PT    | ✅ | ✅ | —  | ✅ | ✅ | ⬜ |
| FR    | ✅ | ✅ | ✅ | —  | ✅ | ✅ |

### Extended Pairs (v2)
| L1\L2 | JA | KO | ZH |
|-------|----|----|-----|
| EN    | ✅ | ✅ | ✅  |
| ES    | ⬜ | ⬜ | ⬜  |

✅ = Supported, ⬜ = Planned
