---
id: 3
title: "Epic: Resource CRUD Features"
status: Backlog
assignee: 12-domain-logic
reporter: 27-spec-writer
created_date: "{{CREATED_DATE}}"
completed_date: null
labels: [epic, feature, fullstack]
milestone: v0.1.0
priority: high
phase: 4-implementation
spec_ref: specs/openapi.yaml#/paths/~1resources
depends_on: [1, 2]
sprint: null
---

## Description

Full CRUD implementation for the main resource entity. Backend API + frontend pages with list, detail, create, edit, and delete functionality.

## Stories

### FEAT-001: Backend CRUD Endpoints
- Create, Read, Update, Delete, List with pagination
- See `specs/openapi.yaml` /resources paths
- Ownership validation (only creator can edit/delete)
- Audit logging

### FEAT-002: List Page (Frontend)
- DataTable with pagination and sorting
- Search bar with debounced filtering
- "Create" button
- Edit/Delete action buttons per row
- Empty state when no resources
- Loading skeletons
- See `specs/wireframes.md` section 4

### FEAT-003: Create Resource
- Modal or dedicated page with form
- Form validation with zod
- Success: redirect to list with toast notification
- Error: inline error messages

### FEAT-004: Detail / Edit Page
- Display resource details
- Inline editing
- Save/Cancel buttons
- Confirmation before discarding unsaved changes
- See `specs/wireframes.md` section 5

### FEAT-005: Delete Confirmation
- Confirmation dialog before delete
- Success: remove from list, toast notification
- Optimistic UI update with rollback on error

### FEAT-006: API Client Layer
- Typed API client (fetch or axios)
- Request/response interceptors for auth tokens
- Error handling with user-friendly messages
- Loading state management (React Query or SWR)

## Definition of Done
- [ ] All CRUD operations work end-to-end
- [ ] Frontend matches wireframes
- [ ] Form validation on both client and server
- [ ] Pagination tested with edge cases
- [ ] Optimistic updates where appropriate
- [ ] Error states handled gracefully
- [ ] Security review by Agent 08
