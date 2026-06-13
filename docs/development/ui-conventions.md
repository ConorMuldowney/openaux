# UI Conventions & Development Standards

- **Owner:** Platform Engineering
- **Last reviewed:** 2026-06-13
- **Status:** Active

This guide establishes conventions for UI development in OpenAux. We use **shadcn/ui** for component primitives, **Tailwind CSS** for styling, and **domain-driven naming** for semantic wrappers. All developers should follow these standards to maintain consistency, accessibility, and modularity.

## Table of Contents

1. [Component Strategy](#component-strategy)
2. [Styling & Theming](#styling--theming)
3. [Accessibility Standards](#accessibility-standards)
4. [Component Organization](#component-organization)
5. [Dark Mode & Responsiveness](#dark-mode--responsiveness)
6. [Enforcement](#enforcement)
7. [PR Checklist](#pr-checklist)

---

## Enforcement

These standards are enforced by automation:

- ESLint a11y rules in [eslint.config.mjs](../../eslint.config.mjs)
- UI convention checks in [scripts/check-ui-conventions.mjs](../../scripts/check-ui-conventions.mjs)
- Lint pipeline in [package.json](../../package.json) via `npm run lint`
- CI quality job in [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

Run locally before opening a PR:

```bash
npm run lint
```

If the checks fail, treat them as required fixes (not optional style feedback).

---

## Component Strategy

We follow a **hybrid approach**: use shadcn components directly for generic utilities, but wrap domain-specific composites in semantic components that enforce our vocabulary.

### Rule 1: Use shadcn Components Directly When Possible

Import shadcn primitives directly from `@/components/ui/` for generic UI needs. Don't wrap them unnecessarily.

**✅ Do:**
```tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  return (
    <>
      <Button variant="default">Sign In</Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Settings</Button>
        </DialogTrigger>
        <DialogContent>
          <Input placeholder="Search..." />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**❌ Don't:**
```tsx
// Don't create unnecessary wrappers around shadcn primitives
function MyButton(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} />;
}

function MyInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} />;
}
```

### Rule 2: Wrap for Domain Semantics

Create semantic wrappers when composing components around **domain concepts** from [CONTEXT.md](../../CONTEXT.md). This enforces OpenAux language and makes global style updates easier.

**✅ Do:**
```tsx
// Wrapping to express domain semantics
import { Card } from "@/components/ui/card";

interface SubmissionCardProps {
  entry: Entry;
  showcase: Showcase;
}

export function SubmissionCard({ entry, showcase }: SubmissionCardProps) {
  return (
    <Card className="p-4">
      <h3 className="font-bold">{entry.title}</h3>
      <p className="text-sm text-foreground/75">{showcase.name}</p>
    </Card>
  );
}
```

**❌ Don't:**
```tsx
// Don't use generic Card for domain objects
export function HomePage() {
  return (
    <Card>
      <h3>{entry.title}</h3>
    </Card>
  );
}
```

### Rule 3: Respect Component Boundaries

Don't modify shadcn component internals unless extending their public API. If shadcn doesn't provide what you need, create a new wrapper or file an issue—don't hack around it.

**✅ Do:**
```tsx
import { Button } from "@/components/ui/button";

export function PrimaryActionButton(props: React.ComponentProps<typeof Button>) {
  return <Button variant="default" size="lg" {...props} />;
}
```

**❌ Don't:**
```tsx
import { Button } from "@/components/ui/button";
import styles from "./button.module.css";

export function PrimaryActionButton(props: React.ComponentProps<typeof Button>) {
  // Don't reach into the Button's internals
  return (
    <Button {...props} className={`${props.className} ${styles.custom}`} />
  );
}
```

---

## Styling & Theming

### Rule 4: Semantic Tokens for All Colors & Surfaces

Always use semantic theme tokens for colors and surfaces. Never hardcode hex, rgb, or hsl values. Tokens are defined in [app/globals.css](../../app/globals.css).

Available semantic tokens:
- **Colors:** `background`, `foreground`, `card`, `card-foreground`, `primary`, `secondary`, `accent`, `muted`, `destructive`, `border`, `input`
- **Composite:** `popover`, `sidebar`, `chart-1` through `chart-5`

**✅ Do:**
```tsx
export function ShowcaseCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <h2 className="font-bold">Showcase Title</h2>
      <p className="text-sm text-foreground/75">Secondary text</p>
      <button className="bg-accent text-accent-foreground">Vote</button>
    </div>
  );
}
```

**❌ Don't:**
```tsx
// Don't hardcode colors
export function ShowcaseCard() {
  return (
    <div className="bg-white border-gray-200 p-4" style={{ color: "#1a1f2e" }}>
      <h2>Showcase Title</h2>
    </div>
  );
}
```

### Rule 5: Use Tailwind Utilities Freely for Layout & Spacing

Layout, spacing, sizing, and responsive breakpoints are pure utilities—use them without restraint.

**✅ Do:**
```tsx
export function PageLayout() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <section className="space-y-3">
        <h1 className="text-4xl font-bold">Title</h1>
        <p className="text-base leading-relaxed">Description</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Cards */}
      </div>
    </main>
  );
}
```

**Commonly used utility classes:**
- Layout: `flex`, `grid`, `absolute`, `sticky`
- Spacing: `gap-`, `p-`, `m-`, `space-y-`, `space-x-`
- Sizing: `w-`, `h-`, `min-`, `max-`
- Rounding: `rounded-`, `rounded-full`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`
- Borders: `border`, `border-l`, `border-t`, `border-r`, `border-b`

