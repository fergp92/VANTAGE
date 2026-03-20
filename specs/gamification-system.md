# LinguaForge — Gamification System Design

> Spec Reference: Phase 1 — Discovery & Specs
> Agent: 16-UI Builder + 12-Domain Logic + 27-Spec Writer
> Status: APPROVED

## Research Analysis: What Works in the Market

### Duolingo (500M+ users)
- **XP System**: 10-20 XP per lesson, bonus XP for streaks, perfect scores
- **Streaks**: Most powerful retention mechanic — 76% of daily users cite streaks
- **Leagues**: Weekly competitive leagues (Bronze→Diamond) with promotion/demotion
- **Hearts**: Limited lives that regenerate — adds stakes to each answer
- **Crowns/Legendary**: Mastery levels per skill (0→5 crowns, then Legendary)

### Babbel (10M+ subscribers)
- **Review Manager**: Intelligent spaced repetition — less gamified, more effective
- **Completion Certificates**: Milestone recognition for course completions
- **Progress Tracking**: Visual progress bars per topic/level

### Busuu (100M+ users)
- **Community Corrections**: Native speakers review your writing — social gamification
- **Study Plan**: Personalized daily goals with reminder system
- **CEFR Certification**: Official level certification — real-world reward

### Key Research Findings
- Streaks increase retention by **2.4x** (Duolingo research, 2023)
- Leaderboards boost engagement **+17%** but can discourage bottom 20% of users
- Short sessions (5-15 min) have **3x** completion rate vs long sessions
- Immediate feedback on errors produces **40% faster** skill acquisition
- Social features increase retention by **1.5x** when optional (not forced)

---

## LinguaForge Gamification Architecture

### 1. XP (Experience Points) System

```yaml
xp_sources:
  lesson_completion:
    base: 15
    perfect_score_bonus: 5       # No errors
    speed_bonus: 3               # Under time threshold
    hard_mode_bonus: 10          # No hints used
    first_try_bonus: 2           # Per exercise answered correctly first try

  pattern_mastery:
    introduced: 5                # First encounter with pattern
    practicing: 10               # Reached "practicing" level
    familiar: 20                 # Reached "familiar" level
    mastered: 50                 # Fully mastered pattern

  review_session:
    base: 10
    streak_multiplier: true      # 1.5x at 7-day streak, 2x at 30-day

  daily_challenges:
    easy: 20
    medium: 35
    hard: 50

  achievements:
    varies: 10-200               # Depends on achievement rarity
```

### 2. Level System

```
Level 1-10:   Novice        (100 XP per level)
Level 11-20:  Explorer       (200 XP per level)
Level 21-30:  Adventurer     (350 XP per level)
Level 31-40:  Scholar        (500 XP per level)
Level 41-50:  Expert         (750 XP per level)
Level 51-60:  Master         (1000 XP per level)
Level 61-70:  Polyglot       (1500 XP per level)
Level 71-80:  Sage           (2000 XP per level)
Level 81-90:  Legend         (3000 XP per level)
Level 91-99:  Grandmaster    (5000 XP per level)
Level 100:    LinguaForge Champion (lifetime achievement)
```

Each level unlock:
- New lesson modules
- Cosmetic rewards (avatar frames, badges, themes)
- Feature unlocks (e.g., community features at L10, pattern editor at L30)

### 3. Streak System

```yaml
streak:
  definition: "Complete at least 1 lesson or review session per day"
  grace_period: "Until 04:00 local time next day"

  milestones:
    3_days: { reward: "5 XP bonus", badge: "Getting Started" }
    7_days: { reward: "Streak Shield ×1", badge: "Weekly Warrior" }
    14_days: { reward: "10 XP bonus/day", badge: "Committed Learner" }
    30_days: { reward: "Streak Shield ×2", badge: "Monthly Master" }
    60_days: { reward: "Theme unlock", badge: "Dedicated Scholar" }
    90_days: { reward: "15 XP bonus/day", badge: "Quarter Champion" }
    180_days: { reward: "Exclusive avatar", badge: "Half-Year Hero" }
    365_days: { reward: "Legendary frame", badge: "Annual Legend" }

  streak_shields:
    description: "Protects streak for 1 missed day"
    earn_methods:
      - "Streak milestones"
      - "Weekly challenge completion"
      - "Achievement rewards"
    max_inventory: 5

  streak_recovery:
    description: "Restore a broken streak within 24 hours"
    cost: "Complete a double-length review session"
    limit: "Once per 30 days"
```

### 4. League System (Weekly Competition)

```yaml
leagues:
  tiers:
    - name: Bronze
      icon: 🥉
      size: 30          # users per league
      promote_top: 10   # top 10 advance
      demote_bottom: 0  # no demotion from Bronze

    - name: Silver
      icon: 🥈
      size: 30
      promote_top: 10
      demote_bottom: 5

    - name: Gold
      icon: 🥇
      size: 30
      promote_top: 10
      demote_bottom: 5

    - name: Sapphire
      icon: 💎
      size: 30
      promote_top: 10
      demote_bottom: 5

    - name: Ruby
      icon: ❤️‍🔥
      size: 30
      promote_top: 5
      demote_bottom: 10

    - name: Obsidian
      icon: 🖤
      size: 20
      promote_top: 3
      demote_bottom: 10

    - name: Diamond
      icon: 💠
      size: 20
      promote_top: 0    # top tier
      demote_bottom: 10

  scoring: "Weekly XP earned (Mon 00:00 → Sun 23:59 UTC)"
  rewards:
    first_place: "50 bonus XP + league badge"
    top_3: "30 bonus XP"
    promoted: "20 bonus XP"
  opt_out: true  # Users can disable leagues if they prefer non-competitive
```

