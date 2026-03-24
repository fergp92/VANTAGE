---
id: 2
title: "Epic: Resource CRUD Operations"
status: Backlog
assignee: 12-domain-logic
reporter: 27-spec-writer
created_date: "{{CREATED_DATE}}"
completed_date: null
labels: [epic, feature, backend]
milestone: v0.1.0
priority: high
phase: 4-implementation
spec_ref: specs/openapi.yaml#/paths/~1resources
depends_on: [1]
sprint: null
---

## Description

Implement full CRUD operations for the main resource entity. Includes pagination, sorting, ownership validation, and audit logging.

## Stories

### CRUD-001: Create Resource
- **Spec**: `POST /resources`
- **Acceptance Criteria**:
  - [ ] Requires authenticated user
  - [ ] Validates required fields (name)
  - [ ] Sets created_by to authenticated user ID
  - [ ] Returns 201 with created resource
  - [ ] Creates audit log entry

### CRUD-002: List Resources
- **Spec**: `GET /resources`
- **Acceptance Criteria**:
  - [ ] Requires authenticated user
  - [ ] Supports pagination (page, limit)
  - [ ] Supports sorting (sort, order)
  - [ ] Returns paginated response with meta (page, limit, total, totalPages)
  - [ ] Default: page=1, limit=20, sort=created_at, order=desc
  - [ ] Maximum limit: 100

### CRUD-003: Get Resource by ID
- **Spec**: `GET /resources/{id}`
- **Acceptance Criteria**:
  - [ ] Requires authenticated user
  - [ ] Validates UUID format
  - [ ] Returns 200 with resource
  - [ ] Returns 404 if not found

### CRUD-004: Update Resource
- **Spec**: `PUT /resources/{id}`
- **Acceptance Criteria**:
  - [ ] Requires authenticated user
  - [ ] Only owner can update (created_by match)
  - [ ] Partial update supported (only provided fields)
  - [ ] Returns 200 with updated resource
  - [ ] Returns 404 if not found
  - [ ] Returns 403 if not owner
  - [ ] Creates audit log entry with old/new values

### CRUD-005: Delete Resource
- **Spec**: `DELETE /resources/{id}`
- **Acceptance Criteria**:
  - [ ] Requires authenticated user
  - [ ] Only owner can delete
  - [ ] Returns 204 on success
  - [ ] Returns 404 if not found
  - [ ] Returns 403 if not owner
  - [ ] Creates audit log entry

### CRUD-006: Input Validation & Error Handling
- **Acceptance Criteria**:
  - [ ] All inputs validated with JSON schema
  - [ ] Consistent error response format (statusCode, error, message)
  - [ ] SQL injection prevented (parameterized queries only)
  - [ ] XSS prevented (output encoding)

## Definition of Done
- [ ] All stories pass acceptance criteria
- [ ] Unit tests: 90%+ coverage on resource domain
- [ ] Integration tests: full CRUD cycle
- [ ] Security review by Agent 08
- [ ] API matches OpenAPI spec (contract tests)
- [ ] Pagination tested with edge cases (empty, single page, multi-page)
