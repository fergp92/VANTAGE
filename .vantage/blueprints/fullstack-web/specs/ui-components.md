# {{PROJECT_NAME}} — UI Component Spec

> Component library based on shadcn/ui + Tailwind CSS + CVA.
> Reference: `Arch standard/ui-kit-standard.md`

---

## Base Components

### Button

```
Variants: default | destructive | outline | secondary | ghost | link
Sizes: sm | default | lg | icon
Props: variant, size, disabled, loading, asChild
```

- Loading state shows spinner, disables interaction
- Icon-only variant for toolbar actions
- `asChild` for rendering as link (`<a>`) via Radix Slot

### Input

```
Types: text | email | password | search | number
Props: label, placeholder, error, helperText, disabled, required
```

- Error state: red border + error message below
- Helper text: muted text below input
- Password: toggle visibility icon

### Card

```
Subcomponents: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
Props: className
```

- Used for dashboard stats, content sections, forms
- Consistent padding and border radius

### Modal (Dialog)

```
Subcomponents: Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
Props: open, onOpenChange
```

- Accessible: focus trap, escape to close
- Overlay backdrop with animation
- Footer for action buttons (Cancel / Confirm)

### Layout

```
Subcomponents: AppShell, Sidebar, Header, Main, PageHeader
Props: collapsed (sidebar)
```

- Responsive: sidebar collapses to hamburger on mobile
- Header: logo, nav breadcrumbs, user avatar dropdown
- Sidebar: navigation links with active state

---

## Composite Components

### DataTable

```
Props: columns, data, pagination, sorting, onSort, onPageChange, loading, emptyState
```

- Column definitions with sortable flag
- Pagination controls (prev/next, page numbers)
- Loading skeleton rows
- Empty state with message and optional CTA

### SearchBar

```
Props: value, onChange, placeholder, debounceMs (default: 300)
```

- Debounced input to avoid excessive API calls
- Clear button when value is present
- Search icon prefix

### UserAvatar

```
Props: user (name, avatarUrl), size (sm | md | lg)
```

- Shows image if available, initials fallback
- Used in header, comments, lists

### StatusBadge

```
Props: status (active | inactive | pending | error)
```

- Color-coded: green/gray/yellow/red
- Consistent pill shape

---

## Form Patterns

### Form Layout

```
- Single column for simple forms
- Two column for settings pages (label left, input right)
- All forms use react-hook-form + zod validation
- Submit button disabled until valid
- Error summary at top for multi-field errors
```

### Confirmation Dialog

```
- Used before destructive actions (delete, remove)
- Title: "Are you sure?"
- Description: explains consequence
- Actions: Cancel (outline) | Confirm (destructive)
```

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| mobile | < 768px | Single column, hamburger nav |
| tablet | 768-1024px | Collapsed sidebar, 2-col grid |
| desktop | > 1024px | Full sidebar, 3-col grid |