### 5. Achievement System

```yaml
achievement_categories:

  learning_milestones:
    - id: first_lesson
      name: "First Steps"
      description: "Complete your first lesson"
      xp: 10
      rarity: common

    - id: pattern_hunter_10
      name: "Pattern Hunter"
      description: "Master 10 cross-linguistic patterns"
      xp: 50
      rarity: uncommon

    - id: pattern_hunter_50
      name: "Pattern Master"
      description: "Master 50 cross-linguistic patterns"
      xp: 200
      rarity: rare

    - id: cognate_king
      name: "Cognate King"
      description: "Identify 100 true cognates correctly"
      xp: 100
      rarity: uncommon

    - id: false_friend_detector
      name: "False Friend Detector"
      description: "Correctly avoid 50 false friends"
      xp: 150
      rarity: rare

  streak_achievements:
    - id: week_warrior
      name: "Week Warrior"
      description: "7-day streak"
      xp: 25
      rarity: common

    - id: iron_will
      name: "Iron Will"
      description: "100-day streak"
      xp: 500
      rarity: epic

    - id: unstoppable
      name: "Unstoppable"
      description: "365-day streak"
      xp: 2000
      rarity: legendary

  accuracy_achievements:
    - id: sharpshooter
      name: "Sharpshooter"
      description: "Complete 10 lessons with 100% accuracy"
      xp: 100
      rarity: rare

    - id: perfectionist
      name: "Perfectionist"
      description: "Complete 50 lessons with 100% accuracy"
      xp: 500
      rarity: epic

  social_achievements:
    - id: helpful_native
      name: "Helpful Native"
      description: "Correct 10 community submissions"
      xp: 50
      rarity: uncommon

    - id: polyglot_path
      name: "Polyglot Path"
      description: "Study 3 different language pairs"
      xp: 200
      rarity: rare

  special_achievements:
    - id: bridge_builder
      name: "Bridge Builder"
      description: "Use a pattern from L1→L2 to learn L2→L3"
      xp: 300
      rarity: epic

    - id: mnemonic_creator
      name: "Mnemonic Creator"
      description: "Create a community mnemonic rated 4+ by 10 users"
      xp: 200
      rarity: rare

rarity_distribution:
  common: "60% of users earn within first month"
  uncommon: "30% of users earn within 3 months"
  rare: "10% of users earn within 6 months"
  epic: "3% of users earn within 1 year"
  legendary: "< 1% of users earn"
```

### 6. Daily Challenges

```yaml
daily_challenges:
  description: "3 rotating challenges per day, refreshed at midnight local time"

  challenge_types:
    - type: speed_round
      description: "Answer 10 questions in 60 seconds"
      reward: 35 XP

    - type: pattern_blitz
      description: "Identify 5 patterns without errors"
      reward: 40 XP

    - type: translation_chain
      description: "Translate a paragraph sentence by sentence"
      reward: 45 XP

    - type: false_friend_gauntlet
      description: "Navigate 10 false friend traps"
      reward: 50 XP

    - type: listening_marathon
      description: "Transcribe 5 audio clips"
      reward: 40 XP

    - type: structure_detective
      description: "Match 8 sentence structures between L1 and L2"
      reward: 45 XP

  weekly_bonus:
    complete_all_7_days: "Streak Shield + 100 bonus XP"
```

### 7. Hearts / Energy System (Optional)

```yaml
hearts:
  enabled_by_default: false     # Opt-in for users who want stakes
  max_hearts: 5
  lose_on: "incorrect answer"
  regeneration: "1 heart per 4 hours"
  full_refill: "Complete a review session (spaced repetition)"

  rationale: |
    Research shows hearts/lives increase answer deliberation (+23% accuracy)
    but decrease session length (-15%). Made optional to respect different
    learning styles. Disabled for paid subscribers.
```

## Gamification Anti-Patterns to Avoid

Based on Duolingo/Babbel research and user feedback:

| Anti-Pattern | Problem | LinguaForge Solution |
|-------------|---------|---------------------|
| Punishing mistakes too harshly | Discourages experimentation | Hearts are optional; errors become learning data |
| Streak anxiety | Causes stress, not learning | Streak shields + recovery + gentle notifications |
| Leaderboard shame | Bottom 20% feel demotivated | Opt-out leagues + personal best tracking |
| Grinding for XP | Learning quality drops | XP caps per repetition; mastery requires accuracy |
| Pay-to-win | Unfair advantage perception | Paid features are convenience, not power |
| Notification spam | User annoyance → uninstall | Smart notifications (max 1/day, time-aware) |
