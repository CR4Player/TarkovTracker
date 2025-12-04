# App Structure Guide

This document explains the organization and separation of concerns between `app.vue`, layouts, shell components, and pages.

## Project Philosophy

**TarkovTracker prioritizes pragmatism over complexity:**

1. **Keep it flat** - Avoid deep nesting unless absolutely necessary
   - ✅ `/app/shell/AppBar.vue` (2 levels)
   - ❌ `/app/features/layout/components/AppBar.vue` (4 levels)
2. **Avoid over-abstraction** - Don't create layers "just in case"
   - ✅ Extract when you have actual duplication or complexity
   - ❌ Create wrappers and abstractions speculatively
3. **Minimize indirection** - Code should be easy to trace and find
   - ✅ Direct imports and clear paths
   - ❌ Multiple wrapper components with no clear purpose
     **Guiding question:** "Does this abstraction solve a real problem I have right now?"
     If the answer is "it might be useful someday" → **don't do it yet**.

## Overview

TarkovTracker follows a **clear hierarchy** to avoid over-abstraction while maintaining clean separation:

```
app.vue (Root wrapper)
  └─> layouts/default.vue (Page layout)
        └─> shell/* components (Header, nav, footer)
              └─> pages/* (Page content)
```

## File Responsibilities

### `app.vue` - Root Application Wrapper

**Location:** `/app/app.vue`
**Purpose:** Global app wrapper that runs once and stays mounted for the entire session.
**Should contain:**

- ✅ Global providers (`<UApp>`, error boundaries)
- ✅ App-wide initialization (via composables like `useAppInitialization`)
- ✅ Portal targets for modals/toasts (`<div id="modals">`)
- ✅ Components needed on **EVERY** page/layout
- ✅ Root-level routing components (`<NuxtLayout>`, `<NuxtPage>`)
  **Should NOT contain:**
- ❌ Layout-specific structure (headers, footers, navigation)
- ❌ Styling classes (backgrounds, text colors, spacing)
- ❌ Complex initialization logic (extract to composables)
- ❌ Business logic or state management
  **Example:**

```vue
<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <div id="modals"></div>
  </UApp>
</template>
<script setup lang="ts">
  import { useAppInitialization } from '@/composables/useAppInitialization';
  useAppInitialization();
</script>
```

**Why keep it minimal?**

- `app.vue` cannot be changed without reloading the entire app
- Complex logic here is harder to test and debug
- Layout concerns should be in layouts, not the root wrapper

---

### `layouts/default.vue` - Page Layout Structure

**Location:** `/app/layouts/default.vue`
**Purpose:** Defines the visual structure and layout for pages (header, navigation, content area, footer).
**Should contain:**

- ✅ Shell components (AppBar, NavDrawer, AppFooter)
- ✅ Layout-specific styling (backgrounds, spacing, responsive behavior)
- ✅ Layout state management (drawer open/closed, breakpoints)
- ✅ Main content slot (`<slot />`) for page content
  **Should NOT contain:**
- ❌ Global providers (those go in `app.vue`)
- ❌ Page-specific content (that goes in pages)
- ❌ Business logic (use stores/composables)
  **Example:**

```vue
<template>
  <div class="bg-background text-surface-200 flex min-h-screen flex-col">
    <NavDrawer />
    <AppBar :style="{ left: mainMarginLeft }" />
    <main :style="{ marginLeft: mainMarginLeft }">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
```

**When to create additional layouts:**

- Authentication pages (no header/footer)
- Admin dashboard (different navigation)
- Public marketing pages (different header)
  **Don't create extra layouts** unless you have genuinely different page structures.

---

### `shell/*` - App Shell Components

**Location:** `/app/shell/`
**Purpose:** Reusable structural components that form the app's "chrome" (header, navigation, footer).
**Current components:**

- `AppBar.vue` - Top header with title, game mode toggle, language selector
- `NavDrawer.vue` - Side navigation drawer with menu items
- `AppFooter.vue` - Bottom footer with links and info
  **Should contain:**
- ✅ Layout structural elements (headers, footers, navigation)
- ✅ Components used in layouts (not feature-specific)
- ✅ Responsive behavior for layout elements
  **Should NOT contain:**
- ❌ Feature-specific components (those go in `features/`)
- ❌ Form inputs or business logic components
- ❌ Page content
  **Why separate from `layouts/`?**
- Layouts compose shell components
- Shell components can be lazy-loaded for performance
- Easier to test components in isolation
- Clear separation: layouts = composition, shell = components

---

### `composables/useAppInitialization.ts` - App Initialization Logic

