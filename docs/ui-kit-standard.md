# USDAF — UI Kit Standard v1.0

> Standard UI toolkit, design system, and component patterns for all USDAF frontend projects.

---

## Overview

The USDAF UI Kit defines the standard technology stack, component patterns, design tokens, and animation system for all frontend projects built under the USDAF framework. It is based on the **copy-paste component pattern** (not a dependency library) to ensure full ownership and customization.

**Boilerplate location**: `usdaf-ui-boilerplate/` (init from `ustaf-ui.gz`)

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React | 18.x | Component architecture |
| Build | Vite | 6.x | Fast dev server + optimized builds |
| Styling | Tailwind CSS | 3.4.x | Utility-first CSS |
| Component System | shadcn/ui | latest | Copy-paste component pattern (CVA + Radix UI) |
| Visual Effects | Magic UI | latest | Animated components (particles, beams, shimmer) |
| Animation | Framer Motion | 11.x | Declarative animation orchestration |
| Primitives | Radix UI | latest | Accessible, unstyled headless components |
| Variants | CVA (class-variance-authority) | 0.7.x | Type-safe component variant management |
| Icons | Lucide React | latest | Consistent icon set |
| Utilities | clsx + tailwind-merge | latest | Conditional class merging via `cn()` |

---

## Core Principles

1. **Copy-Paste, Not Install**: Components live in `src/components/ui/` as owned source code, not as npm dependencies. This gives full control over implementation and avoids dependency hell.

2. **Theme via CSS Variables**: All colors are HSL values defined as CSS custom properties. Theming is done by overriding variables, not by modifying component code.

3. **Variants via CVA**: Component variants (visual states) are defined using `class-variance-authority`. Each component has a `variants` object that maps variant names to Tailwind classes.

4. **Compose, Don't Configure**: Components are composed from smaller primitives (Radix UI). Use `asChild` (Radix Slot) to merge props onto custom elements instead of wrapping.

5. **Animate Intentionally**: Not everything needs animation. Use Framer Motion for:
   - Page transitions and section reveals (AnimatedContainer + AnimatedItem)
   - Directional entrances (FadeIn with direction)
   - Scale entrances for emphasis (ScaleIn)
   - Interactive feedback (whileHover, whileTap)

6. **Mobile-First, Responsive**: All components are mobile-first. Breakpoints expand upward: `sm:`, `md:`, `lg:`, `xl:`.

7. **Accessibility First**: WCAG 2.1 AA minimum. Use semantic HTML before ARIA. Radix primitives handle focus management, keyboard navigation, and screen reader support.

---

## Design Token System

### Color Architecture (HSL CSS Variables)

Colors are defined as HSL values (without the `hsl()` wrapper) in CSS variables and consumed via Tailwind:

```css
:root {
  /* Backgrounds & surfaces */
  --background: 0 0% 3.9%;          /* Page background */
  --foreground: 0 0% 98%;           /* Default text */
  --card: 0 0% 6%;                  /* Card surfaces */
  --card-foreground: 0 0% 98%;      /* Card text */
  --muted: 0 0% 14.9%;             /* Muted backgrounds */
  --muted-foreground: 0 0% 63.9%;  /* Muted text */

  /* Brand */
  --primary: 142.1 76.2% 36.3%;     /* Primary actions */
  --primary-foreground: 355.7 100% 97.3%;
  --secondary: 270 60% 50%;         /* Secondary actions */
  --secondary-foreground: 0 0% 98%;
  --accent: 47 100% 50%;            /* Accent/highlight */
  --accent-foreground: 0 0% 9%;

  /* Semantic */
  --destructive: 0 62.8% 50.6%;     /* Errors, deletions */
  --destructive-foreground: 0 0% 98%;

  /* UI chrome */
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 142.1 76.2% 36.3%;        /* Focus rings */
  --radius: 0.75rem;                 /* Border radius base */
}
```

**Light theme**: Override variables under `.light` or `[data-theme="light"]` class.

### Typography System

| Token | Font Family | Usage |
|-------|------------|-------|
| `font-display` | Space Grotesk | Headings, hero text, titles |
| `font-body` | DM Sans | Body text, UI labels, descriptions |
| `font-mono` | JetBrains Mono | Code, technical values, data |

### Animation Tokens

Pre-defined Tailwind animations available in `tailwind.config.js`:

| Animation | Class | Usage |
|-----------|-------|-------|
| Fade In | `animate-fade-in` | General entrance |
| Fade Out | `animate-fade-out` | Exit transitions |
| Slide Right | `animate-slide-in-right` | Panel entrance |
| Slide Left | `animate-slide-in-left` | Panel entrance |
| Scale In | `animate-scale-in` | Modal/popup entrance |
| Card Flip | `animate-card-flip` | Card reveal |
| Shimmer | `animate-shimmer` | Loading/highlight sweep |
| Pulse | `animate-pulse` | Subtle attention |
| Float | `animate-float` | Ambient motion |
| Glow | `animate-glow` | CTA emphasis |