### Rule 6: Define Semantic Opacity Variants

Use Tailwind opacity syntax (`/75`, `/50`) for semantic text hierarchy. These are the approved patterns:

- **Primary text:** No opacity modifier (e.g., `text-foreground`)
- **Secondary text:** `/75` opacity (e.g., `text-foreground/75`)
- **Tertiary text:** `/50` opacity (e.g., `text-foreground/50`)

**✅ Do:**
```tsx
<div>
  <h3 className="font-bold text-foreground">Primary Heading</h3>
  <p className="text-sm text-foreground/75">Secondary description</p>
  <p className="text-xs text-foreground/50">Tertiary hint</p>
</div>
```

**❌ Don't:**
```tsx
// Don't invent new opacity levels
<p className="text-foreground/60">Weird opacity</p>
<p className="text-foreground/33">Random opacity</p>
```

---

## Accessibility Standards

### Rule 7: Keyboard Navigation & Focus States

All interactive elements must be keyboard-navigable with visible focus indicators. Use shadcn components, which include `:focus-visible` by default. Never remove focus rings without providing an alternative.

**✅ Do:**
```tsx
import { Button } from "@/components/ui/button";

export function ActionButtons() {
  return (
    <div className="flex gap-2">
      <Button>Primary Action</Button>
      <Button variant="outline">Secondary Action</Button>
    </div>
  );
}
// Focus rings are built-in—users can Tab to and navigate with keyboard
```

**❌ Don't:**
```tsx
// Don't strip focus rings
export function ActionButtons() {
  return (
    <button className="outline-none">No focus indicator!</button>
  );
}
```

### Rule 8: Use ARIA Attributes for Non-Semantic HTML

If you build a custom interactive element with `<div>`, `<span>`, or other non-semantic tags, include ARIA attributes so assistive technology understands its role.

**✅ Do:**
```tsx
// Semantic: screen readers understand it's a button
<button onClick={handleClick}>Vote</button>

// Non-semantic: add ARIA to make it accessible
<div
  role="button"
  tabIndex={0}
  aria-label="Vote for this entry"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") handleClick();
  }}
>
  Vote
</div>
```

**❌ Don't:**
```tsx
// Non-semantic without ARIA—inaccessible
<div onClick={handleClick}>Vote</div>
```

### Rule 9: Color + Text/Icon for Meaning

Never use color alone to convey meaning. Pair color with text, icons, or patterns so colorblind users understand.

**✅ Do:**
```tsx
import { AlertCircle, CheckCircle } from "lucide-react";

// Error: red + icon + text
<div className="flex items-center gap-2 text-destructive">
  <AlertCircle className="size-4" />
  <span>This field is required</span>
</div>

// Success: green + icon + text
<div className="flex items-center gap-2 text-primary">
  <CheckCircle className="size-4" />
  <span>Changes saved</span>
</div>
```

**❌ Don't:**
```tsx
// Error: red color only—colorblind users miss it
<div className="text-destructive">This field is required</div>

// Status indicator without context
<div className="size-3 rounded-full bg-destructive" />
```

### Rule 10: Form Labels Are Required

All form inputs must have labels. Use visible labels when possible; `aria-label` only when space is constrained.

**✅ Do:**
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SearchForm() {
  return (
    <div className="space-y-2">
      <Label htmlFor="search">Search showcases</Label>
      <Input id="search" placeholder="Type to search..." />
    </div>
  );
}
```

**❌ Don't:**
```tsx
// Placeholder is not a label
<Input placeholder="Search showcases..." />

// Missing label entirely
<Input />
```

---

## Component Organization

### Rule 11: File Structure & Import Paths

Components are organized by scope:

```
components/
├── ui/                          ← shadcn primitives only
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── theme-toggle.tsx             ← cross-module semantic wrappers
├── pagination.tsx
└── ...

src/
└── modules/
    ├── submissions/
    │   ├── components/          ← submission-specific UI
    │   │   ├── submission-card.tsx
    │   │   └── submission-form.tsx
    │   ├── index.ts
    │   └── ...
    ├── ballots/
    │   ├── components/
    │   │   ├── ballot-card.tsx
    │   │   └── ranked-ballot-form.tsx
    │   └── ...
    └── ...
```

**Import rules:**
- `import { Button } from "@/components/ui/button"` — shadcn primitives
- `import { ThemeToggle } from "@/components/theme-toggle"` — cross-module wrappers
- `import { SubmissionCard } from "@/src/modules/submissions/components/submission-card"` — module-specific

### Rule 12: Keep Components Close to Usage

If a component is used in only one module, define it in that module's `components/` folder. If it's used across multiple modules, move it to `components/` at the root.

**✅ Do:**
```tsx
// In src/modules/ballots/components/ballot-card.tsx
// (used only by ballots module)