**Location:** `/app/composables/useAppInitialization.ts`
**Purpose:** Handles one-time app initialization when the app mounts.
**Responsibilities:**

- Locale setup from user preferences
- Supabase sync initialization for authenticated users
- Legacy data migration
  **Why extract from `app.vue`?**
- ✅ Keeps `app.vue` clean and focused
- ✅ Logic is testable in isolation
- ✅ Self-documenting with JSDoc comments
- ✅ Reusable if needed elsewhere

---

## Decision Tree: Where Does This Code Go?

### "Where should I put this component?"

```
Is it used on EVERY page regardless of layout?
├─ Yes → app.vue (rare - think global error boundaries, providers)
└─ No → Is it structural (header, footer, nav)?
    ├─ Yes → shell/ (AppBar, NavDrawer, AppFooter)
    └─ No → Is it feature-specific (tasks, team, hideout)?
        ├─ Yes → features/{domain}/
        └─ No → components/ (generic, reusable)
```

### "Where should I put this initialization logic?"

```
Does it run once when the app starts?
├─ Yes → Is it more than 5-10 lines?
│   ├─ Yes → Create composable, import in app.vue
│   └─ No → Can live in app.vue script
└─ No → Does it run per route/page?
    ├─ Yes → Page component or route middleware
    └─ No → Store or composable
```

### "Should I create a new layout?"

```
Do I need a COMPLETELY different page structure?
├─ Yes (e.g., auth page with no header/nav) → Create new layout
└─ No (just different content/styling) → Use pages and components
```

---

## Anti-Patterns to Avoid

### ❌ Over-abstraction

**Bad:**

```
app.vue → StandardLayout.vue → LayoutWrapper.vue → ActualLayout.vue
```

**Good:**

```
app.vue → layouts/default.vue → shell components
```

## **Why?** Unnecessary layers make code harder to follow with no benefit.

### ❌ Duplicate styling

**Bad:**

```vue
<!-- app.vue -->
<div class="bg-background text-surface-200 flex min-h-screen">
<!-- layouts/default.vue -->
<div class="bg-background text-surface-200 flex min-h-screen">
```

**Good:**

```vue
<!-- app.vue -->
<UApp>
  <NuxtLayout><NuxtPage /></NuxtLayout>
</UApp>
<!-- layouts/default.vue -->
<div class="bg-background text-surface-200 flex min-h-screen">
```

## **Why?** Styling belongs in layouts, not the root wrapper.

### ❌ Complex logic in app.vue

**Bad:**

```vue
<script setup lang="ts">
  onMounted(async () => {
    // 50 lines of initialization logic
  });
</script>
```

**Good:**

```vue
<script setup lang="ts">
  import { useAppInitialization } from '@/composables/useAppInitialization';
  useAppInitialization();
</script>
```

## **Why?** Keeps app.vue clean, logic testable.

### ❌ Shell components in wrong folder

**Bad:**

```
features/layout/AppBar.vue  ❌ (layout is not a "feature")
components/AppBar.vue       ❌ (not generic enough)
```

**Good:**

```
shell/AppBar.vue            ✅ (app structural component)
```

## **Why?** Clear semantic separation improves discoverability.

## Current Structure

```tree
app/
├── app.vue                          # Root wrapper (minimal)
├── layouts/
│   └── default.vue                  # Main page layout (uses shell components)
├── shell/
│   ├── AppBar.vue                   # Top header
│   ├── NavDrawer.vue                # Side navigation
│   └── AppFooter.vue                # Bottom footer
├── pages/
│   ├── index.vue                    # Dashboard
│   ├── tasks.vue                    # Tasks page
│   └── ...                          # Other pages
├── features/                        # Feature-specific components
│   ├── tasks/                       # Task-related components
│   ├── team/                        # Team-related components
│   └── ...
├── components/                      # Generic reusable components
├── composables/
│   ├── api/                         # API-related composables
│   │   ├── useEdgeFunctions.ts      # Supabase edge function calls
│   │   └── useTarkovCache.ts        # Cache management composable
│   ├── supabase/                    # Supabase sync utilities
│   │   ├── useSupabaseSync.ts       # Store-to-Supabase sync
│   │   └── useSupabaseListener.ts   # Real-time listeners
│   ├── i18nHelpers.ts               # Locale utilities
│   ├── useAppInitialization.ts      # App startup logic
│   ├── useGraphBuilder.ts           # Task/hideout graph construction
│   └── ...
└── utils/
    ├── constants.ts                 # Game constants, mappings
    ├── dataMigrationService.ts      # Migration + validation (consolidated)
    ├── graphHelpers.ts              # Pure graph functions
    ├── helpers.ts                   # Generic utilities (debounce, get, set)
    ├── logger.ts                    # Logging + dev utilities
    ├── storeHelpers.ts              # Pinia store utilities
    └── tarkovCache.ts               # IndexedDB cache (low-level)
```

