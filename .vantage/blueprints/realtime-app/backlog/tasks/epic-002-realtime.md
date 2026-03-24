---
id: 2
title: "Epic: Real-Time Communication"
status: Backlog
assignee: 06-integration-architect
reporter: 27-spec-writer
created_date: "{{CREATED_DATE}}"
completed_date: null
labels: [epic, feature, realtime, fullstack]
milestone: v0.1.0
priority: high
phase: 4-implementation
spec_ref: specs/ws-events.json
depends_on: [1]
sprint: null
---

## Description

Core real-time functionality: WebSocket server, room management, messaging, presence, and typing indicators. Uses Redis for pub/sub across server instances.

## Stories

### RT-001: WebSocket Server Setup
- **Acceptance Criteria**:
  - [ ] Fastify WebSocket plugin configured
  - [ ] Connection lifecycle: connect, authenticate, heartbeat, disconnect
  - [ ] Heartbeat ping/pong every 30s, timeout at 10s
  - [ ] Graceful disconnect handling
  - [ ] Connection count exposed in /health endpoint

### RT-002: Room Management
- **Spec**: `specs/ws-events.json` -> room:join, room:leave
- **Acceptance Criteria**:
  - [ ] Users can join rooms via `room:join` event
  - [ ] Server confirms with `room:joined` + member list
  - [ ] Users can leave rooms via `room:leave` event
  - [ ] Room membership tracked in database
  - [ ] REST endpoints for creating/listing rooms

### RT-003: Messaging
- **Spec**: `specs/ws-events.json` -> message:send, message:new
- **Acceptance Criteria**:
  - [ ] Client sends `message:send` with roomId + content
  - [ ] Server persists to PostgreSQL
  - [ ] Server broadcasts `message:new` to all room members
  - [ ] Sender receives `message:sent` confirmation with ID
  - [ ] Message types: text, system, image
  - [ ] Max message length: 4096 chars
  - [ ] Rate limiting: 10 messages/second per user

### RT-004: Message History
- **Spec**: `specs/openapi.yaml` -> /rooms/{roomId}/messages
- **Acceptance Criteria**:
  - [ ] REST endpoint for paginated message history
  - [ ] Cursor-based pagination (before param)
  - [ ] Default 50, max 100 messages per request
  - [ ] Messages ordered by created_at DESC

### RT-005: Presence System
- **Spec**: `specs/ws-events.json` -> user:online, user:offline
- **Acceptance Criteria**:
  - [ ] Track online users in Redis
  - [ ] Broadcast `user:online` when user connects
  - [ ] Broadcast `user:offline` when user disconnects
  - [ ] Handle reconnection (brief offline->online)
  - [ ] Update `users.is_online` and `users.last_seen`

### RT-006: Typing Indicators
- **Spec**: `specs/ws-events.json` -> typing:start, typing:stop
- **Acceptance Criteria**:
  - [ ] Client sends `typing:start` / `typing:stop`
  - [ ] Server broadcasts `typing:update` to room members
  - [ ] Auto-expire typing after 5 seconds of inactivity
  - [ ] Don't persist to database (ephemeral via Redis)

### RT-007: Redis Pub/Sub
- **Acceptance Criteria**:
  - [ ] All room messages published to Redis channels
  - [ ] All server instances subscribe to relevant channels
  - [ ] Presence data stored in Redis sets
  - [ ] Typing indicators managed in Redis with TTL
  - [ ] Graceful Redis disconnection handling

### RT-008: Frontend WebSocket Client
- **Acceptance Criteria**:
  - [ ] WebSocket connection manager with auto-reconnect
  - [ ] Exponential backoff (1s initial, 30s max, 10 attempts)
  - [ ] React context/hook for WebSocket state
  - [ ] Message queue for offline messages
  - [ ] Visual indicators: connected, reconnecting, disconnected

## Definition of Done
- [ ] All WS events match `specs/ws-events.json`
- [ ] Messages persist and load from history
- [ ] Presence updates in real-time
- [ ] Typing indicators work across clients
- [ ] Handles 100+ concurrent connections
- [ ] Redis failure degrades gracefully
- [ ] Security review by Agent 08