// In components/showcase-header.tsx
// (used by multiple modules: submissions, ballots, visibility)
```

**❌ Don't:**
```tsx
// Don't scatter components
// (e.g., one-off component in src/pages/ that belongs in a module's components/)
```

---

## Dark Mode & Responsiveness

### Rule 13: Dark Mode via Semantic Tokens

Dark mode support is built into semantic tokens. The `.dark` class on `<html>` switches all colors automatically. Developers rarely need to write `dark:` variants.

**✅ Do:**
```tsx
// Automatic dark mode—no dark: variants needed
export function ShowcaseCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-foreground">Title</h2>
      <p className="text-foreground/75">Subtitle</p>
    </div>
  );
}
// Light mode: white background, dark text
// Dark mode: dark background, light text (automatic)
```

**❌ Don't:**
```tsx
// Don't repeat colors with dark: variants
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
  Content
</div>
```

### Rule 14: Use `dark:` Only for Exceptions

Use the `dark:` Tailwind variant only when dark mode needs special handling (e.g., different opacity, border style, or opacity adjustments).

**✅ Do:**
```tsx
// Border needs to be more subtle in dark mode
<div className="border border-border dark:border-border/50">Content</div>

// Icon stroke needs adjustment
<Icon className="stroke-foreground dark:stroke-foreground/75" />
```

**❌ Don't:**
```tsx
// Don't use dark: for colors already managed by semantic tokens
<div className="bg-white dark:bg-slate-900">Content</div>
```

### Rule 15: Mobile-First Responsive Design

Write base styles for mobile, then add `sm:`, `md:`, `lg:`, `xl:` breakpoints for larger screens. Follow Tailwind's defaults—don't create custom breakpoints unless justified.

**✅ Do:**
```tsx
// Mobile-first: base styles apply to all sizes
// Then progressively enhance for larger screens
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {showcases.map((showcase) => (
    <div key={showcase.id} className="space-y-2">
      <h3 className="text-lg font-bold sm:text-xl lg:text-2xl">
        {showcase.name}
      </h3>
      <p className="text-sm sm:text-base">{showcase.description}</p>
    </div>
  ))}
</div>
```

**❌ Don't:**
```tsx
// Don't write desktop-first
<div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
  {/* Wrong order */}
</div>

// Don't create custom breakpoints without justification
<div className="grid-cols-2 @1200px:grid-cols-3">
  {/* Use only if Tailwind defaults don't fit */}
</div>
```

### Rule 16: Use Tailwind's Default Breakpoints

Stick to Tailwind's breakpoint scale: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px). If you need a custom breakpoint, document the reason in a comment.

**Tailwind defaults:**
```
base (mobile)
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## PR Checklist

Before submitting a UI-related PR, verify the following:

### Component & Code Quality
- [ ] All interactive elements are keyboard-navigable (Tab, Enter, Space work)
- [ ] Focus states are visible (no `outline-none` without alternatives)
- [ ] ARIA attributes are present for non-semantic HTML (role, aria-label, etc.)
- [ ] Form inputs have labels (visible or `aria-label`)
- [ ] Color conveys meaning + text/icon (not color alone)
- [ ] shadcn components are used directly when possible (no unnecessary wraps)
- [ ] Domain semantic wrappers reflect OpenAux vocabulary (from CONTEXT.md)
- [ ] No hardcoded color hex/rgb—all colors use semantic tokens

### Styling & Layout
- [ ] All colors use semantic tokens (`text-foreground`, `bg-card`, `border-border`)
- [ ] Opacity variants follow approved pattern (none, `/75`, `/50` for text hierarchy)
- [ ] Layout uses Tailwind utilities (`flex`, `grid`, `gap-`, `p-`)
- [ ] Responsive breakpoints follow mobile-first approach (`sm:`, `md:`, `lg:`)
- [ ] No custom breakpoints (unless justified in comment)
- [ ] `dark:` variants only for exceptions (borders, opacity tweaks)

### Dark Mode & Responsiveness
- [ ] Component tested in both light and dark modes
- [ ] No visual glitches when toggling dark mode
- [ ] Responsive layout tested on mobile, tablet, desktop
- [ ] No hardcoded widths or heights that break responsive flow

### Organization
- [ ] shadcn primitives are in `components/ui/`
- [ ] Cross-module wrappers are in `components/`
- [ ] Module-specific components are in `src/modules/{moduleName}/components/`
- [ ] Import paths are correct for component scope

### Accessibility
- [ ] Component passes keyboard navigation test
- [ ] Screen reader (e.g., NVDA, JAWS) can understand interactive elements
- [ ] Color contrast meets WCAG AA standards (use tools like WebAIM)
- [ ] No placeholder-as-label patterns

---

## References

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OpenAux Domain Language](../../CONTEXT.md)
- [OpenAux Architecture Decisions](../adr/)