---

## File Size Guidelines

**Target file sizes:**

- **Minimum**: Consolidate files under 50 LOC unless reused in multiple places
- **Maximum**: Break down files over 500 LOC into logical units when possible

### When to Consolidate (<50 LOC)

✅ **Do consolidate** when:

- A file contains a single small utility function
- The file is only used in one place
- Related utilities are scattered across multiple tiny files

❌ **Don't consolidate** when:

- The small file is imported by 3+ other files
- It's a type definition file (keep types isolated)
- It represents a distinct, reusable concept

**Example**: `dataValidationUtils.ts` (unused, 90 LOC) was merged into `dataMigrationService.ts` since they're tightly coupled.

### When to Split (>500 LOC)

✅ **Do split** when:

- The file has clearly separable concerns
- Different parts have different dependencies
- Testing would benefit from isolation

❌ **Don't split** when:

- The code is cohesive and interdependent
- Splitting would require passing many parameters between files
- The file is a store with related state/actions/getters

**Example**: `useGraphBuilder.ts` was extracted from `useMetadata.ts` because graph algorithms are independent of data fetching.

### Single-File Folders

**Always flatten single-file folders:**

```
❌ composables/utils/i18nHelpers.ts  (unnecessary nesting)
✅ composables/i18nHelpers.ts        (flat structure)
```

### Singleton Composables for Performance

**Testing Implications for Singletons:**

Singleton composables persist state across test runs, which can lead to test pollution. To ensure test isolation, either expose a reset function to clear state or use module resetting to recreate the singleton for each test.

**Example: Isolation with `vi.resetModules()`**

```typescript
import { beforeEach, vi } from 'vitest';

describe('Singleton Composable', () => {
  beforeEach(() => {
    // Clears module cache so the singleton is recreated on next import
    vi.resetModules();
  });

  test('starts with fresh state', async () => {
    // Dynamically import the composable to trigger re-initialization
    const { useSharedBreakpoints } = await import('~/composables/useSharedBreakpoints');
    // ... assertions
  });
});
```

**Use singleton patterns for shared browser APIs:**

When multiple components need the same browser API (resize observers, breakpoints, etc.), create a singleton composable to avoid N components creating N listeners.

**Example: Shared Breakpoints**

```typescript
// composables/useSharedBreakpoints.ts
import { useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';

// Create listeners ONCE at module load (singleton)
const breakpoints = useBreakpoints({ mobile: 0, sm: 600, md: 960 });
const xsRef = breakpoints.smaller('sm');
const belowMdRef = breakpoints.smaller('md');

export function useSharedBreakpoints() {
  // Return readonly computed refs wrapping the singletons
  return {
    xs: computed(() => xsRef.value),
    belowMd: computed(() => belowMdRef.value),
  };
}
```

**Usage:**

```typescript
// Instead of creating new breakpoint listeners per component:
❌ const breakpoints = useBreakpoints({ mobile: 0, md: 960 });
❌ const belowMd = breakpoints.smaller('md');

// Use the shared singleton:
✅ const { belowMd } = useSharedBreakpoints();
```

**When to use this pattern:**

- Breakpoint/viewport detection
- Shared scroll position tracking
- Browser feature detection
- Any browser API where many components need the same data

---

## Best Practices Summary

1. **Keep `app.vue` minimal** - Only global providers and initialization
2. **Use layouts for structure** - Headers, footers, navigation composition
3. **Shell components for chrome** - Reusable structural elements
4. **Extract complex logic** - Use composables for initialization/setup
5. **Avoid over-abstraction** - Don't create layers without clear benefit
6. **Semantic organization** - Files should live where developers expect them
7. **Right-size files** - Consolidate <50 LOC, split >500 LOC when logical
8. **Flatten single-file folders** - Move file up, delete empty folder

---

## When to Refactor

Consider refactoring when:

- ✅ You have 3+ similar layouts → Extract common shell components
- ✅ `app.vue` exceeds 20 lines → Extract logic to composables
- ✅ Components are hard to find → Review folder organization
- ✅ A file exceeds 500 LOC → Look for separable concerns
- ✅ Multiple tiny related files → Consolidate if not widely reused
- ✅ Single file in a subfolder → Flatten the structure
- ❌ "Just in case" → Don't abstract until you need it

**Remember:** Premature abstraction is worse than a bit of duplication. Refactor when the pain is real, not hypothetical.
