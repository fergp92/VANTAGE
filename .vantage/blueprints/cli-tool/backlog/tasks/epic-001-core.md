---
id: 1
title: "Epic: Core CLI Commands"
status: Backlog
assignee: 12-domain-logic
reporter: 27-spec-writer
created_date: "{{CREATED_DATE}}"
completed_date: null
labels: [epic, feature, cli]
milestone: v0.1.0
priority: high
phase: 4-implementation
spec_ref: specs/cli-commands.md
depends_on: []
sprint: null
---

## Description

Implement the core CLI commands: `init`, `run`, and global options. This is the foundational epic for the CLI tool.

## Stories

### CLI-001: Project Setup
- **Acceptance Criteria**:
  - [ ] Commander.js configured with program name and version
  - [ ] Global options registered (--no-color, --quiet, --debug)
  - [ ] Help text auto-generated
  - [ ] Version flag works
  - [ ] Entry point with proper shebang (`#!/usr/bin/env node`)

### CLI-002: Init Command
- **Spec**: `specs/cli-commands.md` -> init
- **Acceptance Criteria**:
  - [ ] Creates config file in target directory
  - [ ] Interactive mode prompts for values
  - [ ] Template selection works
  - [ ] --force overwrites existing config
  - [ ] Validation: target directory exists or is created

### CLI-003: Run Command
- **Spec**: `specs/cli-commands.md` -> run
- **Acceptance Criteria**:
  - [ ] Loads config from default or specified path
  - [ ] --dry-run previews without applying changes
  - [ ] --verbose enables detailed output
  - [ ] Progress indicators for long operations
  - [ ] Graceful error handling with helpful messages

### CLI-004: Output Formatting
- **Acceptance Criteria**:
  - [ ] Chalk-based colored output (respects --no-color)
  - [ ] Spinner for async operations
  - [ ] Table output for structured data
  - [ ] JSON output option for scripting

### CLI-005: Error Handling
- **Acceptance Criteria**:
  - [ ] Consistent exit codes per spec
  - [ ] User-friendly error messages
  - [ ] Stack traces only in --debug mode
  - [ ] Ctrl+C handled gracefully (exit code 130)

## Definition of Done
- [ ] All commands match spec in `specs/cli-commands.md`
- [ ] Unit tests for command handlers
- [ ] Integration tests: full command flow
- [ ] Help text is clear and accurate
- [ ] Works on macOS, Linux, and Windows
