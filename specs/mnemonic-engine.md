# LinguaForge — Mnemonic & Study Tips Engine

> Spec Reference: Phase 1 — Discovery & Specs
> Agent: 12-Domain Logic + 27-Spec Writer
> Status: APPROVED

## Overview

The Mnemonic Engine generates personalized memory aids by analyzing the relationship between the learner's L1 and L2. It combines linguistic analysis, cognitive science, and AI-powered creativity to produce effective, memorable learning aids.

## Research Foundation

### Proven Mnemonic Techniques in Language Learning

| Technique | Effectiveness | Best For | Source |
|-----------|--------------|----------|--------|
| **Keyword Method** | +40% vocabulary recall | New vocabulary | Atkinson (1975), Memrise |
| **Spaced Repetition** | +200% long-term retention | Everything | Ebbinghaus, Anki research |
| **Cognate Awareness** | +30% initial vocabulary | Related languages | Cross-linguistic transfer studies |
| **Sentence Context** | +25% usage accuracy | Grammar patterns | Babbel methodology |
| **Phonetic Associations** | +35% pronunciation | Sound systems | Rosetta Stone approach |
| **Visual Imagery** | +45% recall for concrete nouns | Vocabulary | Dual coding theory |
| **Story Method** | +50% sequential recall | Verb conjugations | Memory palace tradition |

---

## Mnemonic Types

### 1. Cognate Bridge Mnemonics
Leverages shared etymological roots between L1 and L2.

```yaml
type: cognate_bridge
strategy: "Show the L1 word, reveal the L2 cognate, explain the pattern"

example:
  pair: { source: es, target: en }
  source_word: "universidad"
  target_word: "university"
  bridge: |
    🔗 universidad → university
    Pattern: -dad → -ty
    More examples: ciudad→city, libertad→liberty, curiosidad→curiosity

  instant_unlock: |
    You already know ~1,200 English words!
    Just apply these suffix swaps:
    • -ción → -tion (nación → nation)
    • -dad → -ty (ciudad → city)
    • -mente → -ly (rápidamente → rapidly)
    • -oso → -ous (famoso → famous)
    • -ble → -ble (posible → possible)
    • -ista → -ist (artista → artist)
```

### 2. Phonetic Link Mnemonics
Creates sound-based associations between L1 and L2 words.

```yaml
type: phonetic_link
strategy: "Find a word in L1 that SOUNDS like the L2 word, then create a vivid image"

examples:
  - pair: { source: es, target: en }
    target_word: "beach"
    pronunciation: "/biːtʃ/"
    l1_sound_alike: "bicho (bug)"
    mnemonic: "Imagina un BICHO (bug) gigante en la BEACH (playa) 🏖️🐛"
    image_description: "A giant cartoon bug relaxing on a beach towel"

  - pair: { source: es, target: de }
    target_word: "Schmetterling"
    pronunciation: "/ˈʃmɛtɐlɪŋ/"
    meaning: "butterfly"
    l1_sound_alike: "Es-meter-ling"
    mnemonic: "Un METEORITO con forma de MARIPOSA (Schmetterling) cayendo del cielo"
    note: "The word sounds dramatic for such a delicate creature — use the contrast!"

  - pair: { source: en, target: ja }
    target_word: "切手 (kitte)"
    pronunciation: "/kɪt.te/"
    meaning: "stamp"
    l1_sound_alike: "kitty"
    mnemonic: "A KITTY cat licking a STAMP (切手) on an envelope 🐱📮"
```

### 3. False Friend Alert Mnemonics
Prevents dangerous L1→L2 vocabulary interference.

```yaml
type: false_friend_alert
strategy: "Create a memorable WARNING that prevents the common mistake"

examples:
  - pair: { source: es, target: en }
    false_friend: "embarazada"
    seems_like: "embarrassed"
    actually_means: "pregnant"
    correct_word: "avergonzada"
    mnemonic: |
      ⚠️ ALERT: "Estoy embarazada" ≠ "I'm embarrassed"
      It means "I'm PREGNANT"! 🤰

      Remember: "embarazada" has "BRAZ" in it → think BRAZO (arm)
      holding a BABY → PREGNANT

      For "embarrassed" → use "avergonzada" (VERGÜENZA = shame)

  - pair: { source: es, target: en }
    false_friend: "éxito"
    seems_like: "exit"
    actually_means: "success"
    correct_word: "salida"
    mnemonic: |
      ⚠️ "Éxito" ≠ "Exit"!
      ÉXITO = SUCCESS 🏆 (think: "EXIT-o... I exited the competition as #1!")
      EXIT = SALIDA 🚪 (SAL-ida → SAL = salt → throw salt over shoulder as you leave)
```