---

## Component Library

### Base Components (shadcn/ui Pattern)

Every component follows this structure:

```jsx
// 1. Import utilities
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

// 2. Define variants with CVA
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", secondary: "...", ghost: "..." },
    size: { sm: "...", default: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});

// 3. Component with forwardRef + cn() for merge
const Button = forwardRef(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
```

### Available Components

| Component | File | Variants | Description |
|-----------|------|----------|-------------|
| **Button** | `button.jsx` | default, secondary, destructive, outline, ghost, link, glow, glass / sm, default, lg, xl, icon | Primary interaction element |
| **Card** | `card.jsx` | default, glass, glow, interactive | Surface container with header/content/footer composition |
| **Badge** | `badge.jsx` | default, secondary, accent, outline, destructive, glow | Status indicators, labels, tags |
| **ShimmerButton** | `shimmer-button.jsx` | — | CTA button with traveling shimmer effect |
| **BorderBeam** | `border-beam.jsx` | — | Animated beam orbiting container border |
| **Particles** | `particles.jsx` | — | Canvas-based floating particles background |
| **AnimatedContainer** | `animated.jsx` | — | Staggered children reveal (Framer Motion) |
| **AnimatedItem** | `animated.jsx` | — | Individual animated child (use inside AnimatedContainer) |
| **FadeIn** | `animated.jsx` | direction: up, down, left, right, none | Directional fade entrance |
| **ScaleIn** | `animated.jsx` | — | Scale + fade entrance |

### CSS Utility Classes

| Class | Effect | Usage |
|-------|--------|-------|
| `.glass` | Glassmorphism (blur + transparency + border) | Overlays, floating panels, modals |
| `.glass-strong` | Stronger glass effect | Important overlays |
| `.text-gradient-primary` | Primary color gradient text | Hero headings |
| `.text-gradient-accent` | Accent color gradient text | Feature highlights |
| `.bg-noise` | Subtle noise texture overlay | Backgrounds for depth |
| `.shimmer-border` | Animated shimmer border | Emphasis on containers |

---

## Component Variant Guidelines

### When to Use Which Variant

**Buttons:**
- `default` — Primary actions (submit, confirm, create)
- `secondary` — Secondary actions (filter, sort)
- `destructive` — Dangerous actions (delete, remove)
- `outline` — Tertiary actions, toggles
- `ghost` — Navigation, toolbar actions, minimal chrome
- `glow` — High-emphasis CTAs (hero sections, onboarding)
- `glass` — Floating actions, overlay controls

**Cards:**
- `default` — General content, lists, info panels
- `glass` — Overlays, floating modals, content over dynamic backgrounds
- `glow` — Key features, premium content, CTAs
- `interactive` — Clickable items, option selection, navigation cards

**Badges:**
- `default` — Status indicators on primary color
- `secondary` — Categorization, tags
- `accent` — Highlights, special features
- `outline` — Subtle labels, counts
- `glow` — Active states, new features
- `destructive` — Errors, warnings, critical status

---

## Animation Patterns

### Page Entrance Pattern

```jsx
<AnimatedContainer staggerDelay={0.1}>
  <AnimatedItem>
    <h1>Page Title</h1>
  </AnimatedItem>
  <AnimatedItem>
    <p>Description text</p>
  </AnimatedItem>
  <AnimatedItem>
    <div>Action buttons</div>
  </AnimatedItem>
</AnimatedContainer>
```

### Section Reveal Pattern

```jsx
<FadeIn direction="up" delay={0.2}>
  <Card variant="interactive">
    <CardContent>...</CardContent>
  </Card>
</FadeIn>
```

### Hero Section Pattern

```jsx
<div className="relative min-h-[70vh]">
  <Particles className="pointer-events-none" quantity={40} color="#4ade80" />
  <div className="relative z-10">
    <AnimatedContainer staggerDelay={0.15}>
      <AnimatedItem>
        <Badge variant="glow">Feature Badge</Badge>
      </AnimatedItem>
      <AnimatedItem>
        <h1 className="font-display text-5xl md:text-7xl">
          <span className="text-gradient-primary">Hero Text</span>
        </h1>
      </AnimatedItem>
      <AnimatedItem>
        <Button variant="glow" size="xl">CTA Button</Button>
      </AnimatedItem>
    </AnimatedContainer>
  </div>
</div>
```

### Emphasis Container Pattern (BorderBeam)

```jsx
<div className="relative overflow-hidden rounded-xl border">
  <BorderBeam size={200} duration={12} />
  <CardContent>Important content here</CardContent>
</div>
```

### Reduced Motion

ALWAYS respect `prefers-reduced-motion`:

