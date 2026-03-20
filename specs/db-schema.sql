-- ============================================================
-- LinguaForge Database Schema
-- Spec Reference: Phase 1 — Discovery & Specs
-- Agent: 14-Adapter Developer + 27-Spec Writer
-- Database: PostgreSQL 16 + pgvector extension
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ============================================================
-- USER MANAGEMENT
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100),
    native_language CHAR(2) NOT NULL,  -- ISO 639-1
    avatar_url      VARCHAR(500),
    timezone        VARCHAR(50) DEFAULT 'UTC',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_language_pairs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_language CHAR(2) NOT NULL,
    target_language CHAR(2) NOT NULL,
    current_level   VARCHAR(2) NOT NULL DEFAULT 'A1', -- CEFR
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, source_language, target_language)
);

CREATE TABLE user_settings (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_goal_minutes  INT DEFAULT 15,
    notifications       BOOLEAN DEFAULT TRUE,
    league_opt_in       BOOLEAN DEFAULT TRUE,
    hearts_enabled      BOOLEAN DEFAULT FALSE,
    sound_effects       BOOLEAN DEFAULT TRUE,
    dark_mode           BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- LANGUAGES & PAIRS
-- ============================================================

CREATE TABLE languages (
    code        CHAR(2) PRIMARY KEY,  -- ISO 639-1
    name        VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    family      VARCHAR(100) NOT NULL,
    script      VARCHAR(50) DEFAULT 'Latin'
);

CREATE TABLE language_pairs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_language         CHAR(2) NOT NULL REFERENCES languages(code),
    target_language         CHAR(2) NOT NULL REFERENCES languages(code),
    family_relation         VARCHAR(20) NOT NULL, -- same_family, distant, unrelated
    difficulty_coefficient  DECIMAL(3,2) NOT NULL, -- 0.00-1.00
    shared_roots_pct        DECIMAL(5,2) NOT NULL, -- % cognates
    support_level           VARCHAR(10) DEFAULT 'full', -- full, beta, planned
    UNIQUE(source_language, target_language)
);

-- ============================================================
-- CROSS-LINGUISTIC PATTERNS (Core Innovation)
-- ============================================================

CREATE TABLE pattern_categories (
    id          VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT
);

INSERT INTO pattern_categories (id, name, description) VALUES
    ('word_order',    'Word Order',         'How sentence elements are arranged'),
    ('conjugation',   'Conjugation',        'Verb conjugation mapping'),
    ('gender_system', 'Gender System',      'Grammatical gender differences'),
    ('tense_mapping', 'Tense Mapping',      'How tenses map between languages'),
    ('article_usage', 'Article Usage',      'Definite/indefinite article rules'),
    ('preposition',   'Prepositions',       'Prepositional differences'),
    ('phonetic',      'Phonetic Patterns',  'Sound system differences'),
    ('cognate',       'Cognate Networks',   'Shared vocabulary roots'),
    ('false_friend',  'False Friends',      'Deceptive cross-language similarities');

CREATE TABLE patterns (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair_id             UUID NOT NULL REFERENCES language_pairs(id),
    category_id         VARCHAR(50) NOT NULL REFERENCES pattern_categories(id),
    pattern_code        VARCHAR(50) UNIQUE NOT NULL, -- e.g., WO-ES-EN-001
    name                VARCHAR(200) NOT NULL,
    difficulty          INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    source_structure    JSONB NOT NULL,
    target_structure    JSONB NOT NULL,
    transformation_rule JSONB NOT NULL,
    common_errors       TEXT[] DEFAULT '{}',
    mnemonic_hints      TEXT[] DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pattern_examples (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_id  UUID NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    highlight   TEXT,
    sort_order  INT DEFAULT 0
);

-- ============================================================
-- COGNATES & FALSE FRIENDS
-- ============================================================

CREATE TABLE cognate_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair_id         UUID NOT NULL REFERENCES language_pairs(id),
    source_suffix   VARCHAR(50) NOT NULL,
    target_suffix   VARCHAR(50) NOT NULL,
    reliability     DECIMAL(3,2) NOT NULL, -- 0.00-1.00
    example_count   INT DEFAULT 0,
    description     TEXT
);

CREATE TABLE false_friends (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair_id             UUID NOT NULL REFERENCES language_pairs(id),
    source_word         VARCHAR(200) NOT NULL,
    source_meaning      TEXT NOT NULL,
    misleading_target   VARCHAR(200) NOT NULL, -- what it looks like
    actual_translation  VARCHAR(200) NOT NULL, -- correct translation
    danger_level        VARCHAR(10) DEFAULT 'medium', -- low, medium, high
    mnemonic            TEXT
);

-- ============================================================
-- LESSONS & EXERCISES
-- ============================================================

