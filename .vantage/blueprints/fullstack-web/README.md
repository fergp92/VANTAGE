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

# 5. Start development (API + frontend)
npm run dev
```

Frontend: `http://localhost:5173`
API: `http://localhost:3000/api`
Swagger: `http://localhost:3000/docs`

## Architecture

```
client/                 # React + Vite frontend
├── src/
│   ├── components/     # Reusable UI components (shadcn/ui)
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom hooks
│   ├── lib/            # API client, utilities
│   ├── providers/      # Context providers (auth, theme)
│   └── routes/         # Route definitions

server/                 # Fastify API backend
├── src/
│   ├── domain/         # Entities, value objects, repository interfaces
│   ├── application/    # Use cases, DTOs
│   ├── infrastructure/ # Database, auth, external services
│   ├── routes/         # HTTP route handlers
│   └── plugins/        # Fastify plugins
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + frontend concurrently |
| `npm run dev:api` | Start API only |
| `npm run dev:client` | Start frontend only |
| `npm run build` | Build both API and frontend |
| `npm test` | Run all tests |
| `npm run db:migrate` | Run database migrations |
| `npm run lint` | Lint all code |

## Team

| Agent | Role |
|-------|------|
| 00 - Orchestrator | Project coordination |
| 02 - Requirements | FR/NFR specs |
| 04 - Enterprise Architect | Solution architecture |
| 05 - Data Architect | Database design |
| 06 - Integration Architect | API contracts |
| 08 - Security Architect | Security review (veto) |
| 09 - IAM | Auth system |
| 12 - Domain Logic | Business rules |
| 13 - App Services | Use cases |
| 14 - Adapters | Infrastructure |
| 15 - Frontend Architect | Client architecture |
| 16 - UI Builder | Components |
| 17 - Test Architect | Test strategy |
| 18 - Test Implementation | Tests |
| 19 - Code Review | Quality |
| 27 - Spec Writer | Specifications |
| 28 - Backlog Manager | Task tracking |

## License

{{LICENSE}}
