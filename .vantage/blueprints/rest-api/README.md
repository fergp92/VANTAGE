# {{PROJECT_NAME}}

> {{DESCRIPTION}}

Built with [VANTAGE v2.1](https://github.com/your-org/vantage) — Spec-Driven Development Framework

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your values

# 3. Start database
docker compose up -d postgres

# 4. Run migrations
npm run db:migrate

# 5. Start development server
npm run dev
```

## Architecture

```
src/
├── domain/           # Entities, value objects, repository interfaces
│   ├── user/
│   └── resource/
├── application/      # Use cases, DTOs, application services
│   ├── auth/
│   └── resource/
├── infrastructure/   # Database, external services, framework adapters
│   ├── database/
│   ├── auth/
│   └── http/
├── plugins/          # Fastify plugins (auth, cors, rate-limit)
├── routes/           # Route definitions (thin — delegates to use cases)
└── index.ts          # Entry point
```

**Clean Architecture**: Dependencies point inward. Domain has zero external dependencies.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run lint` | Lint code |

## API Documentation

- OpenAPI spec: `specs/openapi.yaml`
- Swagger UI: `http://localhost:3000/docs` (dev only)

## Team

| Agent | Role |
|-------|------|
| 00 - Orchestrator | Project coordination |
| 02 - Requirements Architect | FR/NFR specification |
| 05 - Data Architect | Database design |
| 06 - Integration Architect | API contracts |
| 08 - Security Architect | Security review (veto) |
| 09 - IAM | Authentication/authorization |
| 12 - Domain Logic | Business rules |
| 13 - App Services | Use case orchestration |
| 14 - Adapters | Infrastructure layer |
| 17 - Test Architect | Test strategy |
| 18 - Test Implementation | Test execution |
| 19 - Code Review | Quality assurance |
| 27 - Spec Writer | Specifications |
| 28 - Backlog Manager | Task tracking |

## License

{{LICENSE}}
