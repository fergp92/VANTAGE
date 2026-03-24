# {{PROJECT_NAME}}

> {{DESCRIPTION}}

Built with [VANTAGE v2.1](https://github.com/your-org/vantage) — Spec-Driven Development Framework

## Quick Start

```bash
# Install globally
npm install -g {{PACKAGE_NAME}}

# Or run with npx
npx {{PACKAGE_NAME}} --help

# Initialize a project
{{CLI_NAME}} init

# Run the tool
{{CLI_NAME}} run
```

## Architecture

```
src/
├── commands/        # Command handlers (one file per command)
│   ├── init.ts
│   ├── run.ts
│   └── config.ts
├── domain/          # Core logic (framework-independent)
│   ├── config/
│   └── operations/
├── infrastructure/  # File I/O, external services
│   ├── config-loader.ts
│   └── file-system.ts
├── lib/             # Utilities (output, validation)
│   ├── output.ts
│   └── errors.ts
└── index.ts         # Entry point + Commander setup
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in development mode |
| `npm run build` | Compile TypeScript |
| `npm test` | Run all tests |
| `npm run lint` | Lint code |
| `npm link` | Link for local development |

## Commands

See `specs/cli-commands.md` for full command documentation.

| Command | Description |
|---------|-------------|
| `init` | Initialize project configuration |
| `run` | Execute main operation |
| `config show` | Display current configuration |
| `config set` | Set a configuration value |
| `config reset` | Reset to defaults |

## Team

| Agent | Role |
|-------|------|
| 00 - Orchestrator | Project coordination |
| 02 - Requirements | Specifications |
| 08 - Security Architect | Security review (veto) |
| 12 - Domain Logic | Core logic |
| 17 - Test Architect | Test strategy |
| 18 - Test Implementation | Tests |
| 23 - Documentation | Docs & README |
| 27 - Spec Writer | Command specs |
| 28 - Backlog Manager | Task tracking |

## License

{{LICENSE}}
