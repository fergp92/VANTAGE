# VANTAGE — Spec Templates

> Templates for all specification types produced by Agent 27 (Spec Writer) during Phase 1.

---

## 1. API Specification (OpenAPI 3.1)

```yaml
openapi: 3.1.0
info:
  title: "[Project Name] API"
  version: "1.0.0"
  description: |
    [One paragraph describing the API purpose]
  contact:
    name: "[Team/Owner]"

servers:
  - url: http://localhost:{port}/api/v1
    description: Local development
    variables:
      port:
        default: "3000"
  - url: https://api.example.com/v1
    description: Production

security:
  - bearerAuth: []

paths:
  /resource:
    get:
      operationId: listResources
      summary: List all resources
      tags: [Resources]
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/Resource"
                  total:
                    type: integer
        "401":
          $ref: "#/components/responses/Unauthorized"

    post:
      operationId: createResource
      summary: Create a new resource
      tags: [Resources]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateResourceRequest"
      responses:
        "201":
          description: Resource created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Resource"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"

  /resource/{id}:
    get:
      operationId: getResource
      summary: Get a resource by ID
      tags: [Resources]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Resource"
        "404":
          $ref: "#/components/responses/NotFound"

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    cookieAuth:
      type: apiKey
      in: cookie
      name: session

  schemas:
    Resource:
      type: object
      required: [id, name, created_at]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          minLength: 1
          maxLength: 255
        description:
          type: string
          nullable: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    CreateResourceRequest:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
        description:
          type: string

    Error:
      type: object
      required: [error]
      properties:
        error:
          type: string
        details:
          type: object

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
```

---

## 2. WebSocket Events (JSON)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "[Project Name] WebSocket Events",
  "version": "1.0.0",
  "description": "WebSocket event contracts",
  "events": {
    "client_to_server": {
      "join_room": {
        "description": "Client requests to join a room",
        "payload": {
          "type": "object",
          "required": ["room_id"],
          "properties": {
            "room_id": { "type": "string" },
            "token": { "type": "string" }
          }
        },
        "response_events": ["room_joined", "error"]
      }
    },
    "server_to_client": {
      "room_joined": {
        "description": "Confirmation that client joined the room",
        "payload": {
          "type": "object",
          "required": ["room_id", "members"],
          "properties": {
            "room_id": { "type": "string" },
            "members": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": { "type": "string" },
                  "name": { "type": "string" }
                }
              }
            }
          }
        }
      },
      "error": {
        "description": "Error notification",
        "payload": {
          "type": "object",
          "required": ["code", "message"],
          "properties": {
            "code": { "type": "string" },
            "message": { "type": "string" }
          }
        }
      }
    },
    "bidirectional": {}
  },
  "sequences": {
    "join_flow": {
      "description": "Complete room join sequence",
      "steps": [
        { "direction": "client_to_server", "event": "join_room" },
        { "direction": "server_to_client", "event": "room_joined" },
        { "direction": "server_to_client", "event": "member_joined", "to": "other_members" }
      ]
    }
  }
}
```

---

## 3. Database Schema (SQL)

```sql
-- =============================================================================
-- [Project Name] Database Schema
-- Version: 1.0.0
-- Spec: specs/db-schema.sql
-- Generated by: Agent 27 (Spec Writer)
-- =============================================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLE: users
-- Classification: CONFIDENTIAL (contains PII)
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    -- Auth fields
    oauth_provider VARCHAR(50),
    oauth_subject VARCHAR(255),
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,  -- Soft delete

    CONSTRAINT uq_oauth UNIQUE (oauth_provider, oauth_subject)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_subject);

-- =============================================================================
-- TABLE: [next table]
-- Classification: [PUBLIC|INTERNAL|CONFIDENTIAL|RESTRICTED]
-- =============================================================================

-- COMMENTS (for data dictionary)
COMMENT ON TABLE users IS 'User accounts (soft-deletable)';
COMMENT ON COLUMN users.id IS 'Primary key (UUID v4)';
COMMENT ON COLUMN users.email IS 'User email (PII - encrypted at rest)';
```

---

## 4. Entity Relationship Diagram (Mermaid)

````markdown
# Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar display_name
        text avatar_url
        varchar oauth_provider
        varchar oauth_subject
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    SESSIONS {
        uuid id PK
        uuid user_id FK
        varchar status
        jsonb settings
        timestamptz created_at
        timestamptz ended_at
    }

    USERS ||--o{ SESSIONS : "has many"
```

## Data Classification

| Table | Classification | PII Fields | Encryption |
|-------|---------------|------------|------------|
| users | CONFIDENTIAL | email | AES-256-GCM at rest |
| sessions | INTERNAL | - | None |
````

---

## 5. Domain Model (Mermaid)

````markdown
# Domain Model

```mermaid
classDiagram
    class User {
        +UUID id
        +Email email
        +String displayName
        +create(email, name) User
        +updateProfile(name, avatar) void
        +deactivate() void
    }

    class Session {
        +UUID id
        +SessionStatus status
        +start(userId, settings) Session
        +end(scores) void
        +isActive() bool
    }

    class SessionStatus {
        <<enumeration>>
        ACTIVE
        COMPLETED
        ABANDONED
    }

    User "1" --> "*" Session : creates
    Session --> SessionStatus : has
```

