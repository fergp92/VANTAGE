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

# 3. Start infrastructure
docker compose up -d postgres redis

# 4. Run migrations
npm run db:migrate

# 5. Start development (API + WS + frontend)
npm run dev
```

Frontend: `http://localhost:5173`
REST API: `http://localhost:3000/api`
WebSocket: `ws://localhost:3001/ws`

## Architecture

```
client/                 # React + Vite frontend
├── src/
│   ├── components/     # UI components (shadcn/ui)
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom hooks (useWebSocket, useRoom, etc.)
│   ├── lib/            # API client, WS client
│   └── providers/      # Auth, WebSocket, Theme contexts

server/                 # Fastify backend
├── src/
│   ├── domain/         # Entities (User, Room, Message)
│   ├── application/    # Use cases
│   ├── infrastructure/
│   │   ├── database/   # PostgreSQL repos
│   │   ├── redis/      # Redis pub/sub, presence
│   │   ├── ws/         # WebSocket server, event handlers
│   │   └── http/       # REST routes
│   └── plugins/        # Fastify plugins
```

**Key patterns**:
- REST for CRUD operations and history
- WebSocket for real-time events
- Redis pub/sub for multi-instance broadcasting
- Redis for ephemeral data (presence, typing)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + WS + frontend |
| `npm run dev:api` | Start API + WS server |
| `npm run dev:client` | Start frontend |
| `npm run build` | Build everything |
| `npm test` | Run all tests |
| `npm run db:migrate` | Run migrations |
| `npm run lint` | Lint code |

## Specs

| Spec | Description |
|------|-------------|
| `specs/openapi.yaml` | REST API endpoints |
| `specs/ws-events.json` | WebSocket event definitions |
| `specs/db-schema.sql` | Database schema |

## Team

| Agent | Role |
|-------|------|
| 00 - Orchestrator | Project coordination |
| 02 - Requirements | FR/NFR specs |
| 04 - Enterprise Architect | Solution architecture |
| 05 - Data Architect | Database design |
| 06 - Integration Architect | API + WS contracts |
| 07 - Infrastructure | Redis, Docker, networking |
| 08 - Security Architect | Security review (veto) |
| 09 - IAM | Auth for REST + WS |
| 12 - Domain Logic | Business rules |
| 13 - App Services | Use cases |
| 14 - Adapters | Infrastructure layer |
| 15 - Frontend Architect | Client architecture |
| 16 - UI Builder | Components |
| 17 - Test Architect | Test strategy |
| 18 - Test Implementation | Tests |
| 27 - Spec Writer | Specifications |
| 28 - Backlog Manager | Task tracking |

## License

{{LICENSE}}
