---
id: 2
title: "Epic: Configuration Management"
status: Backlog
assignee: 12-domain-logic
reporter: 27-spec-writer
created_date: "{{CREATED_DATE}}"
completed_date: null
labels: [epic, feature, cli]
milestone: v0.1.0
priority: medium
phase: 4-implementation
spec_ref: specs/cli-commands.md#config
depends_on: [1]
sprint: null
---

## Description

Configuration management system: read/write config files, support global vs project config, validation, and the `config` subcommands.

## Stories

### CFG-001: Config File Loading
- **Acceptance Criteria**:
  - [ ] YAML config file parsing
  - [ ] Project config (./config.yml) takes precedence over global (~/.{{CLI_NAME}}/config.yml)
  - [ ] Environment variables override config file values
  - [ ] Missing config handled gracefully (use defaults)

### CFG-002: Config Show Command
- **Spec**: `specs/cli-commands.md` -> config show
- **Acceptance Criteria**:
  - [ ] Displays all current config values
  - [ ] Shows source of each value (default, file, env)
  - [ ] Supports --global flag
  - [ ] Output in readable format (or JSON with --json)

### CFG-003: Config Set Command
- **Spec**: `specs/cli-commands.md` -> config set
- **Acceptance Criteria**:
  - [ ] Sets key-value pairs in config file
  - [ ] Validates keys against schema
  - [ ] Supports nested keys (dot notation: `output.format`)
  - [ ] Creates config file if it doesn't exist

### CFG-004: Config Reset Command
- **Spec**: `specs/cli-commands.md` -> config reset
- **Acceptance Criteria**:
  - [ ] Resets all config to defaults
  - [ ] Confirmation prompt before reset
  - [ ] Supports --global flag

### CFG-005: Config Validation
- **Acceptance Criteria**:
  - [ ] Schema-based validation for all config values
  - [ ] Clear error messages for invalid values
  - [ ] Type coercion where safe (string "true" -> boolean)

## Definition of Done
- [ ] Config commands match spec
- [ ] Unit tests for config parsing/validation
- [ ] Integration tests: set -> show -> reset cycle
- [ ] Cross-platform path handling (Windows vs Unix)
