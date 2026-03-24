# {{PROJECT_NAME}} — CLI Command Spec

> Define all commands here before implementation. Each command follows this format.

---

## Command Format

```yaml
command: <name>
description: <what it does>
usage: {{PROJECT_NAME}} <name> [options] [arguments]
arguments:
  - name: <arg>
    description: <what it is>
    required: true|false
options:
  - flag: --option, -o
    description: <what it does>
    type: string|boolean|number
    default: <value>
examples:
  - description: <what this example does>
    command: {{PROJECT_NAME}} <name> --option value
```

---

## Commands

### init

```yaml
command: init
description: Initialize a new project configuration
usage: "{{CLI_NAME}} init [directory]"
arguments:
  - name: directory
    description: Target directory (defaults to current)
    required: false
options:
  - flag: --template, -t
    description: Template to use
    type: string
    default: default
  - flag: --force, -f
    description: Overwrite existing configuration
    type: boolean
    default: false
  - flag: --interactive, -i
    description: Run in interactive mode with prompts
    type: boolean
    default: true
examples:
  - description: Initialize in current directory
    command: "{{CLI_NAME}} init"
  - description: Initialize with a specific template
    command: "{{CLI_NAME}} init --template minimal"
  - description: Initialize in a subdirectory
    command: "{{CLI_NAME}} init ./my-project"
```

### run

```yaml
command: run
description: Execute the main operation
usage: "{{CLI_NAME}} run [options]"
arguments: []
options:
  - flag: --config, -c
    description: Path to config file
    type: string
    default: ./config.yml
  - flag: --dry-run
    description: Preview changes without applying
    type: boolean
    default: false
  - flag: --verbose, -v
    description: Enable verbose output
    type: boolean
    default: false
examples:
  - description: Run with default config
    command: "{{CLI_NAME}} run"
  - description: Dry run with verbose output
    command: "{{CLI_NAME}} run --dry-run --verbose"
  - description: Run with custom config
    command: "{{CLI_NAME}} run -c ./custom-config.yml"
```

### config

```yaml
command: config
description: Manage configuration
usage: "{{CLI_NAME}} config <subcommand>"
subcommands:
  - name: show
    description: Display current configuration
  - name: set
    description: Set a configuration value
    arguments:
      - name: key
        required: true
      - name: value
        required: true
  - name: reset
    description: Reset to defaults
options:
  - flag: --global, -g
    description: Use global config instead of project
    type: boolean
    default: false
examples:
  - description: Show current config
    command: "{{CLI_NAME}} config show"
  - description: Set a value
    command: "{{CLI_NAME}} config set output.format json"
  - description: Reset to defaults
    command: "{{CLI_NAME}} config reset"
```

### version

```yaml
command: --version, -V
description: Display CLI version
usage: "{{CLI_NAME}} --version"
```

### help

```yaml
command: --help, -h
description: Display help for a command
usage: "{{CLI_NAME}} [command] --help"
```

---

## Global Options

| Flag | Description | Default |
|------|-------------|---------|
| `--no-color` | Disable colored output | false |
| `--quiet, -q` | Suppress non-essential output | false |
| `--debug` | Enable debug logging | false |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Configuration error |
| 4 | File not found |
| 130 | Interrupted (Ctrl+C) |