```jsx
// Framer Motion handles this automatically with:
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  // Framer Motion respects prefers-reduced-motion by default
/>

// For CSS animations, add:
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Project Setup

### New Project Init

1. Copy the `usdaf-ui-boilerplate/` directory as your project base
2. Rename and update `package.json`
3. Run `npm install`
4. Customize CSS variables in `src/styles/globals.css` for your brand
5. Start adding pages — components are ready in `src/components/ui/`

### Adding to Existing Project

1. Install dependencies:
   ```bash
   npm install framer-motion class-variance-authority clsx tailwind-merge lucide-react
   npm install @radix-ui/react-slot
   ```
2. Copy `src/lib/utils.js` (the `cn()` function)
3. Copy `src/components/ui/` directory
4. Merge `tailwind.config.js` tokens into your existing config
5. Merge CSS variables from `src/styles/globals.css`

### Adding New shadcn/ui Components

shadcn/ui components are copy-pasted, not installed. To add a new component:

1. Visit [ui.shadcn.com](https://ui.shadcn.com)
2. Find the component you need
3. Copy the source code into `src/components/ui/[name].jsx`
4. Adapt to your theme (components use the same CSS variable system)
5. Export from `src/components/ui/index.js`

### Adding New Magic UI Components

1. Visit [magicui.design](https://magicui.design)
2. Find the effect component you need
3. Copy the source code into `src/components/ui/[name].jsx`
4. Adapt colors to use `hsl(var(--primary))` etc.
5. Export from `src/components/ui/index.js`

---

## File Structure Convention

```
src/
├── components/
│   ├── ui/              # Base components (shadcn/ui + Magic UI)
│   │   ├── index.js     # Barrel exports
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── badge.jsx
│   │   ├── animated.jsx
│   │   ├── particles.jsx
│   │   ├── border-beam.jsx
│   │   ├── shimmer-button.jsx
│   │   └── [component].jsx
│   ├── layout/          # Layout components (Sidebar, Header, Footer, PageShell)
│   ├── features/        # Feature-specific composed components
│   └── forms/           # Form-specific components (inputs, selects, validators)
├── lib/
│   └── utils.js         # cn() utility
├── styles/
│   └── globals.css      # CSS variables, theme, utility classes
├── hooks/               # Custom React hooks
├── context/             # React context providers
├── pages/               # Route-level page components
└── assets/              # Static assets (fonts, images)
```

---

## Quality Checklist (for UI Builder Agent 16)

Before marking a UI component/page as complete:

- [ ] **4 States**: Component handles loading, error, empty, and populated states
- [ ] **Keyboard**: All interactive elements accessible via keyboard (Tab, Enter, Escape)
- [ ] **Labels**: Every form input has an associated `<label>` (not just placeholder)
- [ ] **Contrast**: Text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large)
- [ ] **Responsive**: Renders correctly at 320px, 768px, 1024px, 1440px
- [ ] **Reduced Motion**: Animations respect `prefers-reduced-motion`
- [ ] **Focus Visible**: Focus ring visible on keyboard navigation (`:focus-visible`)
- [ ] **Design Tokens**: Uses theme CSS variables, no hardcoded colors
- [ ] **Variants via CVA**: Visual variants defined with CVA, not inline conditionals
- [ ] **forwardRef**: Component forwards ref for parent composition
- [ ] **cn() Merge**: Class merging uses `cn()` to allow consumer overrides

---

## Referenced Libraries — Quick Reference

### shadcn/ui (https://ui.shadcn.com)
- **Pattern**: Copy-paste source code into your project (not npm install)
- **70+ components**: Accordion, Alert, Badge, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker, Dialog, Drawer, Dropdown Menu, Form, Hover Card, Input, Label, Menubar, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Skeleton, Slider, Sonner (toast), Switch, Table, Tabs, Textarea, Toggle, Tooltip
- **Built on**: Radix UI (primitives) + Tailwind CSS (styling) + CVA (variants)
- **5 Principles**: Open Code, Composition, Distribution, Beautiful Defaults, AI-Ready

### Magic UI (https://magicui.design)
- **Pattern**: Animated effect components, also copy-paste
- **Categories**: Background effects (Particles, Aurora, Grid), Border effects (BorderBeam, Shine Border), Button effects (ShimmerButton, Pulsating Button), Text effects (Shiny Text, Typing Animation, Marquee), Motion (Orbit, Meteors, Ripple)
- **Integration**: Uses same CSS variable system as shadcn/ui, same Tailwind setup
- **20k+ GitHub stars**, MIT licensed, community-driven

### Framer Motion
- **Pattern**: Declarative animation with React components
- **Key APIs**: `motion.div`, `initial/animate/exit`, `variants` (stagger), `whileHover/whileTap`, `AnimatePresence` (exit animations), `useInView` (scroll triggers)
- **Respects** `prefers-reduced-motion` automatically
