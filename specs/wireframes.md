# LinguaForge — Wireframes & UI Specification

> Spec Reference: Phase 1 — Discovery & Specs
> Agent: 16-UI Builder + 15-Frontend Developer
> Status: APPROVED

## Design System

```yaml
design_tokens:
  colors:
    primary: "#6C5CE7"       # Purple — learning/wisdom
    secondary: "#00B894"     # Green — success/growth
    accent: "#FDCB6E"        # Gold — achievements/XP
    danger: "#E17055"        # Red — errors/false friends
    warning: "#F39C12"       # Orange — streak warnings
    info: "#74B9FF"          # Blue — tips/information
    background: "#FAFAFA"
    surface: "#FFFFFF"
    text_primary: "#2D3436"
    text_secondary: "#636E72"

  typography:
    heading: "Inter, sans-serif"
    body: "Inter, sans-serif"
    code: "JetBrains Mono, monospace"  # For sentence structure annotations

  spacing:
    unit: 8px
    small: 8px
    medium: 16px
    large: 24px
    xlarge: 32px

  border_radius:
    small: 8px
    medium: 12px
    large: 16px
    pill: 999px
```

## Screen Map

```
┌──────────────────────────────────────────────┐
│                    APP                        │
├──────────────┬───────────────────────────────┤
│  Onboarding  │  Main App (Tab Navigation)    │
│  ├ Welcome   │  ├ Home (Today's Plan)        │
│  ├ L1 Select │  ├ Learn (Lessons & Patterns) │
│  ├ L2 Select │  ├ Review (Spaced Repetition) │
│  ├ Level Test │  ├ Leagues (Leaderboard)     │
│  └ Goal Set  │  └ Profile (Progress & Stats) │
└──────────────┴───────────────────────────────┘
```

---

## 1. Home Screen — Today's Plan

```
┌─────────────────────────────────────┐
│  🔥 Day 14 Streak    ⚡ 2,340 XP   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Level 12 Explorer   ████████░░ 78% │
├─────────────────────────────────────┤
│                                     │
│  Buenos días! Today's focus:        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 📖 Pattern: Adjective Order  │  │
│  │ ES→EN | Difficulty: ██░░░    │  │
│  │ "El gato negro → The black   │  │
│  │  cat"                        │  │
│  │           [Start Lesson →]   │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🔄 12 cards due for review   │  │
│  │ 🎯 3 false friends to master │  │
│  │           [Review Now →]     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Daily Challenges              │  │
│  │ ✅ Speed Round       +35 XP  │  │
│  │ ⬜ Pattern Blitz     +40 XP  │  │
│  │ ⬜ False Friend Run  +50 XP  │  │
│  └───────────────────────────────┘  │
│                                     │
│  💡 Tip: Spanish→English shares    │
│  ~1,200 cognates! Words ending     │
│  in -ción = -tion (nación→nation)  │
│                                     │
├─────────────────────────────────────┤
│  🏠    📚    🔄    🏆    👤       │
│  Home  Learn Review League Profile │
└─────────────────────────────────────┘
```

## 2. Pattern Lesson Screen

```
┌─────────────────────────────────────┐
│  ← Back    Lesson 3/8    ♥♥♥♥♥    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Pattern: Adjective Placement       │
├─────────────────────────────────────┤
│                                     │
│  In YOUR language (Spanish):        │
│  ┌───────────────────────────────┐  │
│  │  El  gato  negro  duerme     │  │
│  │  ART NOUN  ADJ    VERB      │  │
│  │       └────┘                 │  │
│  │    noun THEN adjective       │  │
│  └───────────────────────────────┘  │
│                                     │
│           ↕ Compare ↕              │
│                                     │
│  In English:                        │
│  ┌───────────────────────────────┐  │
│  │  The  black  cat   sleeps    │  │
│  │  ART  ADJ    NOUN  VERB     │  │
│  │       └────┘                 │  │
│  │    adjective THEN noun       │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 💡 KEY DIFFERENCE:            │  │
│  │ Spanish: NOUN + ADJ           │  │
│  │ English: ADJ + NOUN           │  │
│  │                               │  │
│  │ Just FLIP the order!          │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🧠 MNEMONIC:                  │  │
│  │ "In English, the adjective    │  │
│  │  is EAGER — it jumps BEFORE   │  │
│  │  the noun!"                   │  │
│  └───────────────────────────────┘  │
│                                     │
│         [Got it! Practice →]        │
└─────────────────────────────────────┘
```

## 3. Exercise Screen — Word Order