### 4. Grammar Rule Mnemonics
Makes grammar rules sticky through rhymes, acronyms, and patterns.

```yaml
type: grammar_rule

examples:
  - pair: { source: es, target: en }
    rule: "When to use 'a' vs 'an'"
    mnemonic:
      type: rhyme
      content: |
        Before a consonant SOUND, "a" is found.
        Before a vowel SOUND, "an" comes around.
        ⚠️ It's about SOUND, not spelling!
        "a university" (sounds like Y) ✅
        "an hour" (silent H) ✅

  - pair: { source: es, target: de }
    rule: "German article genders (der/die/das)"
    mnemonic:
      type: category_groups
      content: |
        🔵 DER (masculine) — Think: "Der MAN"
        Endings: -er, -en, -el, -ling, -ich, -ig
        Categories: days, months, seasons, weather, cars, alcohol

        🔴 DIE (feminine) — Think: "Die LADY"
        Endings: -e, -ung, -heit, -keit, -schaft, -tion, -ie
        Categories: flowers, trees, numbers used as nouns

        🟡 DAS (neuter) — Think: "Das THING"
        Endings: -chen, -lein, -um, -ment, -nis
        Categories: metals, colors as nouns, infinitives as nouns

  - pair: { source: en, target: es }
    rule: "Ser vs Estar"
    mnemonic:
      type: acronym
      content: |
        Use ESTAR for PLACE things:
        P → Position (Estoy en la cocina)
        L → Looks/appearance that change (Estás guapa hoy)
        A → Action in progress (Estoy comiendo)
        C → Condition/temporary (Estoy cansado)
        E → Emotion (Estoy feliz)

        Everything else → SER (identity, time, origin, profession, material)
        Think: "If it won't change much, it's SER. If it might change, ESTAR."
```

### 5. Cultural Bridge Mnemonics
Uses cultural knowledge to anchor language concepts.

```yaml
type: cultural_bridge
strategy: "Connect linguistic concepts to cultural knowledge the learner already has"

examples:
  - pair: { source: es, target: ja }
    concept: "Japanese formality levels (keigo)"
    bridge: |
      Think of it like "usted" vs "tú" but with 3 levels:
      🤝 丁寧語 (teineigo) = Usted (polite, general use)
      🙇 謙譲語 (kenjōgo) = "Su merced" (humble, about yourself)
      👑 尊敬語 (sonkeigo) = "Su Excelencia" (honoring, about them)

  - pair: { source: en, target: es }
    concept: "Subjunctive mood"
    bridge: |
      English HAS subjunctive — you already use it!
      "If I WERE you..." (not "was") — that's subjunctive!
      "I suggest he BE there" (not "is") — subjunctive!

      Spanish just uses it MORE often:
      Wishes: "Espero que VENGAS" (I hope you come-SUBJUNCTIVE)
      Doubts: "No creo que SEA" (I don't think it is-SUBJUNCTIVE)
      Emotions: "Me alegra que ESTÉS" (I'm glad you are-SUBJUNCTIVE)
```

---

## Spaced Repetition Algorithm (SM-2 Enhanced)

LinguaForge uses a modified SM-2 algorithm with cross-linguistic weighting.

```
Algorithm: LinguaForge Adaptive Repetition (LFAR)

Parameters per review card:
  - easiness_factor (EF): starts at 2.5, min 1.3
  - interval: days until next review
  - repetitions: successful reviews in a row
  - cross_linguistic_weight (CLW): 0.5-2.0

Review scoring (0-5):
  0 = Complete blackout
  1 = Wrong, but recognized after seeing answer
  2 = Wrong, but answer felt familiar
  3 = Correct with significant difficulty
  4 = Correct with minor hesitation
  5 = Perfect, instant recall

Interval calculation:
  if score < 3:
    repetitions = 0
    interval = 1
  else:
    if repetitions == 0: interval = 1
    if repetitions == 1: interval = 3 * CLW
    if repetitions == 2: interval = 7 * CLW
    else: interval = previous_interval * EF * CLW

  EF = EF + (0.1 - (5-score) * (0.08 + (5-score) * 0.02))
  EF = max(EF, 1.3)

Cross-Linguistic Weight (CLW):
  cognate: 0.7           # Cognates are easier — longer intervals
  positive_transfer: 0.8  # L1 pattern helps — slightly longer intervals
  neutral: 1.0            # No L1 influence
  negative_transfer: 1.3  # L1 interferes — shorter intervals, more reviews
  false_friend: 1.5       # Dangerous similarity — much shorter intervals
  zero_transfer: 1.2      # No L1 equivalent — shorter intervals
```