CREATE TABLE modules (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair_id     UUID NOT NULL REFERENCES language_pairs(id),
    name        VARCHAR(200) NOT NULL,
    level       VARCHAR(2) NOT NULL, -- CEFR
    sort_order  INT DEFAULT 0,
    description TEXT
);

CREATE TABLE lessons (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id           UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    objectives          TEXT[] DEFAULT '{}',
    estimated_minutes   INT DEFAULT 10,
    xp_reward           INT DEFAULT 15,
    sort_order          INT DEFAULT 0
);

CREATE TABLE lesson_patterns (
    lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    pattern_id  UUID NOT NULL REFERENCES patterns(id),
    sort_order  INT DEFAULT 0,
    PRIMARY KEY (lesson_id, pattern_id)
);

CREATE TABLE vocabulary (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair_id             UUID NOT NULL REFERENCES language_pairs(id),
    word                VARCHAR(200) NOT NULL,
    translation         VARCHAR(200) NOT NULL,
    pronunciation       VARCHAR(200),
    part_of_speech      VARCHAR(50),
    cognate_type        VARCHAR(20) DEFAULT 'none', -- true_cognate, false_friend, none
    level               VARCHAR(2) NOT NULL, -- CEFR
    example_sentence    TEXT,
    audio_url           VARCHAR(500)
);

CREATE TABLE lesson_vocabulary (
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    vocabulary_id   UUID NOT NULL REFERENCES vocabulary(id),
    sort_order      INT DEFAULT 0,
    PRIMARY KEY (lesson_id, vocabulary_id)
);

CREATE TABLE exercises (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    difficulty      INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    prompt          TEXT NOT NULL,
    options         JSONB,           -- for multiple choice
    correct_answer  TEXT NOT NULL,
    pattern_id      UUID REFERENCES patterns(id),
    xp_value        INT DEFAULT 3,
    hints           TEXT[] DEFAULT '{}',
    time_limit      INT,             -- seconds, nullable
    sort_order      INT DEFAULT 0
);

-- ============================================================
-- MNEMONICS
-- ============================================================

CREATE TABLE mnemonics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            VARCHAR(50) NOT NULL,
    pair_id         UUID NOT NULL REFERENCES language_pairs(id),
    target_word     VARCHAR(200),
    pattern_id      UUID REFERENCES patterns(id),
    content         TEXT NOT NULL,
    explanation     TEXT,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    effectiveness   DECIMAL(3,2) DEFAULT 0.50,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mnemonic_ratings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mnemonic_id UUID NOT NULL REFERENCES mnemonics(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mnemonic_id, user_id)
);

-- ============================================================
-- GAMIFICATION
-- ============================================================

