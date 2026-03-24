---
id: 2
title: "Epic: UI Shell & Navigation"
status: Backlog
assignee: 15-frontend-architect
reporter: 27-spec-writer
created_date: "{{CREATED_DATE}}"
completed_date: null
labels: [epic, frontend, ui]
milestone: v0.1.0
priority: high
phase: 4-implementation
spec_ref: specs/wireframes.md
depends_on: []
sprint: null
---

## Description

Build the application shell: layout components, sidebar navigation, header, routing, and responsive design. This is the structural foundation for all pages.

## Stories

### SHELL-001: App Layout
- Implement AppShell with sidebar + header + main content area
- See `specs/wireframes.md` section 3 (Dashboard)
- Responsive: sidebar collapses on mobile

### SHELL-002: Sidebar Navigation
- Navigation links with active state highlighting
- Collapsible on mobile (hamburger menu)
- Icons + labels for each nav item

### SHELL-003: Header
- Logo/app name (left)
- User avatar dropdown (right): Profile, Settings, Logout
- Breadcrumbs (optional)

### SHELL-004: Routing Setup
- React Router v6 with layout routes
- Public routes: /login, /register
- Protected routes: /dashboard, /resources, /resources/:id, /settings
- 404 page

### SHELL-005: Theme & Base Styles
- Tailwind CSS configuration
- shadcn/ui component installation
- Light/dark mode toggle (CSS variables)
- Typography scale, color palette

## Definition of Done
- [ ] Layout matches wireframes
- [ ] Responsive at all breakpoints (mobile, tablet, desktop)
- [ ] Navigation works with React Router
- [ ] Dark mode toggles correctly
- [ ] Accessibility: keyboard navigation, focus management
- [ ] Component specs from `specs/ui-components.md` implemented