### Optimal Review Schedule

```
Card difficulty    | Review intervals
-------------------+------------------------------------------
Easy cognate       | 1d → 5d → 18d → 60d → 180d (graduated)
Normal vocabulary  | 1d → 3d → 7d → 21d → 60d → 180d
Tricky pattern     | 1d → 2d → 5d → 12d → 30d → 90d
False friend       | 1d → 1d → 3d → 7d → 14d → 30d → 90d
Grammar rule       | 1d → 3d → 10d → 30d → 90d → 180d
```

---

## Study Tips Engine

### Contextual Tips (appear during lessons)

```yaml
tips:
  before_lesson:
    - "🎯 Today's pattern: Adjective placement. In {L1}, adjectives go {position}. In {L2}, they go {position}. Watch for the difference!"
    - "💡 Quick win: {count} words in today's lesson are cognates with {L1}. You already know them!"

  during_exercise:
    - trigger: "user_hesitates_5_seconds"
      tip: "Think about how you'd say this in {L1} first, then look for the pattern difference."

    - trigger: "error_on_word_order"
      tip: "Remember: {L2} puts the {part_of_speech} {position}. Your {L1} instinct puts it {other_position}."

    - trigger: "error_on_false_friend"
      tip: "⚠️ This is a false friend! '{word}' looks like '{seems_like}' but means '{actual_meaning}'."

    - trigger: "correct_difficult_pattern"
      tip: "Great job! That pattern trips up most {L1} speakers. You're ahead of the curve! 🌟"

  after_lesson:
    - "📊 You're strongest at {best_pattern_category}. Let's challenge you with {weakest_pattern_category} next!"
    - "🧠 Review tip: Say today's 3 hardest words out loud before bed. Sleep consolidates language memory!"

  study_habits:
    - "⏰ Best time to study: Short sessions (10-15 min) beat marathon sessions. Your brain needs gaps to consolidate."
    - "🔄 Mix it up: Interleaving different pattern types in one session improves retention by 25%."
    - "🗣️ Speak out loud: Even when alone, vocalizing activates motor memory for language production."
    - "🎵 Listen to {L2} music: Background exposure primes your brain for the sound patterns."
    - "📱 Change your phone language to {L2}: Passive immersion through daily device use."
    - "✍️ Write a daily journal sentence in {L2}: Combines grammar, vocabulary, and creative thinking."
```

### Personalized Study Plan Generator

```yaml
study_plan:
  inputs:
    - user.available_minutes_per_day
    - user.current_level
    - user.weak_patterns
    - user.goals  # "travel", "work", "exam", "culture"

  output_example:
    daily_plan:
      morning_5min:
        activity: "Review 10 spaced repetition cards"
        focus: "False friends and weak patterns"
      commute_10min:
        activity: "Listen to {L2} podcast episode"
        focus: "Passive immersion, tuning to sound patterns"
      lunch_5min:
        activity: "1 pattern lesson"
        focus: "Today's cross-linguistic pattern"
      evening_10min:
        activity: "Practice exercises + daily challenge"
        focus: "Active recall and gamification"

    weekly_schedule:
      monday: "New patterns (word order)"
      tuesday: "Vocabulary + cognate detection"
      wednesday: "Grammar deep-dive + mnemonics"
      thursday: "Listening + pronunciation"
      friday: "Review + false friends"
      saturday: "Community challenge + conversation practice"
      sunday: "Light review + achievement hunting"
```

### Error Pattern Analysis & Adaptive Tips

```yaml
error_analysis:
  detection:
    threshold: "3+ errors on same pattern category within 7 days"
    action: "Generate targeted study tip + add extra review cards"

  example_output:
    pattern: "word_order"
    error_count: 5
    last_7_days: true
    generated_tip: |
      📋 We noticed you're mixing up word order when translating.

      Your {L1} brain wants to say: "The house big" (casa grande)
      But {L2} needs: "The big house"

      Quick fix: Before translating, ask yourself:
      "Where does the adjective go in {L2}?"
      Then restructure BEFORE writing.

      Try this drill: Take any {L1} sentence and move the adjectives
      to their {L2} position. Do 5 sentences now! 💪

    remediation:
      - "3 extra word-order exercises added to today's lesson"
      - "Mnemonic refresher card added to review queue"
      - "Pattern comparison visual unlocked in Pattern Library"
```
