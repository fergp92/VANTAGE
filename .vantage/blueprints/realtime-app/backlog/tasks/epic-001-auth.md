---
id: 1
title: "Epic: Authentication System"
status: Backlog
assignee: 09-iam
reporter: 27-spec-writer
created_date: "{{CREATED_DATE}}"
completed_date: null
labels: [epic, security, auth, fullstack]
milestone: v0.1.0
priority: high
phase: 4-implementation
spec_ref: specs/openapi.yaml#/paths/~1auth
depends_on: []
sprint: null
---

## Description

Authentication system for both REST API and WebSocket connections. JWT tokens are used for REST auth and passed as query parameters for WebSocket connection establishment.

## Stories

### AUTH-001: Backend Auth Endpoints
- Register, login, logout
- See `specs/openapi.yaml` auth paths

### AUTH-002: Frontend Auth Pages
- Login and register pages
- Token management in memory

### AUTH-003: WebSocket Auth
- **Acceptance Criteria**:
  - [ ] JWT token passed as query param on WS connect
  - [ ] Server validates token before upgrading connection
  - [ ] Expired token triggers `AUTH_EXPIRED` error event
  - [ ] Client auto-reconnects with refreshed token
  - [ ] Unauthenticated connections rejected immediately

### AUTH-004: Protected Routes
- Route guard for authenticated pages
- Redirect to login on 401

## Definition of Done
- [ ] REST auth flow works end-to-end
- [ ] WebSocket auth validated
- [ ] Token refresh works transparently
- [ ] Security review by Agent 08