```
┌─────────────────────────────────────┐
│  ← Back    Exercise 2/5    ⚡+3 XP │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Pattern: Adjective Placement       │
├─────────────────────────────────────┤
│                                     │
│  Translate to English:              │
│                                     │
│  "Una casa bonita"                  │
│                                     │
│  Drag words into the correct order: │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  [        ] [        ]      │    │
│  │  [        ]                 │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Available words:                   │
│                                     │
│  ┌──────┐ ┌───────────┐ ┌──────┐   │
│  │house │ │ beautiful │ │  A   │   │
│  └──────┘ └───────────┘ └──────┘   │
│                                     │
│                                     │
│  💡 Hint: Remember, in English      │
│  the adjective comes BEFORE!        │
│                                     │
│             [Check →]               │
│                                     │
└─────────────────────────────────────┘
```

## 4. Exercise — Correct Answer Feedback

```
┌─────────────────────────────────────┐
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ✅ Correct!           +3 XP  │  │
│  │                               │  │
│  │ "A beautiful house"           │  │
│  │                               │  │
│  │ 📊 Pattern breakdown:        │  │
│  │ ES: Una [casa] [bonita]      │  │
│  │      ↓   NOUN    ADJ         │  │
│  │ EN: A  [beautiful] [house]   │  │
│  │      ↓    ADJ       NOUN     │  │
│  │                               │  │
│  │ You flipped the order         │  │
│  │ perfectly! 🎯                 │  │
│  └───────────────────────────────┘  │
│                                     │
│            [Continue →]             │
│                                     │
└─────────────────────────────────────┘
```

## 5. Exercise — Wrong Answer Feedback

```
┌─────────────────────────────────────┐
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ❌ Not quite!                 │  │
│  │                               │  │
│  │ Your answer: "A house         │  │
│  │  beautiful"                   │  │
│  │                               │  │
│  │ Correct: "A beautiful house"  │  │
│  │                               │  │
│  │ 💡 You used Spanish word      │  │
│  │ order (noun then adjective).  │  │
│  │ English flips it:             │  │
│  │ adjective THEN noun.          │  │
│  │                               │  │
│  │ ⚠️ This is the #1 mistake    │  │
│  │ Spanish speakers make in      │  │
│  │ English!                      │  │
│  └───────────────────────────────┘  │
│                                     │
│            [Got it →]               │
│                                     │
└─────────────────────────────────────┘
```

## 6. Cognate Discovery Screen

```
┌─────────────────────────────────────┐
│  ← Back         Cognate Networks    │
├─────────────────────────────────────┤
│                                     │
│  🎉 You already know 1,200+        │
│  English words!                     │
│                                     │
│  Pattern: -ción → -tion             │
│  Reliability: 95%                   │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ nación      →  nation        │  │
│  │ educación   →  education     │  │
│  │ información →  information   │  │
│  │ revolución  →  revolution    │  │
│  │ +1,196 more...               │  │
│  └───────────────────────────────┘  │
│                                     │
│  More suffix patterns:              │
│  ┌──────────────────────┐           │
│  │ -dad  → -ty    ████░ │ 85%      │
│  │ -mente→ -ly    ███░░ │ 75%      │
│  │ -oso  → -ous   ████░ │ 80%      │
│  │ -ble  → -ble   █████ │ 95%      │
│  └──────────────────────┘           │
│                                     │
│  ⚠️ But watch out for FALSE        │
│  FRIENDS!                           │
│  [See False Friends →]              │
│                                     │
│         [Practice Cognates →]       │
└─────────────────────────────────────┘
```

## 7. False Friend Alert Screen

```
┌─────────────────────────────────────┐
│  ← Back        ⚠️ False Friends    │
├─────────────────────────────────────┤
│                                     │
│  These words look similar but       │
│  mean VERY different things!        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🚫 embarazada                 │  │
│  │                               │  │
│  │ Looks like: "embarrassed"     │  │
│  │ Actually means: "pregnant"    │  │
│  │ Danger level: 🔴 HIGH         │  │
│  │                               │  │
│  │ 🧠 Memory trick:              │  │
│  │ "embarazada has BRAZ in it    │  │
│  │  → BRAZO (arm) holding a      │  │
│  │  BABY → PREGNANT!"            │  │
│  │                               │  │
│  │ ✅ For "embarrassed" use:     │  │
│  │    "avergonzada"              │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🚫 éxito                      │  │
│  │ Looks like: "exit"            │  │
│  │ Actually means: "success"     │  │
│  │ Danger: 🟡 MEDIUM             │  │
│  └───────────────────────────────┘  │
│                                     │
│       [Practice False Friends →]    │
└─────────────────────────────────────┘
```