## Invariants
1. A User can only have ONE active Session at a time
2. A Session cannot transition from COMPLETED back to ACTIVE
3. Email must be valid and unique across all non-deleted users
````

---

## 6. UI Wireframes (Markdown)

```markdown
# UI Wireframes

## Screen Flow

```
Landing → Login → Dashboard → [Feature A] → [Feature B]
                      ↓
                  Settings
```

## Screen: Landing
```
┌──────────────────────────────┐
│         LOGO / TITLE         │
│                              │
│    [  Login with Google  ]   │
│    [  Login with GitHub  ]   │
│                              │
│    Continue as Guest →       │
│                              │
│     ─── or ───               │
│                              │
│    [  Email    ___________]  │
│    [  Password ___________]  │
│    [       Sign In       ]   │
│                              │
│    Don't have an account?    │
│    Sign up →                 │
└──────────────────────────────┘
```

### Components
- `<AuthButtons />` — OAuth provider buttons
- `<LoginForm />` — Email/password form
- `<GuestLink />` — Continue without account

### States
- Default: Show login options
- Loading: Spinner on button after click
- Error: Red banner with error message

### Responsive
- Mobile: Stack vertically, full-width buttons
- Desktop: Center card (max-width: 400px)
```

---

## 7. State Machines (Mermaid)

````markdown
# State Machines

## Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created : start()
    Created --> Active : initialize()
    Active --> Paused : pause()
    Paused --> Active : resume()
    Active --> Completed : end(scores)
    Paused --> Abandoned : timeout(30min)
    Active --> Abandoned : timeout(2hr)
    Completed --> [*]
    Abandoned --> [*]
```

## Transition Rules

| From | To | Guard | Side Effect |
|------|----|-------|-------------|
| Created → Active | Always | Notify participants |
| Active → Paused | User initiated | Save state |
| Paused → Active | User initiated | Restore state |
| Active → Completed | All tasks done | Calculate scores, archive |
| * → Abandoned | Timeout | Notify, cleanup resources |
````

---

## 8. Environment Configuration (YAML)

```yaml
# Environment Configuration Template
# Spec: specs/env-template.yaml
# Copy to .env and fill in values

# =============================================================================
# APPLICATION
# =============================================================================
NODE_ENV: development          # development | staging | production
PORT: 3000                     # API server port
HOST: "0.0.0.0"               # Bind address
LOG_LEVEL: info                # debug | info | warn | error

# =============================================================================
# DATABASE
# =============================================================================
DATABASE_URL: ""               # postgresql://user:pass@host:5432/dbname
DB_POOL_MIN: 2                 # Minimum connection pool size
DB_POOL_MAX: 10                # Maximum connection pool size

# =============================================================================
# AUTHENTICATION (Secrets — fill from vault)
# =============================================================================
JWT_SECRET: ""                 # REQUIRED — 256-bit random
SESSION_SECRET: ""             # REQUIRED — 256-bit random
OAUTH_CLIENT_ID: ""            # OAuth provider client ID
OAUTH_CLIENT_SECRET: ""        # OAuth provider client secret
OAUTH_REDIRECT_URI: ""         # Callback URL

# =============================================================================
# EXTERNAL SERVICES
# =============================================================================
REDIS_URL: ""                  # redis://host:6379
SMTP_HOST: ""                  # Email server
SMTP_PORT: 587
```

---

## 9. Test Plan (Markdown)

```markdown
# Test Plan

## Coverage Targets

| Layer | Target | Tool |
|-------|--------|------|
| Domain Logic | 90%+ | vitest / jest |
| Application Services | 80%+ | vitest / jest |
| API Integration | 100% of endpoints | supertest |
| WebSocket Events | 100% of events | ws + vitest |
| E2E Critical Paths | Top 5 user flows | Playwright |
| Security | OWASP Top 10 | SAST + manual |
| Performance | SLA validation | k6 |

## Test Categories

### Unit Tests
- Pure domain logic (entities, value objects, use cases)
- No external dependencies (DB, network, filesystem)
- Run in <10 seconds total

### Integration Tests
- API endpoint tests (HTTP request → response)
- Database integration (real DB, transactions rolled back)
- WebSocket event flow tests
- Run in <60 seconds total

### E2E Tests
- Critical user journeys:
  1. Sign up → Login → Dashboard
  2. [Primary feature flow]
  3. [Secondary feature flow]
  4. Error handling flows
  5. Guest/anonymous flows
- Run against full stack (Docker Compose)

### Security Tests
- Authentication bypass attempts
- Authorization escalation
- Input injection (SQL, XSS, command)
- CSRF/SSRF validation
- Rate limiting verification

### Performance Tests
- Load test: [N] concurrent users for [M] minutes
- Stress test: ramp to breaking point
- Soak test: sustained load for 1 hour

## Test Data
- Seed scripts: `scripts/seed/`
- Fixtures: `tests/fixtures/`
- Factory functions: `tests/helpers/factories.js`
```