CREATE TABLE user_xp (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_xp      INT DEFAULT 0,
    total_xp        INT DEFAULT 0,
    level           INT DEFAULT 1,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE xp_transactions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      INT NOT NULL,
    source      VARCHAR(50) NOT NULL, -- lesson, review, challenge, achievement, bonus
    source_id   UUID,
    description VARCHAR(200),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_streaks (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak      INT DEFAULT 0,
    longest_streak      INT DEFAULT 0,
    last_activity_date  DATE,
    streak_shields      INT DEFAULT 0,
    freeze_active       BOOLEAN DEFAULT FALSE,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leagues (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier        VARCHAR(20) NOT NULL, -- Bronze, Silver, Gold, etc.
    week_start  DATE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tier, week_start)
);

CREATE TABLE league_members (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id   UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weekly_xp   INT DEFAULT 0,
    rank        INT,
    UNIQUE(league_id, user_id)
);

CREATE TABLE achievements (
    id          VARCHAR(100) PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category    VARCHAR(50) NOT NULL,
    rarity      VARCHAR(20) NOT NULL, -- common, uncommon, rare, epic, legendary
    xp_reward   INT DEFAULT 0,
    criteria    JSONB NOT NULL -- programmatic unlock criteria
);

CREATE TABLE user_achievements (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id  VARCHAR(100) NOT NULL REFERENCES achievements(id),
    earned_at       TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE daily_challenges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date        DATE NOT NULL,
    type        VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    config      JSONB NOT NULL,
    xp_reward   INT NOT NULL,
    UNIQUE(date, type)
);

CREATE TABLE user_daily_challenges (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id    UUID NOT NULL REFERENCES daily_challenges(id),
    completed       BOOLEAN DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    PRIMARY KEY (user_id, challenge_id)
);

-- ============================================================
-- SPACED REPETITION
-- ============================================================

CREATE TABLE review_cards (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pair_id                 UUID NOT NULL REFERENCES language_pairs(id),
    card_type               VARCHAR(50) NOT NULL, -- vocabulary, pattern, grammar_rule, false_friend
    front                   TEXT NOT NULL,
    back                    TEXT NOT NULL,
    hint                    TEXT,
    source_id               UUID, -- references vocabulary, pattern, etc.
    cross_linguistic_weight  DECIMAL(3,2) DEFAULT 1.00,
    easiness_factor         DECIMAL(4,2) DEFAULT 2.50,
    interval_days           DECIMAL(8,2) DEFAULT 0,
    repetitions             INT DEFAULT 0,
    next_review_at          TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed_at        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_cards_due ON review_cards (user_id, next_review_at)
    WHERE next_review_at <= NOW();

CREATE TABLE review_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id     UUID NOT NULL REFERENCES review_cards(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score       INT NOT NULL CHECK (score BETWEEN 0 AND 5),
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROGRESS & ANALYTICS
-- ============================================================

CREATE TABLE user_progress (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pair_id                 UUID NOT NULL REFERENCES language_pairs(id),
    lessons_completed       INT DEFAULT 0,
    exercises_completed     INT DEFAULT 0,
    accuracy                DECIMAL(5,4) DEFAULT 0, -- rolling avg
    study_time_minutes      INT DEFAULT 0,
    patterns_introduced     INT DEFAULT 0,
    patterns_mastered       INT DEFAULT 0,
    vocabulary_learned      INT DEFAULT 0,
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, pair_id)
);

CREATE TABLE pattern_mastery (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_id      UUID NOT NULL REFERENCES patterns(id),
    mastery_level   VARCHAR(20) DEFAULT 'unseen',
    -- unseen, introduced, practicing, familiar, mastered
    accuracy        DECIMAL(5,4) DEFAULT 0,
    practice_count  INT DEFAULT 0,
    last_practiced  TIMESTAMPTZ,
    PRIMARY KEY (user_id, pattern_id)
);

CREATE TABLE exercise_results (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id     UUID NOT NULL REFERENCES exercises(id),
    lesson_id       UUID NOT NULL REFERENCES lessons(id),
    correct         BOOLEAN NOT NULL,
    user_answer     TEXT,
    time_seconds    DECIMAL(8,2),
    hints_used      INT DEFAULT 0,
    completed_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE error_patterns (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pair_id         UUID NOT NULL REFERENCES language_pairs(id),
    category_id     VARCHAR(50) NOT NULL REFERENCES pattern_categories(id),
    error_count     INT DEFAULT 1,
    recent_errors   JSONB DEFAULT '[]',
    first_detected  TIMESTAMPTZ DEFAULT NOW(),
    last_detected   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STUDY PLANS
-- ============================================================

CREATE TABLE user_study_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pair_id             UUID NOT NULL REFERENCES language_pairs(id),
    daily_goal_minutes  INT DEFAULT 15,
    goal_type           VARCHAR(50) DEFAULT 'general', -- travel, work, exam, culture
    weekly_schedule     JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, pair_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_user_lang_pairs ON user_language_pairs (user_id);
CREATE INDEX idx_patterns_pair ON patterns (pair_id);
CREATE INDEX idx_patterns_category ON patterns (category_id);
CREATE INDEX idx_lessons_module ON lessons (module_id);
CREATE INDEX idx_exercises_lesson ON exercises (lesson_id);
CREATE INDEX idx_vocabulary_pair_level ON vocabulary (pair_id, level);
CREATE INDEX idx_mnemonics_pair ON mnemonics (pair_id);
CREATE INDEX idx_xp_transactions_user ON xp_transactions (user_id, created_at);
CREATE INDEX idx_exercise_results_user ON exercise_results (user_id, completed_at);
CREATE INDEX idx_error_patterns_user ON error_patterns (user_id, pair_id);
CREATE INDEX idx_pattern_mastery_user ON pattern_mastery (user_id);

-- ============================================================
-- ERD (Mermaid)
-- ============================================================

/*
erDiagram
    users ||--o{ user_language_pairs : "learns"
    users ||--|| user_xp : "has"
    users ||--|| user_streaks : "has"
    users ||--o{ user_achievements : "earns"
    users ||--o{ review_cards : "reviews"
    users ||--o{ user_progress : "tracks"
    users ||--o{ exercise_results : "completes"
    users ||--o{ error_patterns : "struggles with"

    language_pairs ||--o{ patterns : "contains"
    language_pairs ||--o{ modules : "organizes"
    language_pairs ||--o{ vocabulary : "includes"
    language_pairs ||--o{ false_friends : "warns about"
    language_pairs ||--o{ cognate_rules : "maps"

    patterns ||--o{ pattern_examples : "demonstrates"
    patterns ||--o{ mnemonics : "aided by"

    modules ||--o{ lessons : "contains"
    lessons ||--o{ exercises : "includes"
    lessons }o--o{ patterns : "teaches"
    lessons }o--o{ vocabulary : "introduces"

    leagues ||--o{ league_members : "groups"
*/