## 8. Spaced Repetition Review Screen

```
┌─────────────────────────────────────┐
│  ← Back   Review Session   12 left │
├─────────────────────────────────────┤
│                                     │
│                                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │    How do you say "success"   │  │
│  │    in Spanish?                │  │
│  │                               │  │
│  │    ⚠️ Careful — this is a     │  │
│  │    false friend!              │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│          [Show Answer]              │
│                                     │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  After revealing:                   │
│                                     │
│  Answer: "éxito" (NOT "suceso")    │
│                                     │
│  How well did you know this?        │
│                                     │
│  [😵] [😕] [🤔] [😊] [🤩] [⚡]  │
│   0     1    2    3    4    5      │
│  Blank Wrong Hmm  Hard  Good Easy  │
│                                     │
└─────────────────────────────────────┘
```

## 9. League / Leaderboard Screen

```
┌─────────────────────────────────────┐
│           🥇 Gold League            │
│      Week of Mar 17 - Mar 23       │
├─────────────────────────────────────┤
│  ↑ PROMOTION ZONE                   │
│  ┌───────────────────────────────┐  │
│  │  1. 👑 Maria_PT     1,240 XP │  │
│  │  2. 🔥 Carlos_MX    1,180 XP │  │
│  │  3. ⭐ You          1,050 XP │  │
│  │  ─────────────────────────── │  │
│  │  4.    Pierre_FR      980 XP │  │
│  │  5.    Hans_DE        920 XP │  │
│  │  ...                         │  │
│  │  25.   Yuki_JP        340 XP │  │
│  │  ─────────────────────────── │  │
│  │  ↓ DEMOTION ZONE             │  │
│  │  26.   Alex_US        290 XP │  │
│  │  27.   Kim_KR         250 XP │  │
│  │  28.   Lisa_DE        180 XP │  │
│  │  29.   Tom_UK         120 XP │  │
│  │  30.   Ana_BR          80 XP │  │
│  └───────────────────────────────┘  │
│                                     │
│  Your stats this week:              │
│  📚 7 lessons | 🎯 89% accuracy    │
│  🔥 14-day streak                   │
│                                     │
│  3 days left in this league week    │
└─────────────────────────────────────┘
```

## 10. Profile / Progress Screen

```
┌─────────────────────────────────────┐
│  👤 Carlos                          │
│  Level 12 Explorer | 2,340 XP       │
│  🔥 14-day streak | 🥇 Gold League │
├─────────────────────────────────────┤
│                                     │
│  Language Pairs:                    │
│  ┌───────────────────────────────┐  │
│  │ 🇪🇸→🇬🇧 Spanish→English  B1  │  │
│  │ ████████░░ 78% to B2          │  │
│  │                               │  │
│  │ 🇪🇸→🇵🇹 Spanish→Portuguese A2 │  │
│  │ ███░░░░░░░ 32% to B1         │  │
│  └───────────────────────────────┘  │
│                                     │
│  Pattern Mastery (ES→EN):           │
│  ┌───────────────────────────────┐  │
│  │ Word Order:    ████████░░ 82% │  │
│  │ Conjugation:   ███████░░░ 70% │  │
│  │ Cognates:      █████████░ 93% │  │
│  │ False Friends:  █████░░░░░ 55%│  │
│  │ Tense Mapping: ██████░░░░ 60% │  │
│  │ Prepositions:  ████░░░░░░ 40% │  │
│  └───────────────────────────────┘  │
│                                     │
│  Recent Achievements:               │
│  🏅 Pattern Hunter (10 mastered)    │
│  🏅 Week Warrior (7-day streak)     │
│  🏅 Cognate King (100 identified)   │
│                                     │
│  Stats:                             │
│  📚 47 lessons | ⏱️ 12h 30m total  │
│  🎯 84% accuracy | 📝 320 vocab    │
│                                     │
└─────────────────────────────────────┘
```

## Interaction Design Principles

1. **Immediate Feedback** — Every answer gets instant visual + audio feedback
2. **Show the Bridge** — Always display L1↔L2 comparison after exercises
3. **Celebrate Patterns** — Animate structural differences with color-coded highlights
4. **Progressive Disclosure** — Show simple rule first, exceptions later
5. **Accessible** — WCAG 2.1 AA, support for screen readers, dyslexia-friendly fonts
6. **Micro-sessions** — Every screen completable in under 3 minutes
7. **No Dead Ends** — Always show what to do next
